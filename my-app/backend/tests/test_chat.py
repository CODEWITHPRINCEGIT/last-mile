from datetime import datetime, timezone
from uuid import uuid4

from app.db.models.message import Message
from app.db.models.session import StudySession
from app.db.models.user import User
from app.services.chat_service import ChatService


def test_chat_validates_mode(client):
    response = client.post(
        "/chat",
        json={"session_id": "not-a-real-session", "message": "Explain TCP", "mode": "unknown"},
    )
    assert response.status_code == 422


def _seed_session(db_session):
    user = User(id=str(uuid4()), firebase_uid="firebase-test-user", email="test@example.com")
    study_session = StudySession(
        id=str(uuid4()),
        user_id=user.id,
        title="Operating systems",
        mode="panic",
    )
    db_session.add_all([user, study_session])
    db_session.commit()
    return user, study_session


def test_session_messages_are_returned_in_chronological_order(client, db_session):
    user, study_session = _seed_session(db_session)
    db_session.add_all(
        [
            Message(
                id=str(uuid4()),
                session_id=study_session.id,
                user_id=user.id,
                role="assistant",
                content="The answer",
                created_at=datetime(2026, 1, 1, 0, 0, 2, tzinfo=timezone.utc),
            ),
            Message(
                id=str(uuid4()),
                session_id=study_session.id,
                user_id=user.id,
                role="user",
                content="The question",
                created_at=datetime(2026, 1, 1, 0, 0, 1, tzinfo=timezone.utc),
            ),
        ]
    )
    db_session.commit()

    response = client.get(f"/sessions/{study_session.id}/messages")

    assert response.status_code == 200
    assert [message["role"] for message in response.json()] == ["user", "assistant"]


def test_chat_persists_messages_and_passes_recent_history(client, db_session, monkeypatch):
    user, study_session = _seed_session(db_session)
    db_session.add_all(
        [
            Message(
                id=str(uuid4()),
                session_id=study_session.id,
                user_id=user.id,
                role="user",
                content="What is process scheduling?",
            ),
            Message(
                id=str(uuid4()),
                session_id=study_session.id,
                user_id=user.id,
                role="assistant",
                content="It decides which process runs next.",
            ),
        ]
    )
    db_session.commit()
    captured: dict[str, object] = {}

    def fake_answer(self, *, user_id, question, mode, conversation=None):
        captured["conversation"] = conversation
        return "Use a ready queue to choose the next process.", []

    monkeypatch.setattr(ChatService, "answer", fake_answer)

    response = client.post(
        "/chat",
        json={
            "session_id": study_session.id,
            "message": "Explain the second point with an example.",
            "mode": "panic",
        },
    )

    assert response.status_code == 200
    assert captured["conversation"] == [
        {"role": "user", "content": "What is process scheduling?"},
        {"role": "assistant", "content": "It decides which process runs next."},
    ]
    persisted = db_session.query(Message).filter(Message.session_id == study_session.id).all()
    assert [(message.role, message.content) for message in persisted][-2:] == [
        ("user", "Explain the second point with an example."),
        ("assistant", "Use a ready queue to choose the next process."),
    ]
