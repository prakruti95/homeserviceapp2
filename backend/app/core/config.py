import os
import json
import logging
from typing import Optional, Union
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "HomeServe Technologies"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")  # development | staging | production
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1")
    PORT: int = int(os.getenv("PORT", "8000"))
    SEED_DEMO_DATA: bool = True  # Automatically seed essential demo data if database is empty

    # Persistent Live Cloud PostgreSQL Database (Used across all devices & serverless instances)
    DEFAULT_CLOUD_POSTGRES: str = "postgresql+psycopg2://neondb_owner:npg_cxG5vU9JSuAz@ep-delicate-silence-bdystvc2-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require"

    # Database: checks POSTGRES_URL (Vercel Postgres standard), DATABASE_URL, POSTGRES_PRISMA_URL, or live cloud DB
    DATABASE_URL: str = (
        os.getenv("POSTGRES_URL")
        or os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
        or "postgresql+psycopg2://neondb_owner:npg_cxG5vU9JSuAz@ep-delicate-silence-bdystvc2-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require"
    )

    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "homeserve-super-secret-key-change-in-production-2024")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours session lifetime

    # CORS Allowed Origins (Comma-separated string or list)
    CORS_ORIGINS: Union[str, list[str]] = [
        "*",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://homeserve.vercel.app",
        "https://homeserviceapp2-lzer.vercel.app",
    ]

    # Admin Initial Bootstrapping Credentials
    ADMIN_EMAIL: str = "admin@homeserve.com"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_FULL_NAME: str = "System Admin"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS whether supplied as a list, JSON array, or comma-separated string."""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            s = self.CORS_ORIGINS.strip()
            if s == "*":
                return ["*"]
            if s.startswith("[") and s.endswith("]"):
                try:
                    return json.loads(s)
                except Exception:
                    pass
            return [origin.strip() for origin in s.split(",") if origin.strip()]
        return ["*"]

    def validate_production_secrets(self) -> None:
        """Enforce or warn about strong credentials in production environments."""
        if self.APP_ENV == "production":
            if self.SECRET_KEY == "homeserve-super-secret-key-change-in-production-2024":
                logger.warning("WARNING: Using default SECRET_KEY in production. Set SECRET_KEY in Vercel environment variables.")
            if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
                logger.warning("WARNING: DATABASE_URL is pointing to localhost. Set POSTGRES_URL or DATABASE_URL in Vercel environment variables.")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
