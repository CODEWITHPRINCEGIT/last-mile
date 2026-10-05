"""Google Gemini embedding service with a swappable provider boundary."""

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover - dependency installation issue
    genai = None  # type: ignore[assignment]
    types = None  # type: ignore[assignment]


class EmbeddingServiceError(RuntimeError):
    """Raised when embedding generation is unavailable or fails."""


class EmbeddingService:
    """Generate document and query embeddings using the official Google SDK."""

    def __init__(self) -> None:
        self._client: Any | None = None

    @property
    def client(self) -> Any:
        if self._client is not None:
            return self._client
        if genai is None or types is None:
            raise EmbeddingServiceError("Google Gen AI dependency is unavailable")
        if not settings.gemini_api_key:
            raise EmbeddingServiceError("GEMINI_API_KEY is not configured")
        self._client = genai.Client(api_key=settings.gemini_api_key)
        return self._client

    @staticmethod
    def _values(response: Any) -> list[list[float]]:
        embeddings = getattr(response, "embeddings", None) or []
        values: list[list[float]] = []
        for embedding in embeddings:
            vector = getattr(embedding, "values", None)
            if vector is None and isinstance(embedding, dict):
                vector = embedding.get("values")
            if vector:
                values.append([float(item) for item in vector])
        if not values:
            raise EmbeddingServiceError("Embedding provider returned no vectors")
        return values

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = self.client.models.embed_content(
            model=settings.embedding_model,
            contents=texts,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        return self._values(response)

    def embed_query(self, text: str) -> list[float]:
        response = self.client.models.embed_content(
            model=settings.embedding_model,
            contents=text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
        )
        return self._values(response)[0]
