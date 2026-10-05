"""Typed application settings loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Runtime configuration.

    SQLite is a convenience default for health checks and local exploration.
    Set DATABASE_URL to PostgreSQL before using the application with real data.
    """

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "development"
    app_name: str = "Last-Mile Study Engine API"
    app_version: str = "0.1.0"
    frontend_url: str = "http://localhost:3000"

    database_url: str = "sqlite:///./last_mile.db"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"

    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/nemotron-3-ultra-550b-a55b"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    firebase_project_id: str | None = None
    firebase_client_email: str | None = None
    firebase_private_key: str | None = None

    chroma_persist_directory: str = "./vector_store"
    upload_directory: str = "./uploads"
    max_upload_size_mb: int = Field(default=20, ge=1, le=200)
    chunk_size: int = Field(default=900, ge=100, le=10000)
    chunk_overlap: int = Field(default=120, ge=0, le=2000)
    retrieval_top_k: int = Field(default=5, ge=1, le=20)
    retrieval_distance_threshold: float = Field(default=0.78, gt=0, le=2)

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]

    def resolve_path(self, configured_path: str) -> Path:
        path = Path(configured_path)
        return path if path.is_absolute() else BACKEND_DIR / path

    @property
    def upload_path(self) -> Path:
        return self.resolve_path(self.upload_directory)

    @property
    def chroma_path(self) -> Path:
        return self.resolve_path(self.chroma_persist_directory)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
