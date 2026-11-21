"""Add data release and data provenance tracking tables

Revision ID: 003_add_data_version_tracking
Revises: 002_canonical_trgm_indexes
Create Date: 2026-09-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "003_add_data_version_tracking"
down_revision: Union[str, None] = "002_canonical_trgm_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Data Releases Registry Table
    op.create_table(
        "data_releases",
        sa.Column("release_id", sa.String(length=100), primary_key=True, nullable=False),
        sa.Column("version", sa.String(length=50), nullable=False),
        sa.Column("release_date", sa.String(length=50), nullable=False),
        sa.Column("source_artifact", sa.String(length=255), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("canonical", sa.Boolean(), server_default=sa.text("true"), nullable=True),
        sa.Column("environment", sa.String(length=50), server_default="canonical", nullable=True),
        sa.Column("schema_compatibility", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="ACTIVE", nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        if_not_exists=True,
    )

    # 2. Data Sources Provenance Table
    op.create_table(
        "data_sources",
        sa.Column("source_id", sa.String(length=100), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("provider", sa.String(length=255), nullable=True),
        sa.Column("file_hash", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        if_not_exists=True,
    )

    # 3. Data Ingestion Runs Audit Table
    op.create_table(
        "data_ingestion_runs",
        sa.Column("run_id", sa.String(length=100), primary_key=True, nullable=False),
        sa.Column(
            "release_id",
            sa.String(length=100),
            sa.ForeignKey("data_releases.release_id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "source_id",
            sa.String(length=100),
            sa.ForeignKey("data_sources.source_id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("pipeline", sa.String(length=100), nullable=False),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("records_read", sa.Integer(), server_default="0", nullable=True),
        sa.Column("records_inserted", sa.Integer(), server_default="0", nullable=True),
        sa.Column("records_updated", sa.Integer(), server_default="0", nullable=True),
        sa.Column("records_rejected", sa.Integer(), server_default="0", nullable=True),
        sa.Column("errors", sa.JSON(), nullable=True),
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_table("data_ingestion_runs", if_exists=True)
    op.drop_table("data_sources", if_exists=True)
    op.drop_table("data_releases", if_exists=True)
