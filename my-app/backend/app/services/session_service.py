"""Database operations for user-owned study sessions."""

from uuid import uuid4

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.models.message import Message
from app.db.models.session import StudySession
from app.schemas.session import SessionCreate


RECENT_CHAT_MESSAGE_LIMIT = 12


def create_session(db: Session, user_id: str, payload: SessionCreate) -> StudySession:
    session = StudySession(
        id=str(uuid4()),
        user_id=user_id,
        title=payload.title.strip(),
        mode=payload.mode.value,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_sessions(db: Session, user_id: str) -> list[StudySession]:
    return list(
        db.scalars(
            select(StudySession).where(StudySession.user_id == user_id).order_by(StudySession.updated_at.desc())
        ).all()
    )


def get_owned_session(db: Session, session_id: str, user_id: str) -> StudySession | None:
    return db.scalar(select(StudySession).where(StudySession.id == session_id, StudySession.user_id == user_id))


def list_messages(db: Session, session_id: str, user_id: str) -> list[Message]:
    return list(
        db.scalars(
            select(Message)
            .where(Message.session_id == session_id, Message.user_id == user_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
        ).all()
    )


def list_recent_messages(
    db: Session,
    session_id: str,
    user_id: str,
    limit: int = RECENT_CHAT_MESSAGE_LIMIT,
) -> list[Message]:
    messages = list(
        db.scalars(
            select(Message)
            .where(Message.session_id == session_id, Message.user_id == user_id)
            .order_by(desc(Message.created_at), desc(Message.id))
            .limit(limit)
        ).all()
    )
    return list(reversed(messages))


def delete_session(db: Session, session: StudySession) -> None:
    db.delete(session)
    db.commit()
