import json
from groq import Groq
from fastapi import APIRouter, Depends
from api.models.chat import ChatRequest, ChatResponse
from api.middleware.auth import get_optional_user
from api.services.supabase_client import get_service_client
from api.services import gemini as ai_svc
from api.config import settings
from api.services.tavily_search import (
    get_property_detail as get_tavily_property_detail,
    is_tavily_property_id,
    search_properties as tavily_search_properties,
)
from api.services.cache import get_cached_property

router = APIRouter(prefix="/api/chat", tags=["chat"])

_groq = Groq(api_key=settings.groq_api_key)

_INTENT_PROMPT = """You are Replaceio, a friendly AI property assistant for Replaceio, an Indian real estate platform.

Your job: collect key details through natural conversation, then search for properties.

REQUIRED fields before searching:
  listing_type — "rent" or "buy/sale"
  property_type — flat, house, villa, plot, commercial, pg
  location — city or area in India

OPTIONAL (collect if mentioned):
  bedrooms — number of BHK
  budget — price or range

Respond with ONLY valid JSON — no markdown, no code fences.

{{
  "intent": "search" | "gather" | "detail" | "chat",
  "search_query": "full natural language query when intent=search, else null",
  "property_index": <0-based int when user refers to a listed property, else null>,
  "reply": "your friendly conversational reply",
  "suggestions": ["chip1", "chip2"]
}}

Intent rules — pick exactly one:
- "gather": at least one REQUIRED field is still unknown. Ask ONE question. Provide 2-4 suggestion chips.
    No listing_type → ask rent or buy.  suggestions: ["Rent", "Buy"]
    No property_type → ask property type.  suggestions: ["Flat / Apartment", "House", "Villa", "Plot", "PG / Hostel"]
    No location → ask for city or area.  suggestions: []
    Once ALL 3 required fields are known, use "search" instead.
- "search": ALL required fields are collected. Build a complete search_query. suggestions: []
- "detail": user refers to a specific property already listed in chat. suggestions: []
- "chat": greetings or questions unrelated to property search. suggestions: []

Conversation history (last 8 turns):
{history}

Properties currently visible in chat: {prop_count}

User message: "{message}"

CRITICAL rules:
- If the very first message already contains all required info (e.g. "2BHK flat for rent in Lucknow under 50L"), extract all fields and set intent to "search" immediately.
- NEVER ask more than one question per reply.
- Do NOT repeat a question already answered in the conversation history.
- Be warm, concise, and use casual Indian English.
"""


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, user=Depends(get_optional_user)):
    client = get_service_client()

    history_text = "\n".join(
        f"{m.role.title()}: {m.content}" for m in body.history[-8:]
    ) or "No previous messages."

    prompt = _INTENT_PROMPT.format(
        history=history_text,
        prop_count=len(body.context_property_ids),
        message=body.message,
    )

    raw = _groq.chat.completions.create(
        model=settings.groq_text_model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    ).choices[0].message.content.strip()

    try:
        parsed = json.loads(raw)
    except Exception:
        return ChatResponse(message="Sorry, I had trouble understanding that. Could you rephrase?")

    intent = parsed.get("intent", "chat")
    reply = parsed.get("reply", "")
    suggestions: list[str] = parsed.get("suggestions") or []
    properties: list[dict] = []

    # ── GATHER (bot asks a follow-up question) ───────────────────────────────
    if intent == "gather":
        return ChatResponse(message=reply, suggestions=suggestions)

    # ── SEARCH ──────────────────────────────────────────────────────────────
    if intent == "search" and parsed.get("search_query"):
        query = parsed["search_query"]
        try:
            filters = ai_svc.parse_search_query(query)
            properties, _ = await tavily_search_properties(query, filters, page=1, limit=6)

            if not properties:
                reply = f"I couldn't find any properties for '{query}'. Try different keywords or a broader location."
            else:
                top = ", ".join(
                    f"{p.get('bedrooms', '')}BHK {p.get('property_type','')} "
                    f"in {p.get('locality','')}, {p.get('city','')} "
                    f"at ₹{_fmt(p.get('price', 0))}"
                    for p in properties[:3]
                )
                summary_prompt = (
                    f'User searched: "{query}". Found {len(properties)} properties. '
                    f"Top results: {top}. "
                    "Write a friendly 1-2 sentence summary. Be specific. No bullet points."
                )
                reply = _groq.chat.completions.create(
                    model=settings.groq_text_model,
                    messages=[{"role": "user", "content": summary_prompt}],
                    temperature=0.7,
                ).choices[0].message.content.strip()

        except Exception:
            reply = "I ran into an issue searching properties. Please try again."

    # ── PROPERTY DETAIL ──────────────────────────────────────────────────────
    elif intent == "detail" and parsed.get("property_index") is not None:
        idx = int(parsed["property_index"])
        if 0 <= idx < len(body.context_property_ids):
            prop_id = body.context_property_ids[idx]
            try:
                if is_tavily_property_id(prop_id):
                    p = await get_cached_property(prop_id) or await get_tavily_property_detail(prop_id)
                else:
                    prop_res = client.table("properties").select("*").eq("id", prop_id).single().execute()
                    media_res = client.table("property_media").select("*").eq("property_id", prop_id).execute()
                    seller_res = client.table("users").select("id,name,phone,role").eq(
                        "id", prop_res.data["owner_id"]
                    ).single().execute()
                    p = prop_res.data
                    if p:
                        p["media"] = media_res.data or []
                        p["seller"] = seller_res.data

                if p:
                    properties = [p]

                if properties:
                    detail_prompt = _detail_prompt(properties[0])
                    reply = _groq.chat.completions.create(
                        model=settings.groq_text_model,
                        messages=[{"role": "user", "content": detail_prompt}],
                        temperature=0.7,
                    ).choices[0].message.content.strip()
            except Exception:
                reply = "I couldn't fetch that property's details. Please try again."
        else:
            reply = "I'm not sure which property you mean. Could you say 'the first one' or 'the second one'?"

    return ChatResponse(message=reply, properties=properties, suggestions=suggestions)


def _fmt(price: float) -> str:
    if price >= 10_000_000:
        return f"{price / 10_000_000:.1f} Cr"
    if price >= 100_000:
        return f"{price / 100_000:.1f} L"
    return str(int(price))


def _detail_prompt(p: dict) -> str:
    currency = "$" if p.get("currency") == "USD" else "₹"
    return (
        "Describe this property conversationally in 2-3 sentences, highlighting key features:\n"
        f"Title: {p.get('title')}\n"
        f"Price: {currency}{_fmt(p.get('price', 0))}\n"
        f"Location: {p.get('locality')}, {p.get('city')}\n"
        f"Size: {p.get('bedrooms')} bedrooms, {p.get('area_sqft')} sqft\n"
        f"Furnishing: {p.get('furnishing_status', 'N/A')}\n"
        f"Possession: {p.get('possession_status', 'N/A')}\n"
        f"Amenities: {', '.join(p.get('amenities') or [])}\n"
        f"Description: {p.get('description', '')}\n"
        "Be friendly. Mention price, location, size, and one standout feature."
    )
