from fastapi import APIRouter, Depends, HTTPException
from api.models.user import UpdateProfileRequest
from api.middleware.auth import get_current_user
from api.services.supabase_client import get_service_client

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    client = get_service_client()
    result = client.table("users").select("*").eq("id", user.id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data


@router.put("/profile")
async def update_profile(body: UpdateProfileRequest, user=Depends(get_current_user)):
    client = get_service_client()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    result = client.table("users").update(updates).eq("id", user.id).execute()
    return result.data[0]


@router.get("/saved")
async def get_saved_properties(user=Depends(get_current_user)):
    client = get_service_client()
    result = client.table("saved_properties").select(
        "*, properties(*, property_media(url, media_type))"
    ).eq("user_id", user.id).execute()
    return result.data or []


@router.post("/saved/{property_id}")
async def save_property(property_id: str, user=Depends(get_current_user)):
    client = get_service_client()
    existing = client.table("saved_properties").select("id").eq(
        "user_id", user.id
    ).eq("property_id", property_id).execute()

    if existing.data:
        return {"message": "Already saved"}

    client.table("saved_properties").insert({
        "user_id": user.id,
        "property_id": property_id,
    }).execute()
    return {"message": "Saved"}


@router.delete("/saved/{property_id}")
async def unsave_property(property_id: str, user=Depends(get_current_user)):
    client = get_service_client()
    client.table("saved_properties").delete().eq(
        "user_id", user.id
    ).eq("property_id", property_id).execute()
    return {"message": "Removed from saved"}
