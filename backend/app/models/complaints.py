"""Users, complaints, media assets, and complaint-media junction models."""

from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Index, Integer, Numeric,
    String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """A citizen / app user who can submit complaints."""
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(30))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    complaints: Mapped[List["Complaint"]] = relationship(back_populates="user")

    __table_args__ = (
        Index("ix_users_phone", "phone"),
        Index("ix_users_email", "email"),
    )


class Complaint(Base):
    """A citizen complaint / grievance tied to a GPS location."""
    __tablename__ = "complaints"

    complaint_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.user_id", deferrable=True, initially="IMMEDIATE"),
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="OPEN")
    priority: Mapped[Optional[str]] = mapped_column(String(50))
    latitude: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    location_accuracy_m: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    address_text: Mapped[Optional[str]] = mapped_column(String(1000))
    resolved_geo_unit_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
    )
    upvotes: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="complaints")
    media_links: Mapped[List["ComplaintMedia"]] = relationship(back_populates="complaint")

    __table_args__ = (
        Index("ix_complaints_user_id", "user_id"),
        Index("ix_complaints_category", "category"),
        Index("ix_complaints_status", "status"),
        Index("ix_complaints_priority", "priority"),
        Index("ix_complaints_resolved_geo_unit_id", "resolved_geo_unit_id"),
        Index("ix_complaints_created_at", "created_at"),
    )


class MediaAsset(Base):
    """A media file (image, video) stored on disk — metadata only in DB."""
    __tablename__ = "media_assets"

    media_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    storage_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_name: Mapped[Optional[str]] = mapped_column(String(500))
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))
    file_size_bytes: Mapped[Optional[int]] = mapped_column()
    checksum_sha256: Mapped[Optional[str]] = mapped_column(String(128))
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7))
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    uploaded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    complaint_links: Mapped[List["ComplaintMedia"]] = relationship(back_populates="media")

    __table_args__ = (
        Index("ix_media_assets_checksum_sha256", "checksum_sha256"),
        Index("ix_media_assets_captured_at", "captured_at"),
    )


class ComplaintMedia(Base):
    """Junction table linking complaints to media assets."""
    __tablename__ = "complaint_media"

    complaint_media_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    complaint_id: Mapped[int] = mapped_column(
        ForeignKey("complaints.complaint_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    media_id: Mapped[int] = mapped_column(
        ForeignKey("media_assets.media_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    complaint: Mapped["Complaint"] = relationship(back_populates="media_links")
    media: Mapped["MediaAsset"] = relationship(back_populates="complaint_links")

    __table_args__ = (
        Index("ix_complaint_media_complaint_id", "complaint_id"),
        Index("ix_complaint_media_media_id", "media_id"),
    )
