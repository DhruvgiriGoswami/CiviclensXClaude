"""Add upvotes column to complaints table

Revision ID: 010_add_complaint_upvotes
Revises: 009_seed_ap_districts
Create Date: 2026-10-12

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "010_add_complaint_upvotes"
down_revision: Union[str, None] = "009_seed_ap_districts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE complaints ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0;
        UPDATE complaints SET upvotes = 3 WHERE upvotes = 0;
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE complaints DROP COLUMN IF EXISTS upvotes;
    """))
