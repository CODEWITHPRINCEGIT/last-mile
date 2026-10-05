from uuid import uuid4

from app.db.models.session import StudySession
from app.db.models.user import User


def test_session_ownership_is_enforced(client, db_session):
    owner = User(id=str(uuid4()), firebase_uid="another-user", email="owner@example.com")
    session = StudySession(id=str(uuid4()), user_id=owner.id, title="Private", mode="panic")
    db_session.add_all([owner, session])
    db_session.commit()

    response = client.get(f"/sessions/{session.id}")
    assert response.status_code == 404
