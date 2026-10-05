"""Study session schemas."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class StudyMode(StrEnum):
    panic = "panic"
    exam_answers = "exam_answers"
    reverse_revision = "reverse_revision"
    deep_architecture = "deep_architecture"


class SessionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    mode: StudyMode


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    mode: StudyMode
    created_at: datetime
    updated_at: datetime
