from __future__ import annotations

import asyncio
import json
import logging
from typing import Any
from urllib.parse import unquote

from groq import Groq
from tavily import TavilyClient

from api.config import settings
from api.models.search import SearchFilters
from api.services.cache import cache_properties, get_cached_property

logger = logging.getLogger(__name__)

_groq = Groq(api_key=settings.groq_api_key)

SEARCH_DOMAINS = ["99acres.com", "housing.com"]


def is_tavily_property_id(property_id: str) -> bool:
    return property_id.startswith("tavily:")


def _client() -> TavilyClient:
    return TavilyClient(api_key=settings.tavily_api_key)


# ─── public async API ──────────────────────────────────────────────────────────

async def search_properties(
    query: str,
    filters: SearchFilters,
    page: int,
    limit: int,
) -> tuple[list[dict[str, Any]], int]:
    search_query = _build_search_query(query, filters)
    logger.info("Tavily search: %r", search_query)

    try:
        raw = await asyncio.to_thread(
            _client().search,
            query=search_query,
            search_depth="advanced",
            include_domains=SEARCH_DOMAINS,
            max_results=10,
            include_images=True,
        )
    except Exception as exc:
        logger.error("Tavily search failed: %s", exc)
        return [], 0

    snippets = raw.get("results", [])
    if not snippets:
        logger.warning("Tavily returned 0 snippets for query: %r", search_query)
        return [], 0

    images: list[str] = raw.get("images", [])
    properties = await asyncio.to_thread(_extract_properties, snippets, filters)
    logger.info("Extracted %d properties from %d snippets, %d images", len(properties), len(snippets), len(images))

    # Assign images to properties in order — Tavily images are from the same search pages
    for i, prop in enumerate(properties):
        if not prop["media"] and i < len(images):
            prop["media"] = [{"url": images[i], "media_type": "image", "source": prop["source"]}]

    await cache_properties(properties)
    start = (page - 1) * limit
    return properties[start: start + limit], len(properties)


async def get_property_detail(property_id: str) -> dict[str, Any] | None:
    cached = await get_cached_property(property_id)
    if cached:
        return cached

    parts = property_id.split(":", 2)
    if len(parts) < 3:
        return None
    url = parts[2]

    try:
        result = await asyncio.to_thread(_client().extract, urls=[url])
        pages = result.get("results", [])
        if not pages:
            return None
        content = pages[0].get("raw_content", "")[:3000]
    except Exception as exc:
        logger.error("Tavily extract failed for %s: %s", url, exc)
        return None

    prompt = f"""Extract ONE property listing from this page content and return a JSON object.

Fields to extract:
- title (string)
- price (number in INR — convert "X Cr" to X*10000000, "X L" to X*100000)
- bedrooms (integer)
- bathrooms (integer or null)
- area_sqft (number or null)
- locality (string)
- city (string)
- address (string)
- property_type: one of flat/house/villa/plot/commercial/pg
- listing_type: sale or rent
- description (string)
- amenities (array of strings)
- furnishing_status: furnished/semi_furnished/unfurnished or null

Page URL: {url}
Page content:
{content}

Return ONLY a single valid JSON object."""

    try:
        resp = _groq.chat.completions.create(
            model=settings.groq_text_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0,
        )
        item = json.loads(resp.choices[0].message.content)
        item["source_url"] = url
        return _normalize(item)
    except Exception as exc:
        logger.error("Groq detail extraction failed: %s", exc)
        return None


# ─── internal helpers ──────────────────────────────────────────────────────────

def _build_search_query(query: str, filters: SearchFilters) -> str:
    # Use the raw user query — Tavily is a search engine and handles natural language directly.
    # Reconstructing from parsed filters risks substituting wrong city names (LLM "corrections").
    base = query.strip()
    # Only append listing type if not already mentioned
    if filters.listing_type and filters.listing_type not in base.lower():
        base += f" for {filters.listing_type}"
    return base


def _extract_properties(
    snippets: list[dict[str, Any]],
    filters: SearchFilters,
) -> list[dict[str, Any]]:
    context = "\n\n---\n\n".join(
        f"URL: {s['url']}\nTitle: {s['title']}\nContent: {s.get('content', '')[:600]}"
        for s in snippets
    )

    location = filters.locality or filters.city or ""
    city = filters.city or ""

    prompt = f"""You are a real estate data extractor. Extract property listings from these search results.

Target location: {location}
City: {city}

Return a JSON object with key "properties" containing an array. Each item must have:
- title (string)
- price (number in INR — convert "X Cr" to X*10000000, "X L/Lakh" to X*100000, monthly rent as-is)
- bedrooms (integer or null)
- area_sqft (number or null)
- locality (string — the neighbourhood/area)
- city (string — default "{city}")
- address (string)
- property_type: flat / house / villa / plot / commercial / pg
- listing_type: sale or rent
- description (string, 1-2 sentences)
- source_url (the URL it came from)

Rules:
- Only include listings in or near {location}
- Skip articles, ads, or non-property content
- If a snippet shows multiple listings, extract each one separately
- Do not invent data — only extract what is present

Search results:
{context}

Return ONLY: {{"properties": [...]}}"""

    try:
        resp = _groq.chat.completions.create(
            model=settings.groq_text_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0,
        )
        data = json.loads(resp.choices[0].message.content)
        items = data.get("properties", [])
    except Exception as exc:
        logger.error("Groq property extraction failed: %s", exc)
        return []

    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for item in items:
        if not item:
            continue
        p = _normalize(item)
        if p and p["id"] not in seen:
            seen.add(p["id"])
            result.append(p)
    return result


def _normalize(item: dict[str, Any]) -> dict[str, Any] | None:
    source_url = item.get("source_url", "")
    if not source_url:
        return None

    source = "housing" if "housing.com" in source_url else "99acres"
    prop_id = f"tavily:{source}:{source_url}"

    price = _as_float(item.get("price"))
    listing_type = str(item.get("listing_type") or "sale").lower()

    return {
        "id": prop_id,
        "title": item.get("title") or "Property",
        "description": item.get("description"),
        "property_type": item.get("property_type") or "flat",
        "listing_type": listing_type,
        "status": "active",
        "address": item.get("address") or "",
        "city": item.get("city") or "",
        "locality": item.get("locality") or "",
        "pincode": None,
        "state_code": None,
        "latitude": None,
        "longitude": None,
        "price": price or 0,
        "currency": "INR",
        "price_period": "month" if listing_type == "rent" else None,
        "area_sqft": _as_float(item.get("area_sqft")) or 0,
        "bedrooms": _as_int(item.get("bedrooms")),
        "bathrooms": _as_int(item.get("bathrooms")),
        "floor_number": None,
        "furnishing_status": item.get("furnishing_status"),
        "possession_status": None,
        "property_age_years": None,
        "amenities": item.get("amenities") or [],
        "source": source,
        "source_url": source_url,
        "media": [],
        "seller": None,
        "created_at": None,
    }


def _as_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(str(v).replace(",", "").replace("₹", "").strip())
    except (TypeError, ValueError):
        return None


def _as_int(v: Any) -> int | None:
    f = _as_float(v)
    return int(f) if f is not None else None
