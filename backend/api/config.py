from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    groq_api_key: str
    groq_text_model: str = "llama-3.3-70b-versatile"
    voyage_api_key: str
    voyage_embed_model: str = "voyage-2"
    redis_url: str
    jwt_secret: str
    storage_bucket: str = "property-media"
    storage_images_prefix: str = "images"
    storage_videos_prefix: str = "videos"
    tavily_api_key: str | None = None
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "https://www.replaceio.com,https://replaceio.com"

    class Config:
        env_file = ".env"


settings = Settings()
