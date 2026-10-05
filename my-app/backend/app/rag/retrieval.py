"""User-isolated retrieval over ChromaDB."""

from typing import Any

from app.core.config import settings
from app.rag.embeddings import EmbeddingService
from app.rag.vector_store import query_chunks


def retrieve(
    *,
    user_id: str,
    query: str,
    document_ids: list[str] | None = None,
    top_k: int | None = None,
) -> list[dict[str, Any]]:
    """Retrieve only chunks carrying the authenticated user's metadata."""

    if document_ids == []:
        return []

    embedding = EmbeddingService().embed_query(query)
    chunks = query_chunks(
        user_id=user_id,
        query_embedding=embedding,
        document_ids=document_ids,
        top_k=top_k or settings.retrieval_top_k,
    )

    if document_ids is not None:
        return chunks

    return [
        chunk
        for chunk in chunks
        if chunk.get("distance") is None
        or float(chunk["distance"]) <= settings.retrieval_distance_threshold
    ]
