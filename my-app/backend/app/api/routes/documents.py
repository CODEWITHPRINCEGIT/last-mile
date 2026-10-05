"""User-owned PDF document endpoints."""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import get_db
from app.schemas.document import DocumentResponse, DocumentType
from app.services import document_service, storage_service
from app.services.ingestion_service import process_document_background
from app.services.user_service import get_or_create_user
from app.rag.vector_store import delete_document_chunks

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload an academic PDF",
    description=(
        "Validates and stores a PDF, creates an owned document record, and starts extraction, "
        "chunking, embedding, and ChromaDB processing in a background task."
    ),
    responses={400: {"description": "Invalid upload"}, 401: {"description": "Authentication required"}, 413: {"description": "File too large"}, 415: {"description": "Unsupported file type"}},
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF document to process"),
    document_type: DocumentType = Form(DocumentType.other),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if (file.content_type or "").lower() != "application/pdf":
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF files are supported")

    content = await file.read(settings.max_upload_size_bytes + 1)
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds the upload size limit")
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty")

    user = get_or_create_user(db, current_user)
    try:
        stored_filename = storage_service.save_upload(content)
        document = document_service.create_document(
            db,
            user_id=user.id,
            filename=stored_filename,
            original_filename=file.filename or "uploaded.pdf",
            content_type="application/pdf",
            file_size=len(content),
            document_type=document_type,
        )
    except Exception as exc:
        logger.exception("Could not save uploaded document")
        raise HTTPException(status_code=500, detail="The document could not be saved") from exc

    background_tasks.add_task(process_document_background, document.id, user.id, document.filename)
    return document


@router.get(
    "",
    response_model=list[DocumentResponse],
    summary="List the current user's documents",
    description="Returns only documents owned by the authenticated Firebase user.",
)
def list_user_documents(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    return document_service.list_documents(db, user.id)


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get one owned document",
    description="Returns a document only when it belongs to the authenticated user.",
    responses={404: {"description": "Document not found"}},
)
def get_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    document = document_service.get_owned_document(db, document_id, user.id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one owned document",
    description="Deletes the database record, local PDF, and user-scoped ChromaDB chunks.",
    responses={404: {"description": "Document not found"}},
)
def delete_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    document = document_service.get_owned_document(db, document_id, user.id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    delete_document_chunks(document.id, user.id)
    storage_service.delete_upload(document.filename)
    document_service.delete_document(db, document)
