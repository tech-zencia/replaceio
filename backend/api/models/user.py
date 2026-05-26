from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    user = "user"
    agent = "agent"
    builder = "builder"


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: UserRole = UserRole.user


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    role: UserRole
    avatar_url: Optional[str] = None
    email: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str
