import json
import voyageai
from groq import Groq
from api.config import settings
from api.models.search import SearchFilters

_groq = Groq(api_key=settings.groq_api_key)
_voyage = voyageai.Client(api_key=settings.voyage_api_key)


def generate_property_embedding(property_data: dict) -> list[float]:
    text = _property_to_text(property_data)
    result = _voyage.embed([text], model=settings.voyage_embed_model, input_type="document")
    return result.embeddings[0]


def generate_query_embedding(query: str) -> list[float]:
    result = _voyage.embed([query], model=settings.voyage_embed_model, input_type="query")
    return result.embeddings[0]


def parse_search_query(query: str) -> SearchFilters:
    prompt = f"""Extract structured property search filters from this query. Return ONLY valid JSON, no markdown.

Query: "{query}"

Rules:
- Convert Indian price units: "50 lakhs" = 5000000, "1 crore" = 10000000
- BHK number only (e.g. "2BHK" = 2)
- city/locality should be properly capitalized
- For US searches, extract state_code as the 2-letter state abbreviation and postal_code when present
- listing_type: "sale" or "rent" only
- property_type: "flat", "house", "villa", "plot", "commercial", or "pg"
- Use null for any filter not mentioned

Return this exact JSON structure:
{{
  "city": null,
  "state_code": null,
  "postal_code": null,
  "locality": null,
  "property_type": null,
  "listing_type": null,
  "bedrooms": null,
  "min_price": null,
  "max_price": null,
  "min_area": null,
  "max_area": null,
  "furnishing_status": null,
  "amenities": null
}}"""

    response = _groq.chat.completions.create(
        model=settings.groq_text_model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    try:
        data = json.loads(response.choices[0].message.content)
        return SearchFilters(**data)
    except Exception:
        return SearchFilters()


def generate_search_summary(query: str, properties: list[dict]) -> str:
    if not properties:
        return "No properties found matching your search."

    props_text = "\n".join(
        f"- {p.get('title', '')} in {p.get('locality', '')}, {p.get('city', '')} "
        f"at ₹{_format_price(p.get('price', 0))}"
        for p in properties[:3]
    )
    prompt = f"""Write a 2-line helpful summary for these real estate search results.
Query: "{query}"
Top results:
{props_text}

Be specific, mention city/price if relevant. Friendly and concise. No markdown."""

    response = _groq.chat.completions.create(
        model=settings.groq_text_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


def _property_to_text(p: dict) -> str:
    parts = [
        p.get("title", ""),
        p.get("property_type", ""),
        f"{p.get('bedrooms', '')} BHK" if p.get("bedrooms") else "",
        p.get("listing_type", ""),
        p.get("locality", ""),
        p.get("city", ""),
        f"₹{_format_price(p.get('price', 0))}",
        f"{p.get('area_sqft', '')} sqft" if p.get("area_sqft") else "",
        p.get("furnishing_status", ""),
        " ".join(p.get("amenities", []) or []),
        p.get("description", ""),
    ]
    return " ".join(x for x in parts if x)


def _format_price(price: float) -> str:
    if price >= 10_000_000:
        return f"{price / 10_000_000:.1f} Cr"
    if price >= 100_000:
        return f"{price / 100_000:.1f} L"
    return str(int(price))
