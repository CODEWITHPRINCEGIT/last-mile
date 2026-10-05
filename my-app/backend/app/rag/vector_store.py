"""ChromaDB persistence and user-scoped vector operations."""

import logging
from typing import Any

from app.core.config import settings
from app.rag.chunking import TextChunk

logger = logging.getLogger(__name__)

try:
    import chromadb
except ImportError:  # pragma: no cover - dependency installation issue
    chromadb = None  # type: ignore[assignment]


COLLECTION_NAME = "last_mile_study_chunks"


class VectorStoreError(RuntimeError):
    """Raised when vector storage is unavailable."""


def get_collection() -> Any:
    if chromadb is None:
        raise VectorStoreError("ChromaDB dependency is unavailable")
    settings.chroma_path.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(settings.chroma_path))
    return client.get_or_create_collection(name=COLLECTION_NAME)


def add_chunks(chunks: list[TextChunk], embeddings: list[list[float]]) -> None:
    if len(chunks) != len(embeddings):
        raise VectorStoreError("Chunk and embedding counts do not match")
    if not chunks:
        return
    collection = get_collection()
    collection.upsert(
        ids=[chunk.chunk_id for chunk in chunks],
        embeddings=embeddings,
        documents=[chunk.text for chunk in chunks],
        metadatas=[chunk.metadata for chunk in chunks],
    )


def delete_document_chunks(document_id: str, user_id: str) -> None:
    try:
        collection = get_collection()
        collection.delete(
            where={"$and": [{"document_id": document_id}, {"user_id": user_id}]}
        )
    except Exception as exc:
        logger.warning("Could not remove document vectors: %s", type(exc).__name__)


def query_chunks(
    *,
    user_id: str,
    query_embedding: list[float],
    top_k: int,
    document_ids: list[str] | None = None,
) -> list[dict[str, Any]]:
    collection = get_collection()
    filters: list[dict[str, Any]] = [{"user_id": user_id}]
    if document_ids:
        filters.append({"document_id": {"$in": document_ids}})
    where: dict[str, Any] = filters[0] if len(filters) == 1 else {"$and": filters}
    result = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where,
        include=["documents", "metadatas", "distances"],
    )
    documents = (result.get("documents") or [[]])[0]
    metadatas = (result.get("metadatas") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    return [
        {
            "text": text,
            "metadata": metadatas[index] if index < len(metadatas) else {},
            "distance": distances[index] if index < len(distances) else None,
        }
        for index, text in enumerate(documents)
    ]
