from __future__ import annotations

import asyncio
import logging
from datetime import timedelta
from typing import Any
from urllib.parse import quote, urlencode, unquote

from apify_client import ApifyClient

from api.config import settings
from api.models.search import SearchFilters
from api.services.cache import cache_properties

logger = logging.getLogger(__name__)


class ApifyConfigError(RuntimeError):
    pass


class ApifyRequestError(RuntimeError):
    pass


def is_apify_property_id(property_id: str) -> bool:
    return property_id.startswith("apify:")


def _client() -> ApifyClient:
    if not settings.apify_token:
        raise ApifyConfigError("APIFY_TOKEN is not configured")
    return ApifyClient(settings.apify_token)


# ─── public async API ──────────────────────────────────────────────────────────

async def search_properties(
    query: str,
    filters: SearchFilters,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    sources = _active_sources()
    if not sources:
        raise ApifyConfigError(
            "No Apify actors configured. Set at least one of: "
            "APIFY_99ACRES_ACTOR, APIFY_HOUSING_ACTOR"
        )

    per_source = max(limit * page * 3 // len(sources), 10)

    async def _fetch_one(source: str, actor_id: str) -> list[dict[str, Any]]:
        try:
            items = await asyncio.to_thread(_run_actor, actor_id, source, query, filters, per_source)
            logger.info("Apify %s returned %d properties", source, len(items))
            return items
        except Exception as exc:
            logger.warning("Apify %s failed: %s", source, exc)
            return []

    results_per_source = await asyncio.gather(*[
        _fetch_one(source, actor_id) for source, actor_id in sources.items()
    ])

    all_props = [prop for source_props in results_per_source for prop in source_props]
    await cache_properties(all_props)
    start = (page - 1) * limit
    return all_props[start : start + limit], len(all_props)


async def get_property_detail(external_id: str) -> dict[str, Any] | None:
    parts = external_id.split(":", 2)
    if len(parts) < 3 or parts[0] != "apify":
        return None
    source, encoded_url = parts[1], parts[2]
    url = unquote(encoded_url)
    return await asyncio.to_thread(_sync_detail, source, url)


# ─── sync workers (executed in thread pool) ────────────────────────────────────


def _sync_detail(source: str, url: str) -> dict[str, Any] | None:
    actor_map = {
        "99acres": settings.apify_99acres_actor,
        "magicbricks": settings.apify_magicbricks_actor,
        "nobroker": settings.apify_nobroker_actor,
        "housing": settings.apify_housing_actor,
    }
    actor_id = actor_map.get(source)
    if not actor_id:
        return None

    client = _client()
    run = client.actor(actor_id).call(
        run_input=_build_actor_input(source, [{"url": url}], 1, filters=None),
        wait_duration=timedelta(seconds=60),
    )
    if not run:
        return None

    items = list(client.dataset(run.default_dataset_id).iterate_items())
    if not items:
        return None
    return _normalize(items[0], source=source)


def _run_actor(
    actor_id: str,
    source: str,
    query: str,
    filters: SearchFilters,
    limit: int,
) -> list[dict[str, Any]]:
    client = _client()
    search_url = _build_search_url(source, query, filters)
    run = client.actor(actor_id).call(
        run_input=_build_actor_input(source, [{"url": search_url}], limit, filters=filters),
        wait_duration=timedelta(seconds=120),
    )
    if not run:
        raise ApifyRequestError(f"Actor {actor_id} produced no run")

    items = list(client.dataset(run.default_dataset_id).iterate_items())
    raw = [
        prop
        for item in items
        if (prop := _normalize(item, source=source, filters=filters))
    ]
    matched = [p for p in raw if _location_matches(p, filters)]
    if raw and not matched:
        logger.warning(
            "Apify %s: actor returned %d results but 0 matched location "
            "(city=%r locality=%r) — actor may be ignoring location input.",
            source, len(raw), filters.city, filters.locality,
        )
    return matched


def _location_matches(prop: dict[str, Any], filters: SearchFilters) -> bool:
    """Return False when a specific city/locality was requested but the property is elsewhere."""
    city_req = (filters.city or "").lower().strip()
    loc_req = (filters.locality or "").lower().strip()
    if not city_req and not loc_req:
        return True  # no location filter — accept everything

    haystack = " ".join(filter(None, [
        (prop.get("city") or "").lower(),
        (prop.get("locality") or "").lower(),
        (prop.get("address") or "").lower(),
    ]))
    return (city_req and city_req in haystack) or (loc_req and loc_req in haystack)


def _build_actor_input(
    source: str,
    urls: list[dict],
    max_items: int,
    filters: "SearchFilters | None" = None,
) -> dict[str, Any]:
    url_values = [str(item["url"]) for item in urls if item.get("url")]

    if source == "99acres":
        return {
            "urls": url_values,
            "max_items_per_url": max_items,
            "ignore_url_failures": True,
            "proxy": {"useApifyProxy": True, "apifyProxyCountry": "IN"},
        }

    if source == "housing":
        return {
            "searchUrls": url_values,
            "maxItems": max_items,
        }

    return {"startUrls": urls, "maxItems": max_items}


def _active_sources() -> dict[str, str]:
    pairs = [
        ("99acres", settings.apify_99acres_actor),
        ("housing", settings.apify_housing_actor),
    ]
    return {name: actor for name, actor in pairs if actor}


# ─── URL builders per platform ─────────────────────────────────────────────────

def _build_search_url(source: str, query: str, filters: SearchFilters) -> str:
    location = filters.city or filters.locality or query
    loc_slug = location.lower().replace(" ", "-")
    listing = filters.listing_type or "sale"
    prop_type = filters.property_type or "flat"

    if source == "99acres":
        prop_map = {
            "flat": "flats", "house": "houses", "villa": "villas",
            "plot": "plots", "commercial": "commercial-property", "pg": "pg-accommodation",
        }
        prop_slug = prop_map.get(prop_type, "property")
        action = "rent" if listing == "rent" else "sale"
        # Use city-only slug — locality pages have different HTML the actor can't parse
        city_slug = (filters.city or location).lower().replace(" ", "-")
        return f"https://www.99acres.com/{prop_slug}-for-{action}-in-{city_slug}-ffid"

    if source == "magicbricks":
        prop_map = {
            "flat": "Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment",
            "house": "Residential-House",
            "villa": "Villa",
            "plot": "Residential-Plot",
            "commercial": "Commercial-Office-Space,Commercial-Shop,Commercial-Land",
            "pg": "Paying-Guest",
        }
        prop_slug = prop_map.get(prop_type, prop_map["flat"])
        action = "rent" if listing == "rent" else "sale"
        params = {
            "proptype": prop_slug,
            "cityName": filters.city or query or location,
        }
        if filters.locality:
            params["Locality"] = filters.locality
        if filters.bedrooms:
            params["bedroom"] = str(filters.bedrooms)
        if filters.min_price:
            params["BudgetMin"] = str(int(filters.min_price))
        if filters.max_price:
            params["BudgetMax"] = str(int(filters.max_price))
        path = "residential-real-estate" if prop_type != "commercial" else "commercial-real-estate"
        return f"https://www.magicbricks.com/property-for-{action}/{path}?{urlencode(params)}"

    if source == "nobroker":
        prop_map = {
            "flat": "flat", "house": "house", "villa": "villa",
            "plot": "plot", "commercial": "commercial", "pg": "pg",
        }
        prop_slug = prop_map.get(prop_type, "flat")
        action = "rent" if listing == "rent" else "sale"
        return f"https://www.nobroker.in/property/{action}/{prop_slug}/{quote(location.title())}"

    if source == "housing":
        action = "buy" if listing == "sale" else "rent"
        city_slug = (filters.city or location).lower().replace(" ", "-")
        prop_map = {
            "flat": "flats", "house": "houses", "villa": "villas",
            "plot": "plots", "commercial": "commercial", "pg": "pg",
        }
        prop_slug = prop_map.get(prop_type, "flats")
        return f"https://housing.com/in/{action}/{prop_slug}-in-{city_slug}/{city_slug}"

    return f"https://www.99acres.com/property-for-sale-in-{loc_slug}-ffid"


# ─── normalizer ────────────────────────────────────────────────────────────────

def _normalize(
    raw: dict[str, Any],
    *,
    source: str,
    filters: SearchFilters | None = None,
) -> dict[str, Any] | None:
    # Every platform stores the listing URL differently
    source_url = _get(raw, "url", "link", "href", "propertyUrl", "detailUrl", "pageUrl")
    prop_id = _get(raw, "id", "propertyId", "property_id", "listingId", "propId")

    if not source_url and not prop_id:
        return None

    unique_key = source_url or str(prop_id)
    external_id = f"apify:{source}:{quote(unique_key, safe='')}"

    # Core fields
    title = _get(raw, "title", "name", "propertyName", "listingTitle", "heading")
    price = _as_float(_get(raw, "price", "listPrice", "expectedPrice", "rentAmount", "amount", "cost"))
    description = _get(raw, "description", "propertyDescription", "details", "overview", "about")

    # Location
    city = _get(raw, "city", "cityName")
    locality = _get(raw, "locality", "localityName", "area", "neighborhood", "sector", "subLocality")
    address = _get(raw, "address", "fullAddress", "propertyAddress", "location")
    pincode = _get(raw, "pincode", "postalCode", "zipCode", "pin")
    lat = _as_float(_get(raw, "latitude", "lat"))
    lng = _as_float(_get(raw, "longitude", "lng", "lon"))

    # Specs
    bedrooms = _as_int(_get(raw, "bedrooms", "bhk", "noOfBedrooms", "beds", "bedroom", "noOfBHK"))
    bathrooms = _as_int(_get(raw, "bathrooms", "noOfBathrooms", "baths", "bathroom", "noOfBathroom"))
    area = _as_float(_get(raw, "area", "carpetArea", "superArea", "builtUpArea", "areaSqft", "sqft", "size"))

    # Classification
    prop_type = _classify_property_type(
        _get(raw, "propertyType", "type", "category", "subType", "propType"),
        filters,
    )
    listing_type = _classify_listing_type(
        _get(raw, "listingType", "transactionType", "forRent", "rentOrSale", "type"),
        filters,
    )
    furnishing = _classify_furnishing(
        _get(raw, "furnishing", "furnishingStatus", "furnished", "furnishingType")
    )
    possession = _classify_possession(
        _get(raw, "possessionStatus", "availability", "readyToMove", "constructionStatus")
    )

    # Build derived fields
    if not address:
        address = ", ".join(p for p in [locality, city] if p)
    if not title:
        title = _build_title(bedrooms, prop_type, locality, city, listing_type)

    city = city or (filters.city if filters else "") or ""
    locality = locality or city

    return {
        "id": external_id,
        "external_property_id": unique_key,
        "title": title or "Property",
        "description": str(description) if description else None,
        "property_type": prop_type,
        "listing_type": listing_type,
        "status": "active",
        "address": address,
        "city": city,
        "locality": locality,
        "pincode": str(pincode) if pincode else None,
        "state_code": _get(raw, "state", "stateCode", "stateName"),
        "latitude": lat,
        "longitude": lng,
        "price": price or 0,
        "currency": "INR",
        "price_period": "month" if listing_type == "rent" else None,
        "area_sqft": area or 0,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "floor_number": _as_int(_get(raw, "floor", "floorNumber", "floorNo")),
        "furnishing_status": furnishing,
        "possession_status": possession,
        "property_age_years": _as_int(_get(raw, "propertyAge", "ageOfProperty", "age")),
        "amenities": _extract_amenities(raw),
        "source": source,
        "source_url": source_url,
        "media": _extract_media(raw, source),
        "seller": _extract_seller(raw),
        "created_at": _get(raw, "postedOn", "listedOn", "updatedOn", "date", "postedDate"),
    }


# ─── classifiers ──────────────────────────────────────────────────────────────

def _classify_property_type(value: Any, filters: SearchFilters | None) -> str:
    if filters and filters.property_type:
        return filters.property_type
    text = str(value or "").lower()
    if any(k in text for k in ("flat", "apartment", "studio")):
        return "flat"
    if any(k in text for k in ("villa",)):
        return "villa"
    if any(k in text for k in ("plot", "land")):
        return "plot"
    if any(k in text for k in ("commercial", "office", "shop")):
        return "commercial"
    if any(k in text for k in ("pg", "hostel", "paying guest")):
        return "pg"
    if any(k in text for k in ("house", "independent", "bungalow", "kothi")):
        return "house"
    return "flat"


def _classify_listing_type(value: Any, filters: SearchFilters | None) -> str:
    if filters and filters.listing_type:
        return filters.listing_type
    text = str(value or "").lower()
    if any(k in text for k in ("rent", "lease", "true")):
        return "rent"
    return "sale"


def _classify_furnishing(value: Any) -> str | None:
    text = str(value or "").lower()
    if "semi" in text:
        return "semi_furnished"
    if any(k in text for k in ("furnished", "true", "yes")):
        return "furnished"
    if any(k in text for k in ("unfurnished", "false", "no")):
        return "unfurnished"
    return None


def _classify_possession(value: Any) -> str | None:
    text = str(value or "").lower()
    if any(k in text for k in ("ready", "immediate", "true", "yes")):
        return "ready_to_move"
    if any(k in text for k in ("under", "construction", "build")):
        return "under_construction"
    return None


def _build_title(
    bedrooms: int | None,
    prop_type: str,
    locality: str | None,
    city: str | None,
    listing_type: str,
) -> str:
    size = f"{bedrooms} BHK " if bedrooms else ""
    type_label = prop_type.replace("_", " ").title()
    action = "for Rent" if listing_type == "rent" else "for Sale"
    location = ", ".join(p for p in [locality, city] if p)
    if location:
        return f"{size}{type_label} {action} in {location}"
    return f"{size}{type_label} {action}"


# ─── extractors ───────────────────────────────────────────────────────────────

def _extract_media(raw: dict[str, Any], source: str) -> list[dict[str, str]]:
    urls: list[str] = []

    # Primary image
    primary = _get(raw, "primaryImage", "mainImage", "coverImage", "thumbnail")
    if isinstance(primary, str) and primary:
        urls.append(primary)
    elif isinstance(primary, dict):
        href = _get(primary, "url", "href", "src")
        if href:
            urls.append(str(href))

    # Gallery
    for key in ("images", "photos", "gallery", "imageList"):
        gallery = raw.get(key)
        if isinstance(gallery, list):
            for item in gallery:
                if isinstance(item, str) and item:
                    urls.append(item)
                elif isinstance(item, dict):
                    href = _get(item, "url", "href", "src", "image")
                    if href:
                        urls.append(str(href))
            break

    return [
        {"url": url, "media_type": "image", "source": source}
        for url in dict.fromkeys(urls)
    ]


def _extract_seller(raw: dict[str, Any]) -> dict[str, Any] | None:
    name = _get(raw, "agentName", "ownerName", "sellerName", "postedBy", "contactName", "broker")
    phone = _get(raw, "agentPhone", "ownerPhone", "contactPhone", "phone", "mobile", "contact")
    role = _get(raw, "agentType", "postedByType", "sellerType") or "agent"

    if not name and not phone:
        return None

    return {
        "name": str(name) if name else None,
        "phone": str(phone) if phone else None,
        "role": str(role).lower(),
    }


def _extract_amenities(raw: dict[str, Any]) -> list[str]:
    amenities: list[str] = []

    for key in ("amenities", "facilities", "features", "highlights"):
        value = raw.get(key)
        if isinstance(value, list):
            for item in value:
                if isinstance(item, str) and item:
                    amenities.append(item)
                elif isinstance(item, dict):
                    label = _get(item, "name", "label", "title")
                    if label:
                        amenities.append(str(label))
        elif isinstance(value, str) and value:
            amenities.extend(v.strip() for v in value.split(",") if v.strip())

    return list(dict.fromkeys(amenities))


# ─── small helpers ────────────────────────────────────────────────────────────

def _get(data: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = data.get(key)
        if value not in (None, "", [], {}):
            return value
    return None


def _as_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).replace(",", "").replace("₹", "").strip())
    except (TypeError, ValueError):
        return None


def _as_int(value: Any) -> int | None:
    f = _as_float(value)
    return int(f) if f is not None else None
