"""Canonical schema GIN trigram indexes for pg_trgm fuzzy search

Revision ID: 002_canonical_trgm_indexes
Revises: 001_initial_schema
Create Date: 2026-09-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_canonical_trgm_indexes"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pg_trgm extension for PostgreSQL trigram fuzzy search
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    # 2. GIN Trigram indexes on canonical entities
    op.execute("CREATE INDEX IF NOT EXISTS ix_geo_units_name_trgm ON geo_units USING gin (name gin_trgm_ops);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_persons_full_name_trgm ON persons USING gin (full_name gin_trgm_ops);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_political_parties_name_trgm ON political_parties USING gin (name gin_trgm_ops);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_organizations_name_trgm ON organizations USING gin (name gin_trgm_ops);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_organizations_name_trgm;")
    op.execute("DROP INDEX IF EXISTS ix_political_parties_name_trgm;")
    op.execute("DROP INDEX IF EXISTS ix_persons_full_name_trgm;")
    op.execute("DROP INDEX IF EXISTS ix_geo_units_name_trgm;")
