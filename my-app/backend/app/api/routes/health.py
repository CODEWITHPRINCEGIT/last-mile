"""Public health endpoints."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get(
    "/",
    summary="API welcome",
    description="Returns the public API welcome message.",
    response_model=dict[str, str],
)
def root() -> dict[str, str]:
    return {"message": "Last-Mile Study Engine API"}


@router.get(
    "/health",
    summary="Health check",
    description="Returns a lightweight liveness response without requiring external services.",
    response_model=dict[str, str],
)
def health() -> dict[str, str]:
    return {"status": "ok"}
