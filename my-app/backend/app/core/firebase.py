"""Firebase Admin SDK initialization from environment variables."""

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

try:  # Keep public health/docs usable before optional auth dependencies are installed.
    import firebase_admin
    from firebase_admin import auth, credentials
except ImportError:  # pragma: no cover - exercised only in an incomplete environment
    firebase_admin = None  # type: ignore[assignment]
    auth = None  # type: ignore[assignment]
    credentials = None  # type: ignore[assignment]


def _has_firebase_configuration() -> bool:
    values = (
        settings.firebase_project_id,
        settings.firebase_client_email,
        settings.firebase_private_key,
    )
    return all(value and not value.startswith("your_") for value in values)


def initialize_firebase() -> Any | None:
    """Initialize Firebase once, or return ``None`` when it is not configured."""

    if firebase_admin is None:
        logger.warning("firebase-admin is not installed; protected routes cannot authenticate")
        return None

    try:
        return firebase_admin.get_app()
    except ValueError:
        pass

    if not _has_firebase_configuration():
        logger.warning("Firebase Admin credentials are not configured")
        return None

    private_key = (settings.firebase_private_key or "").replace("\\n", "\n")
    service_account = {
        "type": "service_account",
        "project_id": settings.firebase_project_id,
        "client_email": settings.firebase_client_email,
        "private_key": private_key,
        "token_uri": "https://oauth2.googleapis.com/token",
    }
    app = firebase_admin.initialize_app(
        credentials.Certificate(service_account),
        {"projectId": settings.firebase_project_id},
    )
    logger.info("Firebase Admin initialized")
    return app


def verify_id_token(id_token: str) -> dict[str, Any]:
    """Verify a Firebase ID token and return its decoded claims."""

    if auth is None or initialize_firebase() is None:
        raise RuntimeError("Firebase Admin is not configured")
    return auth.verify_id_token(id_token)
