"""Background document processing service."""

import logging

from app.db.database import SessionLocal
from app.db.models.document import Document
from app.rag.pipeline import ingest_pdf
from app.services.document_service import update_document_status
from app.services.storage_service import get_upload_path

logger = logging.getLogger(__name__)


def process_document_background(document_id: str, user_id: str, filename: str) -> None:
    """Process one document using a fresh DB session for BackgroundTasks."""

    db = SessionLocal()
    try:
        document = db.get(Document, document_id)
        if document is None or document.user_id != user_id:
            logger.warning("Skipping document processing for missing or non-owned document")
            return
        update_document_status(db, document_id, status="processing")
        ingest_pdf(
            get_upload_path(filename),
            user_id=user_id,
            document_id=document_id,
            filename=document.original_filename,
            document_type=document.document_type,
        )
        update_document_status(db, document_id, status="ready")
    except Exception as exc:
        logger.exception("Document processing failed")
        update_document_status(
            db,
            document_id,
            status="failed",
            error_message="The document could not be processed. Check backend logs for details.",
        )
    finally:
        db.close()
