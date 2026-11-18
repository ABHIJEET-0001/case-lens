"""
app/config.py
─────────────
Loads all configuration from environment variables (via .env file).
Access settings anywhere with:  from app.config import settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://caselens:changeme@localhost:5432/caselens_db"

    @property
    def sqlalchemy_database_url(self) -> str:
        """Render / cloud providers provide postgres://; SQLAlchemy requires postgresql+psycopg2://"""
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    # Auth
    secret_key: str = "caselens-secret-key-development-override-2024"
    access_token_expire_minutes: int = 60

    # External APIs
    gemini_api_key: str = ""

    # App
    environment: str = "development"
    log_level: str = "info"
    demo_mode: bool = True
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
