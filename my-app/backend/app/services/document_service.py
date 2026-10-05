"""Database operations for user-owned documents."""

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.document import Document
from app.schemas.document import DocumentType


def create_document(
    db: Session,
    *,
    user_id: str,
    filename: str,
    original_filename: str,
    content_type: str,
    file_size: int,
    document_type: DocumentType,
) -> Document:
    document = Document(
        id=str(uuid4()),
        user_id=user_id,
        filename=filename,
        original_filename=original_filename[:255],
        content_type=content_type,
        file_size=file_size,
        status="uploaded",
        document_type=document_type.value,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def list_documents(db: Session, user_id: str) -> list[Document]:
    return list(
        db.scalars(
            select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc())
        ).all()
    )


def get_owned_document(db: Session, document_id: str, user_id: str) -> Document | None:
    return db.scalar(select(Document).where(Document.id == document_id, Document.user_id == user_id))


def update_document_status(
    db: Session,
    document_id: str,
    *,
    status: str,
    error_message: str | None = None,
) -> Document | None:
    document = db.get(Document, document_id)
    if document is None:
        return None
    document.status = status
    document.error_message = error_message
    db.commit()
    db.refresh(document)
    return document


def delete_document(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()
