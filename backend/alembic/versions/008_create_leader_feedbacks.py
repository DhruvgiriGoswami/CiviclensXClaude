"""Create leader_feedbacks table for citizen reviews and ratings

Revision ID: 008_create_leader_feedbacks
Revises: 007_update_states_budgets
Create Date: 2026-10-11

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "008_create_leader_feedbacks"
down_revision: Union[str, None] = "007_update_states_budgets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "leader_feedbacks",
        sa.Column("feedback_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("leader_name", sa.String(length=255), nullable=False),
        sa.Column("leader_id", sa.Integer(), nullable=True),
        sa.Column("leader_type", sa.String(length=50), nullable=False, server_default="POLITICAL"),
        sa.Column("geo_unit_id", sa.String(length=100), nullable=True),
        sa.Column("citizen_name", sa.String(length=255), nullable=False, server_default="Anonymous"),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("responsiveness_score", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("transparency_score", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("feedback_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index("ix_leader_feedbacks_leader_name", "leader_feedbacks", ["leader_name"])
    op.create_index("ix_leader_feedbacks_created_at", "leader_feedbacks", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_leader_feedbacks_created_at", table_name="leader_feedbacks")
    op.drop_index("ix_leader_feedbacks_leader_name", table_name="leader_feedbacks")
    op.drop_table("leader_feedbacks")
