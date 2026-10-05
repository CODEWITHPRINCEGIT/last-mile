"""The small, explicit RAG pipeline used by chat and document ingestion."""

import re

from app.rag.chunking import TextChunk, chunk_pages
from app.rag.embeddings import EmbeddingService
from app.rag.extraction import extract_pdf_pages
from app.rag.prompts import build_context, build_system_instruction, build_user_prompt
from app.rag.retrieval import retrieve
from app.rag.vector_store import add_chunks
from app.schemas.session import StudyMode


CASUAL_MESSAGE_PATTERNS = (
    r"^(hi|hello|hey|hii|namaste)(?:\s+(there|assistant|last[- ]mile))?[!.?]*$",
    r"^(how are you|what(?:'s| is) your mood|what can you help me with|what is your name|who are you)[!.?]*$",
    r"^(thanks|thank you|bye|goodbye)[!.?]*$",
)


def is_casual_message(question: str) -> bool:
    normalized = " ".join(question.lower().strip().split())
    return any(re.match(pattern, normalized) for pattern in CASUAL_MESSAGE_PATTERNS)


def ingest_pdf(
    file_path,
    *,
    user_id: str,
    document_id: str,
    filename: str,
    document_type: str,
) -> list[TextChunk]:
    pages = extract_pdf_pages(file_path)
    chunks = chunk_pages(
        pages,
        user_id=user_id,
        document_id=document_id,
        filename=filename,
        document_type=document_type,
    )
    embeddings = EmbeddingService().embed_documents([chunk.text for chunk in chunks])
    add_chunks(chunks, embeddings)
    return chunks


def prepare_chat_prompt(
    user_id: str,
    question: str,
    mode: StudyMode,
    conversation: list[dict[str, str]] | None = None,
    document_ids: list[str] | None = None,
) -> tuple[str, str, list[dict]]:
    chunks = []
    if document_ids is not None:
        chunks = retrieve(user_id=user_id, query=question, document_ids=document_ids)
    elif not is_casual_message(question):
        chunks = retrieve(user_id=user_id, query=question)

    context = build_context(chunks)
    return (
        build_system_instruction(mode),
        build_user_prompt(question, context, conversation=conversation),
        chunks,
    )
