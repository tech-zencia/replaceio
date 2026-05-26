import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import auth, properties, search, users, chat
from api.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI(
    title="Replaceio Real Estate API",
    version="1.0.0",
)


def parse_cors_origins(*values: str) -> list[str]:
    origins: list[str] = []
    for value in values:
        for origin in (value or "").split(","):
            origin = origin.strip().rstrip("/")
            if origin and origin not in origins:
                origins.append(origin)
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(
        "http://localhost:5173",
        settings.frontend_url,
        settings.cors_origins,
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(search.router)
app.include_router(users.router)
app.include_router(chat.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
