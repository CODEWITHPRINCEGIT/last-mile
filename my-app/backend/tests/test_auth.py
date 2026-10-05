from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.main import app


def test_protected_endpoint_requires_token():
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as client:
        response = client.get("/documents")
    assert response.status_code == 401
    app.dependency_overrides.clear()


def test_invalid_authentication(monkeypatch):
    def reject_token(_token):
        raise ValueError("invalid token")

    monkeypatch.setattr("app.core.security.verify_id_token", reject_token)
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as client:
        response = client.get("/documents", headers={"Authorization": "Bearer invalid"})
    assert response.status_code == 401
    app.dependency_overrides.clear()
