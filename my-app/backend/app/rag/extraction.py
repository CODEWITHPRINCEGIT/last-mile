"""PDF text extraction using PyMuPDF."""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    import pymupdf as fitz
except ImportError:  # pragma: no cover - dependency installation issue
    fitz = None  # type: ignore[assignment]


class DocumentExtractionError(Exception):
    """Raised when a PDF cannot provide usable text."""


def extract_pdf_pages(file_path: Path) -> list[dict[str, int | str]]:
    if fitz is None:
        raise DocumentExtractionError("PDF extraction dependency is unavailable")

    pages: list[dict[str, int | str]] = []
    try:
        with fitz.open(file_path) as pdf:
            if pdf.page_count == 0:
                raise DocumentExtractionError("The PDF has no pages")
            for page_number, page in enumerate(pdf, start=1):
                text = page.get_text("text").strip()
                if text:
                    pages.append({"page": page_number, "text": text})
    except DocumentExtractionError:
        raise
    except Exception as exc:
        logger.exception("PDF extraction failed")
        raise DocumentExtractionError("The PDF could not be read") from exc

    if not pages:
        raise DocumentExtractionError("The PDF contains no extractable text")
    return pages
