"""Grounded study chat endpoint."""

import logging
import re
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import get_db
from app.db.models.message import Message
from app.schemas.chat import ChatRequest, ChatResponse, SourceReference
from app.services.chat_service import ChatService, ChatServiceError
from app.services import document_service, session_service
from app.services.user_service import get_or_create_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def _requested_document_ids(db: Session, user_id: str, question: str) -> list[str] | None:
    """Resolve explicit @file or full filename references without broadening retrieval."""

    documents = [
        document
        for document in document_service.list_documents(db, user_id)
        if document.status == "ready"
    ]
    normalized_question = question.casefold()
    mentions = re.findall(r"@([^\s,;!?]+)", normalized_question)
    matched_ids: list[str] = []

    for document in documents:
        filename = document.original_filename.casefold()
        compact_filename = re.sub(r"[^a-z0-9]+", "", filename.rsplit(".", 1)[0])
        if filename in normalized_question:
            matched_ids.append(document.id)
            continue

        if any(
            re.sub(r"[^a-z0-9]+", "", mention) in compact_filename
            for mention in mentions
        ):
            matched_ids.append(document.id)

    if "@" in question:
        return list(dict.fromkeys(matched_ids))

    return list(dict.fromkeys(matched_ids)) or None


@router.post(
    "",
    response_model=ChatResponse,
    summary="Ask a grounded study question",
    description=(
        "Verifies session ownership, retrieves user-scoped document chunks, asks Gemini using the selected "
        "study mode, stores both messages, and returns source references."
    ),
    responses={401: {"description": "Authentication required"}, 404: {"description": "Session not found"}, 503: {"description": "AI service unavailable"}},
)
def chat(
    payload: ChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    study_session = session_service.get_owned_session(db, payload.session_id, user.id)
    if study_session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    recent_messages = session_service.list_recent_messages(
        db,
        study_session.id,
        user.id,
    )
    study_session.mode = payload.mode.value
    study_session.updated_at = datetime.now(timezone.utc)
    document_ids = _requested_document_ids(db, user.id, payload.message)
    user_message = Message(
        id=str(uuid4()),
        session_id=study_session.id,
        user_id=user.id,
        role="user",
        content=payload.message.strip(),
    )
    db.add(user_message)

    try:
        chat_kwargs = {
            "user_id": user.id,
            "question": payload.message.strip(),
            "mode": payload.mode,
            "conversation": [
                {"role": message.role, "content": message.content}
                for message in recent_messages
            ],
        }
        if document_ids is not None:
            chat_kwargs["document_ids"] = document_ids

        answer, chunks = ChatService().answer(**chat_kwargs)
    except ChatServiceError as exc:
        db.rollback()
        logger.warning("Chat service unavailable: %s", str(exc))
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="The AI service is unavailable") from exc
    except Exception as exc:
        db.rollback()
        logger.exception("RAG chat failed")
        raise HTTPException(status_code=500, detail="The study answer could not be generated") from exc

    assistant_message = Message(
        id=str(uuid4()),
        session_id=study_session.id,
        user_id=user.id,
        role="assistant",
        content=answer,
    )
    db.add(assistant_message)
    db.commit()
    return ChatResponse(
        session_id=study_session.id,
        message_id=assistant_message.id,
        answer=answer,
        sources=[
            SourceReference(
                document_id=str(chunk["metadata"].get("document_id", "")),
                filename=str(chunk["metadata"].get("filename", "unknown")),
                page=int(chunk["metadata"].get("page", 0)),
            )
            for chunk in chunks
            if chunk.get("metadata", {}).get("document_id")
        ],
    )
