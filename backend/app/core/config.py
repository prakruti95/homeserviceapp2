from pydantic_settings import BaseSettings
from typing import Optional, Union
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "HomeServe Technologies"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"  # development | staging | production
    DEBUG: bool = True
    PORT: int = 8000
    SEED_DEMO_DATA: bool = True  # Set to False in production for clean database

    # Database
    DATABASE_URL: str = "mysql+pymysql://root@localhost:3306/homeserve"

    # JWT Authentication
    SECRET_KEY: str = "homeserve-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour session lifetime

    # CORS Allowed Origins (Comma-separated string or list)
    CORS_ORIGINS: Union[str, list[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://homeserve.vercel.app"
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
            if s.startswith("[") and s.endswith("]"):
                try:
                    return json.loads(s)
                except Exception:
                    pass
            return [origin.strip() for origin in s.split(",") if origin.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    def validate_production_secrets(self) -> None:
        """Enforce strong credentials in production environments."""
        if self.APP_ENV == "production":
            if self.SECRET_KEY == "homeserve-super-secret-key-change-in-production-2024":
                raise ValueError("CRITICAL SECURITY ERROR: Default SECRET_KEY must be overridden in production!")
            if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
                raise ValueError("DATABASE_URL must point to a cloud database host (MySQL or PostgreSQL) in production!")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
