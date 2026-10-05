"""Page-aware text chunking with LangChain's recursive splitter."""

from dataclasses import dataclass

from app.core.config import settings

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:  # pragma: no cover - dependency installation issue
    RecursiveCharacterTextSplitter = None  # type: ignore[assignment]


@dataclass(frozen=True)
class TextChunk:
    chunk_id: str
    text: str
    metadata: dict[str, str | int]


def chunk_pages(
    pages: list[dict[str, int | str]],
    *,
    user_id: str,
    document_id: str,
    filename: str,
    document_type: str,
) -> list[TextChunk]:
    if RecursiveCharacterTextSplitter is None:
        raise RuntimeError("Text splitting dependency is unavailable")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks: list[TextChunk] = []
    for page in pages:
        page_number = int(page["page"])
        page_text = str(page["text"])
        for text in splitter.split_text(page_text):
            if text.strip():
                chunk_index = len(chunks)
                chunks.append(
                    TextChunk(
                        chunk_id=f"{document_id}:{chunk_index}",
                        text=text.strip(),
                        metadata={
                            "user_id": user_id,
                            "document_id": document_id,
                            "filename": filename,
                            "page": page_number,
                            "document_type": document_type,
                            "chunk_index": chunk_index,
                        },
                    )
                )
    if not chunks:
        raise ValueError("The document did not produce any text chunks")
    return chunks
