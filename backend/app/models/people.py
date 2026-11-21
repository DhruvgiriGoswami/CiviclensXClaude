"""People, political parties, organizations, and assignment models."""

from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Index, Integer,
    String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Person(Base):
    """An individual person (political representative, officer, etc.)."""
    __tablename__ = "persons"

    person_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    photo_url: Mapped[Optional[str]] = mapped_column(String(1000))
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    political_assignments: Mapped[List["PoliticalAssignment"]] = relationship(back_populates="person")
    officer_assignments: Mapped[List["OfficerAssignment"]] = relationship(back_populates="person")

    __table_args__ = (
        Index("ix_persons_full_name", "full_name"),
        Index("ix_persons_phone", "phone"),
        Index("ix_persons_email", "email"),
        Index("ix_persons_is_active", "is_active"),
    )


class PoliticalParty(Base):
    """A political party."""
    __tablename__ = "political_parties"

    party_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    abbreviation: Mapped[Optional[str]] = mapped_column(String(50))
    official_code: Mapped[Optional[str]] = mapped_column(String(100))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    logo_url: Mapped[Optional[str]] = mapped_column(String(1000))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    political_assignments: Mapped[List["PoliticalAssignment"]] = relationship(back_populates="party")


class Organization(Base):
    """A government body (municipal corporation, department, etc.)."""
    __tablename__ = "organizations"

    organization_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    organization_type: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE"),
    )
    contact_phone: Mapped[Optional[str]] = mapped_column(String(30))
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent: Mapped[Optional["Organization"]] = relationship(
        "Organization", remote_side="Organization.organization_id", back_populates="children",
    )
    children: Mapped[List["Organization"]] = relationship("Organization", back_populates="parent")
    officer_assignments: Mapped[List["OfficerAssignment"]] = relationship(back_populates="organization")

    __table_args__ = (
        Index("ix_organizations_organization_type", "organization_type"),
        Index("ix_organizations_parent_organization_id", "parent_organization_id"),
        Index("ix_organizations_is_active", "is_active"),
    )


class PoliticalAssignment(Base):
    """Time-aware assignment of a person to a political role in a geo unit."""
    __tablename__ = "political_assignments"

    political_assignment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(
        ForeignKey("persons.person_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    party_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("political_parties.party_id", deferrable=True, initially="IMMEDIATE"),
    )
    geo_unit_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    role_title: Mapped[str] = mapped_column(String(255), nullable=False)
    authority_type: Mapped[Optional[str]] = mapped_column(String(100))
    valid_from: Mapped[Optional[date]] = mapped_column(Date)
    valid_to: Mapped[Optional[date]] = mapped_column(Date)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    person: Mapped["Person"] = relationship(back_populates="political_assignments")
    party: Mapped[Optional["PoliticalParty"]] = relationship(back_populates="political_assignments")

    __table_args__ = (
        Index("ix_political_assignments_person_id", "person_id"),
        Index("ix_political_assignments_party_id", "party_id"),
        Index("ix_political_assignments_geo_unit_id", "geo_unit_id"),
        Index("ix_political_assignments_authority_type", "authority_type"),
        Index("ix_political_assignments_is_current", "is_current"),
    )


class OfficerAssignment(Base):
    """Time-aware assignment of an officer to an administrative role in a geo unit."""
    __tablename__ = "officer_assignments"

    officer_assignment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    person_id: Mapped[int] = mapped_column(
        ForeignKey("persons.person_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    geo_unit_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    designation: Mapped[str] = mapped_column(String(255), nullable=False)
    authority_type: Mapped[Optional[str]] = mapped_column(String(100))
    valid_from: Mapped[Optional[date]] = mapped_column(Date)
    valid_to: Mapped[Optional[date]] = mapped_column(Date)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    person: Mapped["Person"] = relationship(back_populates="officer_assignments")
    organization: Mapped["Organization"] = relationship(back_populates="officer_assignments")

    __table_args__ = (
        Index("ix_officer_assignments_person_id", "person_id"),
        Index("ix_officer_assignments_organization_id", "organization_id"),
        Index("ix_officer_assignments_geo_unit_id", "geo_unit_id"),
        Index("ix_officer_assignments_authority_type", "authority_type"),
        Index("ix_officer_assignments_is_current", "is_current"),
    )


class LeaderFeedback(Base):
    """Citizen rating and feedback for a political leader or administrative officer."""
    __tablename__ = "leader_feedbacks"

    feedback_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    leader_name: Mapped[str] = mapped_column(String(255), nullable=False)
    leader_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    leader_type: Mapped[str] = mapped_column(String(50), default="POLITICAL")
    geo_unit_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    citizen_name: Mapped[str] = mapped_column(String(255), default="Anonymous")
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    responsiveness_score: Mapped[int] = mapped_column(Integer, default=5)
    transparency_score: Mapped[int] = mapped_column(Integer, default=5)
    feedback_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_leader_feedbacks_leader_name", "leader_name"),
        Index("ix_leader_feedbacks_created_at", "created_at"),
    )

