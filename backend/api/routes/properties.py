import asyncio
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from typing import List
from api.config import settings
from api.models.property import CreatePropertyRequest, UpdatePropertyRequest
from api.middleware.auth import get_current_user, get_optional_user
from api.services.supabase_client import get_service_client
from api.services import gemini
from api.services.tavily_search import (
    get_property_detail as get_tavily_property_detail,
    is_tavily_property_id,
)
from api.services.cache import get_cached_property

router = APIRouter(prefix="/api/properties", tags=["properties"])


@router.post("")
async def create_property(body: CreatePropertyRequest, user=Depends(get_current_user)):
    client = get_service_client()
    data = body.model_dump()
    data["owner_id"] = user.id
    data["status"] = "active"
    data["source"] = "platform"

    result = client.table("properties").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create property")

    prop = result.data[0]
    # Generate embedding in background
    asyncio.create_task(_generate_and_save_embedding(prop["id"], prop))
    return prop


@router.get("/{property_id}")
async def get_property(property_id: str, user=Depends(get_optional_user)):
    if is_tavily_property_id(property_id):
        cached = await get_cached_property(property_id)
        if cached:
            return cached
        prop = await get_tavily_property_detail(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        return prop

    client = get_service_client()

    prop = client.table("properties").select("*").eq("id", property_id).single().execute()
    if not prop.data:
        raise HTTPException(status_code=404, detail="Property not found")

    media = client.table("property_media").select("*").eq("property_id", property_id).execute()
    seller = client.table("users").select("id,name,phone,role,avatar_url").eq(
        "id", prop.data["owner_id"]
    ).single().execute()

    result = prop.data
    result["media"] = media.data or []
    result["seller"] = seller.data

    # Track view if we have a user
    if user:
        client.table("property_views").upsert({
            "property_id": property_id,
            "user_id": user.id,
        }).execute()

    return result


@router.get("/user/{user_id}")
async def get_user_properties(user_id: str, user=Depends(get_current_user)):
    if user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    client = get_service_client()
    result = client.table("properties").select("*, property_media(url, media_type)").eq(
        "owner_id", user_id
    ).order("created_at", desc=True).execute()
    return result.data or []


@router.put("/{property_id}")
async def update_property(
    property_id: str, body: UpdatePropertyRequest, user=Depends(get_current_user)
):
    client = get_service_client()
    prop = client.table("properties").select("owner_id").eq("id", property_id).single().execute()
    if not prop.data or prop.data["owner_id"] != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    result = client.table("properties").update(updates).eq("id", property_id).execute()
    return result.data[0]


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(property_id: str, user=Depends(get_current_user)):
    client = get_service_client()
    prop = client.table("properties").select("owner_id").eq("id", property_id).single().execute()
    if not prop.data or prop.data["owner_id"] != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    client.table("properties").delete().eq("id", property_id).execute()


@router.post("/{property_id}/media")
async def upload_media(
    property_id: str,
    files: List[UploadFile] = File(...),
    user=Depends(get_current_user),
):
    client = get_service_client()
    prop = client.table("properties").select("owner_id").eq("id", property_id).single().execute()
    if not prop.data or prop.data["owner_id"] != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    uploaded = []
    for file in files:
        contents = await file.read()
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext in ("jpg", "jpeg", "png", "webp"):
            media_type = "image"
            folder = settings.storage_images_prefix.strip("/")
        elif ext in ("mp4", "webm", "mov"):
            media_type = "video"
            folder = settings.storage_videos_prefix.strip("/")
        else:
            continue

        path = f"{folder}/{property_id}/{uuid4()}.{ext}"
        client.storage.from_(settings.storage_bucket).upload(
            path,
            contents,
            {"content-type": file.content_type},
        )
        public_url = client.storage.from_(settings.storage_bucket).get_public_url(path)
        media_row = client.table("property_media").insert({
            "property_id": property_id,
            "url": public_url,
            "media_type": media_type,
        }).execute()
        uploaded.append(media_row.data[0])

    return uploaded


async def _generate_and_save_embedding(property_id: str, prop_data: dict):
    try:
        embedding = gemini.generate_property_embedding(prop_data)
        get_service_client().table("properties").update(
            {"embedding": embedding}
        ).eq("id", property_id).execute()
    except Exception:
        pass
