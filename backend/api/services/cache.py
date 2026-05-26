import json
import hashlib
import redis.asyncio as aioredis
from api.config import settings

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def _make_key(prefix: str, data: str) -> str:
    h = hashlib.md5(data.encode()).hexdigest()
    return f"{prefix}:{h}"


async def get_cached(prefix: str, key_data: str):
    try:
        r = await get_redis()
        val = await r.get(_make_key(prefix, key_data))
        return json.loads(val) if val else None
    except Exception:
        return None


async def set_cached(prefix: str, key_data: str, value, ttl_seconds: int = 3600):
    try:
        r = await get_redis()
        await r.setex(_make_key(prefix, key_data), ttl_seconds, json.dumps(value))
    except Exception:
        pass


async def cache_properties(properties: list[dict], ttl_seconds: int = 3600) -> None:
    """Store each property individually by its ID so detail endpoints can serve from cache."""
    try:
        r = await get_redis()
        pipe = r.pipeline()
        for prop in properties:
            pid = prop.get("id")
            if pid:
                pipe.setex(f"prop:{pid}", ttl_seconds, json.dumps(prop))
        await pipe.execute()
    except Exception:
        pass


async def get_cached_property(property_id: str) -> dict | None:
    try:
        r = await get_redis()
        val = await r.get(f"prop:{property_id}")
        return json.loads(val) if val else None
    except Exception:
        return None
