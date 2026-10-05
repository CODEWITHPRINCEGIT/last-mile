"""Document request and response schemas."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class DocumentType(StrEnum):
    syllabus = "syllabus"
    lecture_notes = "lecture_notes"
    lecture_slides = "lecture_slides"
    pyq = "pyq"
    other = "other"


class DocumentStatus(StrEnum):
    uploaded = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    original_filename: str
    content_type: str
    file_size: int
    status: DocumentStatus
    document_type: DocumentType
    error_message: str | None
    created_at: datetime
    updated_at: datetime
