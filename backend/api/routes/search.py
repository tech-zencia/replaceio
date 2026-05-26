from fastapi import APIRouter, Depends, HTTPException
from api.models.search import SearchRequest, SearchResult
from api.middleware.auth import get_optional_user
from api.services.supabase_client import get_service_client
from api.services import gemini
from api.services.cache import get_cached, set_cached
from api.services.tavily_search import search_properties as tavily_search_properties

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResult)
async def search_properties(body: SearchRequest, user=Depends(get_optional_user)):
    cache_key = f"{body.query}|{body.page}|{body.limit}"
    cached = await get_cached("search", cache_key)
    if cached:
        return SearchResult(**cached)

    filters = gemini.parse_search_query(body.query)

    try:
        properties, total = await tavily_search_properties(
            body.query,
            filters,
            body.page,
            body.limit,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    summary = gemini.generate_search_summary(body.query, properties)

    if user:
        client = get_service_client()
        client.table("search_history").insert({
            "user_id": user.id,
            "query": body.query,
            "filters": filters.model_dump(),
            "result_count": len(properties),
        }).execute()

    response_data = {
        "properties": properties,
        "filters_detected": filters.model_dump(),
        "ai_summary": summary,
        "total": total,
        "page": body.page,
        "limit": body.limit,
    }
    await set_cached("search", cache_key, response_data, ttl_seconds=3600)
    return SearchResult(**response_data)
