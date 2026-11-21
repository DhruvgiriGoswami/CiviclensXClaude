"""Project, contractor, and work order models."""

from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Index, Numeric,
    String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    """A capital expenditure project — can span multiple geo units."""
    __tablename__ = "projects"

    project_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    owning_geo_unit_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
    )
    implementing_organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE"),
    )
    sanctioned_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    funding_source: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    expected_end_date: Mapped[Optional[date]] = mapped_column(Date)
    actual_end_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    geo_unit_links: Mapped[List["ProjectGeoUnit"]] = relationship(back_populates="project")
    work_orders: Mapped[List["WorkOrder"]] = relationship(back_populates="project")

    __table_args__ = (
        Index("ix_projects_owning_geo_unit_id", "owning_geo_unit_id"),
        Index("ix_projects_implementing_organization_id", "implementing_organization_id"),
        Index("ix_projects_category", "category"),
        Index("ix_projects_status", "status"),
    )


class ProjectGeoUnit(Base):
    """Junction: a project can affect multiple geo units."""
    __tablename__ = "project_geo_units"

    project_geo_unit_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    geo_unit_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    relationship_type: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="geo_unit_links")

    __table_args__ = (
        Index("ix_project_geo_units_project_id", "project_id"),
        Index("ix_project_geo_units_geo_unit_id", "geo_unit_id"),
    )


class Contractor(Base):
    """A construction / service contractor."""
    __tablename__ = "contractors"

    contractor_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    legal_name: Mapped[str] = mapped_column(String(500), nullable=False)
    registration_number: Mapped[Optional[str]] = mapped_column(String(255))
    gstin: Mapped[Optional[str]] = mapped_column(String(50))
    pan: Mapped[Optional[str]] = mapped_column(String(20))
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    address: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    work_orders: Mapped[List["WorkOrder"]] = relationship(back_populates="contractor")

    __table_args__ = (
        Index("ix_contractors_registration_number", "registration_number"),
        Index("ix_contractors_gstin", "gstin"),
        Index("ix_contractors_pan", "pan"),
    )


class WorkOrder(Base):
    """A work order issued under a project to a contractor."""
    __tablename__ = "work_orders"

    work_order_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    contractor_id: Mapped[int] = mapped_column(
        ForeignKey("contractors.contractor_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    issuing_organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE"),
    )
    work_description: Mapped[Optional[str]] = mapped_column(Text)
    contract_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    issue_date: Mapped[Optional[date]] = mapped_column(Date)
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="work_orders")
    contractor: Mapped["Contractor"] = relationship(back_populates="work_orders")

    __table_args__ = (
        Index("ix_work_orders_project_id", "project_id"),
        Index("ix_work_orders_contractor_id", "contractor_id"),
        Index("ix_work_orders_issuing_organization_id", "issuing_organization_id"),
        Index("ix_work_orders_status", "status"),
    )
