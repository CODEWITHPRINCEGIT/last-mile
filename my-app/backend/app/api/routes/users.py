"""Authenticated user profile endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import get_db
from app.schemas.user import UserResponse
from app.services.user_service import get_or_create_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current user",
    description="Creates or updates the local user record from verified Firebase claims.",
)
def get_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_or_create_user(db, current_user)
