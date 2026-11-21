"""Upvotes on hackathon (BMC25-*) complaints, which live in CSVs rather than the complaints table

Revision ID: 011_audit_complaint_upvotes
Revises: 010_add_complaint_upvotes
Create Date: 2026-11-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "011_audit_complaint_upvotes"
down_revision: Union[str, None] = "010_add_complaint_upvotes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Votes added on top of the dataset's own upvote count.
    op.get_bind().execute(sa.text("""
        CREATE TABLE IF NOT EXISTS audit_complaint_upvotes (
            complaint_id VARCHAR(40) PRIMARY KEY,
            upvotes INTEGER NOT NULL DEFAULT 0
        );
    """))


def downgrade() -> None:
    op.get_bind().execute(sa.text("DROP TABLE IF EXISTS audit_complaint_upvotes;"))
