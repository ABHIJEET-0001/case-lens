"""
app/config.py
─────────────
Loads all configuration from environment variables (via .env file).
Access settings anywhere with:  from app.config import settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str

    # Auth
    secret_key: str
    access_token_expire_minutes: int = 60

    # External APIs
    gemini_api_key: str = ""

    # App
    environment: str = "development"
    log_level: str = "info"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
