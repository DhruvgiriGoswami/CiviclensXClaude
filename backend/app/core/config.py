"""Application configuration loaded from environment variables."""

import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings sourced from environment variables or .env file."""

    # PostgreSQL individual settings
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "civiclens"

    # Optional direct URL overrides
    DB_URL_OVERRIDE: str = ""
    DB_URL_SYNC_OVERRIDE: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8000,https://sit.myciviclens.in,https://myciviclens.in,http://sit.myciviclens.in"

    # Media storage
    MEDIA_STORAGE_PATH: str = "/app/storage"

    # AWS S3 Media Storage
    S3_BUCKET_NAME: str = ""
    AWS_REGION: str = "ap-south-1"
    # None = decide from ENVIRONMENT (S3 on SIT/PROD only). ECS doesn't set this variable.
    USE_S3_STORAGE: Optional[bool] = None

    # Security & Admin Access. No default on purpose: when unset, admin endpoints answer 503.
    ADMIN_API_KEY: str = ""

    # App metadata
    APP_TITLE: str = "CivicLens API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "DEV"  # ECS sets SIT or PROD; local runs never touch real buckets
    API_V1_PREFIX: str = "/api/v1"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def S3_ENABLED(self) -> bool:
        if self.USE_S3_STORAGE is not None:
            return self.USE_S3_STORAGE
        return self.ENVIRONMENT.upper() in ("SIT", "PROD")

    @property
    def EFFECTIVE_S3_BUCKET(self) -> str:
        """Resolve effective S3 bucket name for complaints storage."""
        if self.S3_BUCKET_NAME:
            return self.S3_BUCKET_NAME
        env_bucket = os.getenv("S3_BUCKET_NAME") or os.getenv("AWS_S3_BUCKET")
        if env_bucket:
            return env_bucket
        env_name = (os.getenv("ENVIRONMENT") or self.ENVIRONMENT or "sit").lower()
        return f"civiclens-{env_name}-data"

    @property
    def DATABASE_URL(self) -> str:
        """Dynamic async database URL resolution."""
        env_url = os.getenv("DATABASE_URL") or self.DB_URL_OVERRIDE
        if env_url:
            if env_url.startswith("postgresql://"):
                return env_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return env_url
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Dynamic sync database URL resolution (used by Alembic & psycopg2)."""
        env_url_sync = os.getenv("DATABASE_URL_SYNC") or self.DB_URL_SYNC_OVERRIDE
        if env_url_sync:
            return env_url_sync
        env_url = os.getenv("DATABASE_URL") or self.DB_URL_OVERRIDE
        if env_url:
            return env_url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql+psycopg2://", "postgresql://")
        return (
            f"postgresql://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]


settings = Settings()
