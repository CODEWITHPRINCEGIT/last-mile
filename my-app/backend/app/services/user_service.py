"""Helpers for keeping a local user row in sync with Firebase claims."""

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser
from app.db.models.user import User


def get_or_create_user(db: Session, authenticated_user: AuthenticatedUser) -> User:
    user = db.scalar(select(User).where(User.firebase_uid == authenticated_user.uid))
    if user is None:
        user = User(
            id=str(uuid4()),
            firebase_uid=authenticated_user.uid,
            email=authenticated_user.email,
            display_name=authenticated_user.display_name,
        )
        db.add(user)
    else:
        user.email = authenticated_user.email
        user.display_name = authenticated_user.display_name
    db.commit()
    db.refresh(user)
    return user
