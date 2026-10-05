"""Associate persisted chat messages with their authenticated user."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_add_message_user_id"
down_revision: Union[str, Sequence[str], None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    op.add_column("messages", sa.Column("user_id", sa.String(length=36), nullable=True))
    op.execute(
        sa.text(
            "UPDATE messages "
            "SET user_id = (SELECT study_sessions.user_id "
            "FROM study_sessions WHERE study_sessions.id = messages.session_id)"
        )
    )

    if is_sqlite:
        with op.batch_alter_table("messages", recreate="always") as batch_op:
            batch_op.alter_column("user_id", existing_type=sa.String(length=36), nullable=False)
            batch_op.create_foreign_key(
                "fk_messages_user_id_users",
                "users",
                ["user_id"],
                ["id"],
                ondelete="CASCADE",
            )
    else:
        op.alter_column("messages", "user_id", existing_type=sa.String(length=36), nullable=False)
        op.create_foreign_key(
            "fk_messages_user_id_users",
            "messages",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )

    op.create_index("ix_messages_user_id", "messages", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_messages_user_id", table_name="messages")
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("messages", recreate="always") as batch_op:
            batch_op.drop_constraint("fk_messages_user_id_users", type_="foreignkey")
            batch_op.drop_column("user_id")
    else:
        op.drop_constraint("fk_messages_user_id_users", "messages", type_="foreignkey")
        op.drop_column("messages", "user_id")
