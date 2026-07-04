"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Hata"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: Literal["development", "production", "testing"] = "development"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Database
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://hata:hata@localhost:5432/hata"
    )
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Security
    secret_key: str = Field(
        default="change-me-in-production-use-openssl-rand-hex-32"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    refresh_token_expire_days: int = 30

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    # Parser settings
    parser_base_url: str = "https://eri2.nca.by"
    parser_delay_min: float = 1.0
    parser_delay_max: float = 3.0
    parser_timeout: int = 30000  # milliseconds
    parser_max_retries: int = 3
    parser_concurrent_pages: int = 2
    parser_user_agents: list[str] = Field(
        default_factory=lambda: [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv=121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36",
        ]
    )
    parser_proxy_enabled: bool = False
    parser_proxy_url: str | None = None
    parser_proxy_list: list[str] = Field(default_factory=list)

    # Storage
    storage_path: str = "./storage"
    photos_path: str = "./storage/photos"
    logs_path: str = "./storage/logs"

    # Map settings
    map_default_lat: float = 53.9  # Minsk
    map_default_lng: float = 27.5667
    map_default_zoom: int = 7

    @field_validator("database_url", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Convert postgresql:// to postgresql+asyncpg://."""
        if v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @property
    def async_database_url(self) -> str:
        """Get async database URL."""
        return str(self.database_url)

    @property
    def sync_database_url(self) -> str:
        """Get sync database URL for Alembic."""
        return str(self.database_url).replace("+asyncpg", "")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
