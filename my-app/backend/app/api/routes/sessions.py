"""User-owned study session endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import get_db
from app.schemas.chat import MessageResponse
from app.schemas.session import SessionCreate, SessionResponse
from app.services import session_service
from app.services.user_service import get_or_create_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post(
    "",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a study session",
    description="Creates a study session owned by the authenticated user.",
    responses={401: {"description": "Authentication required"}},
)
def create_session(
    payload: SessionCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    return session_service.create_session(db, user.id, payload)


@router.get(
    "",
    response_model=list[SessionResponse],
    summary="List the current user's study sessions",
    description="Returns only sessions owned by the authenticated user.",
)
def list_user_sessions(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    return session_service.list_sessions(db, user.id)


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Get one owned study session",
    description="Returns a session only when it belongs to the authenticated user.",
    responses={404: {"description": "Session not found"}},
)
def get_session(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    session = session_service.get_owned_session(db, session_id, user.id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get(
    "/{session_id}/messages",
    response_model=list[MessageResponse],
    summary="Get one session's chat history",
    description="Returns the chronologically ordered messages for an owned study session.",
    responses={404: {"description": "Session not found"}},
)
def list_session_messages(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    session = session_service.get_owned_session(db, session_id, user.id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_service.list_messages(db, session.id, user.id)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one owned study session",
    description="Deletes the session and its messages only when it belongs to the authenticated user.",
    responses={404: {"description": "Session not found"}},
)
def delete_session(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = get_or_create_user(db, current_user)
    session = session_service.get_owned_session(db, session_id, user.id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    session_service.delete_session(db, session)
