from fastapi import APIRouter, HTTPException, status
from api.models.user import RegisterRequest, LoginRequest, RefreshRequest
from api.services.supabase_client import get_client, get_service_client

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(body: RegisterRequest):
    anon_client = get_client()
    service_client = get_service_client()
    try:
        auth_response = anon_client.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Supabase error: {e}")

    if not auth_response.user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed")

    user_id = auth_response.user.id
    service_client.table("users").insert({
        "id": user_id,
        "name": body.name,
        "phone": body.phone,
        "role": body.role.value,
        "email": body.email,
    }).execute()

    if auth_response.session:
        user_row = service_client.table("users").select("*").eq("id", user_id).single().execute()
        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "token_type": "bearer",
            "user": user_row.data,
        }

    return {"message": "Registration successful. Please verify your email.", "user_id": user_id}


@router.post("/login")
async def login(body: LoginRequest):
    anon_client = get_client()
    service_client = get_service_client()
    try:
        auth_response = anon_client.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not auth_response.session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_row = service_client.table("users").select("*").eq("id", auth_response.user.id).single().execute()

    return {
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "token_type": "bearer",
        "user": user_row.data,
    }


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    client = get_client()
    try:
        response = client.auth.refresh_session(body.refresh_token)
        if not response or not response.session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token refresh failed")
