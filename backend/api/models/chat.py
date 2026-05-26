from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    context_property_ids: list[str] = []  # IDs of properties currently visible in chat


class ChatResponse(BaseModel):
    message: str
    properties: list[dict] = []
    suggestions: list[str] = []
