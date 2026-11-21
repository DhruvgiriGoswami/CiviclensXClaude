"""Initial Phase 1 schema with PostGIS

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-09-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # ── GEOGRAPHY ──

    op.create_table(
        "geo_unit_types",
        sa.Column("unit_type_id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
    )

    op.create_table(
        "geo_units",
        sa.Column("unit_id", sa.String(100), primary_key=True),
        sa.Column("unit_type_id", sa.String(50), sa.ForeignKey("geo_unit_types.unit_type_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("official_code", sa.String(100)),
        sa.Column("state_code", sa.String(50)),
        sa.Column("district_code", sa.String(100)),
        sa.Column("parent_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("level", sa.Integer),
        sa.Column("description", sa.Text),
        sa.Column("valid_from", sa.Date),
        sa.Column("valid_to", sa.Date),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_geo_units_unit_type_id", "geo_units", ["unit_type_id"])
    op.create_index("ix_geo_units_parent_unit_id", "geo_units", ["parent_unit_id"])
    op.create_index("ix_geo_units_official_code", "geo_units", ["official_code"])
    op.create_index("ix_geo_units_state_code", "geo_units", ["state_code"])
    op.create_index("ix_geo_units_district_code", "geo_units", ["district_code"])
    op.create_index("ix_geo_units_is_active", "geo_units", ["is_active"])

    op.create_table(
        "geo_unit_relationships",
        sa.Column("relationship_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("from_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("to_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("relationship_type", sa.String(50), nullable=False),
        sa.Column("valid_from", sa.Date),
        sa.Column("valid_to", sa.Date),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_geo_unit_relationships_from_unit_id", "geo_unit_relationships", ["from_unit_id"])
    op.create_index("ix_geo_unit_relationships_to_unit_id", "geo_unit_relationships", ["to_unit_id"])
    op.create_index("ix_geo_unit_relationships_relationship_type", "geo_unit_relationships", ["relationship_type"])

    op.create_table(
        "boundary_sources",
        sa.Column("boundary_source_id", sa.String(100), primary_key=True),
        sa.Column("source_name", sa.String(500), nullable=False),
        sa.Column("file_name", sa.String(500)),
        sa.Column("file_type", sa.String(50)),
        sa.Column("storage_url", sa.String(1000)),
        sa.Column("source_authority", sa.String(500)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("checksum_sha256", sa.String(128)),
        sa.Column("coordinate_system", sa.String(100)),
        sa.Column("version", sa.String(50)),
        sa.Column("imported_at", sa.DateTime),
        sa.Column("is_current", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_boundary_sources_source_authority", "boundary_sources", ["source_authority"])
    op.create_index("ix_boundary_sources_checksum_sha256", "boundary_sources", ["checksum_sha256"])
    op.create_index("ix_boundary_sources_is_current", "boundary_sources", ["is_current"])

    op.create_table(
        "geo_unit_boundaries",
        sa.Column("boundary_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("boundary_source_id", sa.String(100), sa.ForeignKey("boundary_sources.boundary_source_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("geometry", Geometry("MULTIPOLYGON", srid=4326), nullable=False),
        sa.Column("geometry_format", sa.String(50)),
        sa.Column("area_sq_km", sa.Numeric(20, 6)),
        sa.Column("geometry_hash", sa.String(128)),
        sa.Column("valid_from", sa.DateTime),
        sa.Column("valid_to", sa.DateTime),
        sa.Column("is_current", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_geo_unit_boundaries_unit_id", "geo_unit_boundaries", ["unit_id"])
    op.create_index("ix_geo_unit_boundaries_boundary_source_id", "geo_unit_boundaries", ["boundary_source_id"])
    op.create_index("ix_geo_unit_boundaries_geometry_hash", "geo_unit_boundaries", ["geometry_hash"])
    op.create_index("ix_geo_unit_boundaries_is_current", "geo_unit_boundaries", ["is_current"])
    op.create_index("ix_geo_unit_boundaries_geometry", "geo_unit_boundaries", ["geometry"], postgresql_using="gist")

    # ── PEOPLE / AUTHORITY ──

    op.create_table(
        "persons",
        sa.Column("person_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("designation", sa.String(255)),
        sa.Column("phone", sa.String(30)),
        sa.Column("email", sa.String(255)),
        sa.Column("photo_url", sa.String(1000)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_persons_full_name", "persons", ["full_name"])
    op.create_index("ix_persons_phone", "persons", ["phone"])
    op.create_index("ix_persons_email", "persons", ["email"])
    op.create_index("ix_persons_is_active", "persons", ["is_active"])

    op.create_table(
        "political_parties",
        sa.Column("party_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("abbreviation", sa.String(50), unique=True),
        sa.Column("official_code", sa.String(100)),
        sa.Column("website", sa.String(500)),
        sa.Column("logo_url", sa.String(1000)),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_political_parties_abbreviation", "political_parties", ["abbreviation"], unique=True)

    op.create_table(
        "organizations",
        sa.Column("organization_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("organization_type", sa.String(100), nullable=False),
        sa.Column("parent_organization_id", sa.BigInteger, sa.ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("contact_phone", sa.String(30)),
        sa.Column("contact_email", sa.String(255)),
        sa.Column("website", sa.String(500)),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_organizations_organization_type", "organizations", ["organization_type"])
    op.create_index("ix_organizations_parent_organization_id", "organizations", ["parent_organization_id"])
    op.create_index("ix_organizations_is_active", "organizations", ["is_active"])

    op.create_table(
        "political_assignments",
        sa.Column("political_assignment_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("person_id", sa.BigInteger, sa.ForeignKey("persons.person_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("party_id", sa.BigInteger, sa.ForeignKey("political_parties.party_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("role_title", sa.String(255), nullable=False),
        sa.Column("authority_type", sa.String(100)),
        sa.Column("valid_from", sa.Date),
        sa.Column("valid_to", sa.Date),
        sa.Column("is_current", sa.Boolean, default=True),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_political_assignments_person_id", "political_assignments", ["person_id"])
    op.create_index("ix_political_assignments_party_id", "political_assignments", ["party_id"])
    op.create_index("ix_political_assignments_geo_unit_id", "political_assignments", ["geo_unit_id"])
    op.create_index("ix_political_assignments_authority_type", "political_assignments", ["authority_type"])
    op.create_index("ix_political_assignments_is_current", "political_assignments", ["is_current"])

    op.create_table(
        "officer_assignments",
        sa.Column("officer_assignment_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("person_id", sa.BigInteger, sa.ForeignKey("persons.person_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("organization_id", sa.BigInteger, sa.ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("designation", sa.String(255), nullable=False),
        sa.Column("authority_type", sa.String(100)),
        sa.Column("valid_from", sa.Date),
        sa.Column("valid_to", sa.Date),
        sa.Column("is_current", sa.Boolean, default=True),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_officer_assignments_person_id", "officer_assignments", ["person_id"])
    op.create_index("ix_officer_assignments_organization_id", "officer_assignments", ["organization_id"])
    op.create_index("ix_officer_assignments_geo_unit_id", "officer_assignments", ["geo_unit_id"])
    op.create_index("ix_officer_assignments_authority_type", "officer_assignments", ["authority_type"])
    op.create_index("ix_officer_assignments_is_current", "officer_assignments", ["is_current"])

    # ── USERS / COMPLAINTS ──

    op.create_table(
        "users",
        sa.Column("user_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("citizen_id", sa.String(100), unique=True),
        sa.Column("full_name", sa.String(255)),
        sa.Column("name", sa.String(255)),
        sa.Column("phone", sa.String(30)),
        sa.Column("email", sa.String(255)),
        sa.Column("created_at", sa.DateTime),
        sa.Column("is_active", sa.Boolean, default=True),
    )
    op.create_index("ix_users_phone", "users", ["phone"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "complaints",
        sa.Column("complaint_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("ticket_number", sa.String(100), unique=True),
        sa.Column("user_id", sa.BigInteger, sa.ForeignKey("users.user_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("priority", sa.String(50)),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("location_accuracy_m", sa.Numeric(10, 2)),
        sa.Column("address_text", sa.String(1000)),
        sa.Column("resolved_geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
        sa.Column("resolved_at", sa.DateTime),
    )
    op.create_index("ix_complaints_ticket_number", "complaints", ["ticket_number"], unique=True)
    op.create_index("ix_complaints_user_id", "complaints", ["user_id"])
    op.create_index("ix_complaints_geo_unit_id", "complaints", ["geo_unit_id"])
    op.create_index("ix_complaints_category", "complaints", ["category"])
    op.create_index("ix_complaints_status", "complaints", ["status"])
    op.create_index("ix_complaints_priority", "complaints", ["priority"])
    op.create_index("ix_complaints_resolved_geo_unit_id", "complaints", ["resolved_geo_unit_id"])
    op.create_index("ix_complaints_created_at", "complaints", ["created_at"])

    op.create_table(
        "media_assets",
        sa.Column("media_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("storage_url", sa.String(1000), nullable=False),
        sa.Column("file_name", sa.String(500)),
        sa.Column("mime_type", sa.String(100)),
        sa.Column("file_size_bytes", sa.BigInteger),
        sa.Column("checksum_sha256", sa.String(128)),
        sa.Column("latitude", sa.Numeric(10, 7)),
        sa.Column("longitude", sa.Numeric(10, 7)),
        sa.Column("captured_at", sa.DateTime),
        sa.Column("uploaded_at", sa.DateTime),
        sa.Column("metadata_json", sa.Text),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_media_assets_checksum_sha256", "media_assets", ["checksum_sha256"])
    op.create_index("ix_media_assets_captured_at", "media_assets", ["captured_at"])

    op.create_table(
        "complaint_media",
        sa.Column("complaint_media_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("complaint_id", sa.BigInteger, sa.ForeignKey("complaints.complaint_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("media_id", sa.BigInteger, sa.ForeignKey("media_assets.media_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_complaint_media_complaint_id", "complaint_media", ["complaint_id"])
    op.create_index("ix_complaint_media_media_id", "complaint_media", ["media_id"])

    # ── PROJECTS / WORK ──

    op.create_table(
        "projects",
        sa.Column("project_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("project_code", sa.String(100), unique=True, nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("category", sa.String(100)),
        sa.Column("owning_geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("implementing_organization_id", sa.BigInteger, sa.ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("sanctioned_amount", sa.Numeric(18, 2)),
        sa.Column("funding_source", sa.String(255)),
        sa.Column("status", sa.String(50)),
        sa.Column("start_date", sa.Date),
        sa.Column("expected_end_date", sa.Date),
        sa.Column("actual_end_date", sa.Date),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_projects_owning_geo_unit_id", "projects", ["owning_geo_unit_id"])
    op.create_index("ix_projects_implementing_organization_id", "projects", ["implementing_organization_id"])
    op.create_index("ix_projects_category", "projects", ["category"])
    op.create_index("ix_projects_status", "projects", ["status"])

    op.create_table(
        "project_geo_units",
        sa.Column("project_geo_unit_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("relationship_type", sa.String(50)),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_project_geo_units_project_id", "project_geo_units", ["project_id"])
    op.create_index("ix_project_geo_units_geo_unit_id", "project_geo_units", ["geo_unit_id"])

    op.create_table(
        "contractors",
        sa.Column("contractor_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("legal_name", sa.String(500), nullable=False),
        sa.Column("registration_number", sa.String(255)),
        sa.Column("gstin", sa.String(50)),
        sa.Column("pan", sa.String(20)),
        sa.Column("phone", sa.String(30)),
        sa.Column("email", sa.String(255)),
        sa.Column("address", sa.Text),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_contractors_registration_number", "contractors", ["registration_number"])
    op.create_index("ix_contractors_gstin", "contractors", ["gstin"])
    op.create_index("ix_contractors_pan", "contractors", ["pan"])

    op.create_table(
        "work_orders",
        sa.Column("work_order_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("work_order_number", sa.String(100), unique=True, nullable=False),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("contractor_id", sa.BigInteger, sa.ForeignKey("contractors.contractor_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("issuing_organization_id", sa.BigInteger, sa.ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("work_description", sa.Text),
        sa.Column("contract_amount", sa.Numeric(18, 2)),
        sa.Column("issue_date", sa.Date),
        sa.Column("start_date", sa.Date),
        sa.Column("end_date", sa.Date),
        sa.Column("status", sa.String(50)),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_work_orders_project_id", "work_orders", ["project_id"])
    op.create_index("ix_work_orders_contractor_id", "work_orders", ["contractor_id"])
    op.create_index("ix_work_orders_issuing_organization_id", "work_orders", ["issuing_organization_id"])
    op.create_index("ix_work_orders_status", "work_orders", ["status"])

    # ── FINANCE ──

    op.create_table(
        "bills",
        sa.Column("bill_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("bill_number", sa.String(150), unique=True, nullable=False),
        sa.Column("work_order_id", sa.BigInteger, sa.ForeignKey("work_orders.work_order_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("bill_type", sa.String(100)),
        sa.Column("bill_date", sa.Date),
        sa.Column("period_from", sa.Date),
        sa.Column("period_to", sa.Date),
        sa.Column("gross_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(18, 2)),
        sa.Column("deduction_amount", sa.Numeric(18, 2)),
        sa.Column("net_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("status", sa.String(50)),
        sa.Column("document_url", sa.String(1000)),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_bills_work_order_id", "bills", ["work_order_id"])
    op.create_index("ix_bills_project_id", "bills", ["project_id"])
    op.create_index("ix_bills_bill_date", "bills", ["bill_date"])
    op.create_index("ix_bills_status", "bills", ["status"])

    op.create_table(
        "bill_items",
        sa.Column("bill_item_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("bill_id", sa.BigInteger, sa.ForeignKey("bills.bill_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("description", sa.String(1000), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 4)),
        sa.Column("unit", sa.String(50)),
        sa.Column("unit_rate", sa.Numeric(18, 2)),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_bill_items_bill_id", "bill_items", ["bill_id"])

    op.create_table(
        "budgets",
        sa.Column("budget_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"), nullable=False),
        sa.Column("organization_id", sa.BigInteger, sa.ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("fiscal_year", sa.String(20), nullable=False),
        sa.Column("budget_type", sa.String(50), nullable=False),
        sa.Column("fund_source", sa.String(255)),
        sa.Column("allocated_amount", sa.Numeric(18, 2)),
        sa.Column("revised_amount", sa.Numeric(18, 2)),
        sa.Column("released_amount", sa.Numeric(18, 2)),
        sa.Column("utilized_amount", sa.Numeric(18, 2)),
        sa.Column("status", sa.String(50)),
        sa.Column("source_reference", sa.String(500)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("created_at", sa.DateTime),
        sa.Column("updated_at", sa.DateTime),
    )
    op.create_index("ix_budgets_geo_unit_id", "budgets", ["geo_unit_id"])
    op.create_index("ix_budgets_organization_id", "budgets", ["organization_id"])
    op.create_index("ix_budgets_fiscal_year", "budgets", ["fiscal_year"])
    op.create_index("ix_budgets_budget_type", "budgets", ["budget_type"])

    op.create_table(
        "financial_transactions",
        sa.Column("transaction_id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("transaction_reference", sa.String(150), unique=True, nullable=False),
        sa.Column("geo_unit_id", sa.String(100), sa.ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("project_id", sa.BigInteger, sa.ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("bill_id", sa.BigInteger, sa.ForeignKey("bills.bill_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("organization_id", sa.BigInteger, sa.ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE")),
        sa.Column("fiscal_year", sa.String(20)),
        sa.Column("transaction_type", sa.String(100), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("transaction_date", sa.DateTime, nullable=False),
        sa.Column("status", sa.String(50)),
        sa.Column("source_system", sa.String(255)),
        sa.Column("external_reference", sa.String(500)),
        sa.Column("description", sa.Text),
        sa.Column("created_at", sa.DateTime),
    )
    op.create_index("ix_financial_transactions_geo_unit_id", "financial_transactions", ["geo_unit_id"])
    op.create_index("ix_financial_transactions_project_id", "financial_transactions", ["project_id"])
    op.create_index("ix_financial_transactions_bill_id", "financial_transactions", ["bill_id"])
    op.create_index("ix_financial_transactions_organization_id", "financial_transactions", ["organization_id"])
    op.create_index("ix_financial_transactions_fiscal_year", "financial_transactions", ["fiscal_year"])
    op.create_index("ix_financial_transactions_transaction_type", "financial_transactions", ["transaction_type"])
    op.create_index("ix_financial_transactions_transaction_date", "financial_transactions", ["transaction_date"])
    op.create_index("ix_financial_transactions_status", "financial_transactions", ["status"])


def downgrade() -> None:
    op.drop_table("financial_transactions")
    op.drop_table("budgets")
    op.drop_table("bill_items")
    op.drop_table("bills")
    op.drop_table("work_orders")
    op.drop_table("contractors")
    op.drop_table("project_geo_units")
    op.drop_table("projects")
    op.drop_table("complaint_media")
    op.drop_table("media_assets")
    op.drop_table("complaints")
    op.drop_table("users")
    op.drop_table("officer_assignments")
    op.drop_table("political_assignments")
    op.drop_table("organizations")
    op.drop_table("political_parties")
    op.drop_table("persons")
    op.drop_table("geo_unit_boundaries")
    op.drop_table("boundary_sources")
    op.drop_table("geo_unit_relationships")
    op.drop_table("geo_units")
    op.drop_table("geo_unit_types")
    op.execute("DROP EXTENSION IF EXISTS postgis")
