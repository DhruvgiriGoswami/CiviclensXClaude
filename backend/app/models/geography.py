"""Geographic hierarchy and boundary models."""

from datetime import date, datetime
from typing import Optional, List

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Index, Integer,
    Numeric, String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GeoUnitType(Base):
    """Lookup table for geographic unit types (COUNTRY, STATE, WARD, etc.)."""
    __tablename__ = "geo_unit_types"

    unit_type_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    geo_units: Mapped[List["GeoUnit"]] = relationship(back_populates="unit_type")


class GeoUnit(Base):
    """A geographic/administrative unit (country, state, district, ward, etc.)."""
    __tablename__ = "geo_units"

    unit_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    unit_type_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("geo_unit_types.unit_type_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    official_code: Mapped[Optional[str]] = mapped_column(String(100))
    state_code: Mapped[Optional[str]] = mapped_column(String(20))
    district_code: Mapped[Optional[str]] = mapped_column(String(20))
    parent_unit_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
    )
    level: Mapped[Optional[int]] = mapped_column(Integer)
    description: Mapped[Optional[str]] = mapped_column(Text)
    valid_from: Mapped[Optional[date]] = mapped_column(Date)
    valid_to: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    unit_type: Mapped["GeoUnitType"] = relationship(back_populates="geo_units")
    parent: Mapped[Optional["GeoUnit"]] = relationship(
        "GeoUnit", remote_side="GeoUnit.unit_id", back_populates="children",
    )
    children: Mapped[List["GeoUnit"]] = relationship("GeoUnit", back_populates="parent")
    boundaries: Mapped[List["GeoUnitBoundary"]] = relationship(back_populates="geo_unit")
    relationships_from: Mapped[List["GeoUnitRelationship"]] = relationship(
        "GeoUnitRelationship", foreign_keys="GeoUnitRelationship.from_unit_id", back_populates="from_unit",
    )
    relationships_to: Mapped[List["GeoUnitRelationship"]] = relationship(
        "GeoUnitRelationship", foreign_keys="GeoUnitRelationship.to_unit_id", back_populates="to_unit",
    )

    __table_args__ = (
        Index("ix_geo_units_unit_type_id", "unit_type_id"),
        Index("ix_geo_units_parent_unit_id", "parent_unit_id"),
        Index("ix_geo_units_official_code", "official_code"),
        Index("ix_geo_units_state_code", "state_code"),
        Index("ix_geo_units_district_code", "district_code"),
        Index("ix_geo_units_is_active", "is_active"),
    )


class GeoUnitRelationship(Base):
    """Cross-cutting relationships between geo units (e.g., ward → constituency)."""
    __tablename__ = "geo_unit_relationships"

    relationship_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    from_unit_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    to_unit_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)
    valid_from: Mapped[Optional[date]] = mapped_column(Date)
    valid_to: Mapped[Optional[date]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    from_unit: Mapped["GeoUnit"] = relationship(
        "GeoUnit", foreign_keys=[from_unit_id], back_populates="relationships_from",
    )
    to_unit: Mapped["GeoUnit"] = relationship(
        "GeoUnit", foreign_keys=[to_unit_id], back_populates="relationships_to",
    )

    __table_args__ = (
        Index("ix_geo_unit_relationships_from_unit_id", "from_unit_id"),
        Index("ix_geo_unit_relationships_to_unit_id", "to_unit_id"),
        Index("ix_geo_unit_relationships_relationship_type", "relationship_type"),
    )


class BoundarySource(Base):
    """Provenance metadata for imported boundary data (KML files, etc.)."""
    __tablename__ = "boundary_sources"

    boundary_source_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    source_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[Optional[str]] = mapped_column(String(500))
    file_type: Mapped[Optional[str]] = mapped_column(String(50))
    storage_url: Mapped[Optional[str]] = mapped_column(String(1000))
    source_authority: Mapped[Optional[str]] = mapped_column(String(500))
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))
    checksum_sha256: Mapped[Optional[str]] = mapped_column(String(128))
    coordinate_system: Mapped[Optional[str]] = mapped_column(String(100))
    version: Mapped[Optional[str]] = mapped_column(String(50))
    imported_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    boundaries: Mapped[List["GeoUnitBoundary"]] = relationship(back_populates="boundary_source")

    __table_args__ = (
        Index("ix_boundary_sources_source_authority", "source_authority"),
        Index("ix_boundary_sources_checksum_sha256", "checksum_sha256"),
        Index("ix_boundary_sources_is_current", "is_current"),
    )


class GeoUnitBoundary(Base):
    """PostGIS boundary geometry for a geographic unit."""
    __tablename__ = "geo_unit_boundaries"

    boundary_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    unit_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    boundary_source_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("boundary_sources.boundary_source_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    # PostGIS geometry column — the actual spatial data
    geometry = mapped_column(
        Geometry("MULTIPOLYGON", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
        nullable=False,
    )
    geometry_format: Mapped[Optional[str]] = mapped_column(String(50))
    area_sq_km: Mapped[Optional[float]] = mapped_column(Numeric(20, 6))
    geometry_hash: Mapped[Optional[str]] = mapped_column(String(128))
    valid_from: Mapped[Optional[datetime]] = mapped_column(DateTime)
    valid_to: Mapped[Optional[datetime]] = mapped_column(DateTime)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    geo_unit: Mapped["GeoUnit"] = relationship(back_populates="boundaries")
    boundary_source: Mapped["BoundarySource"] = relationship(back_populates="boundaries")

    __table_args__ = (
        Index("ix_geo_unit_boundaries_unit_id", "unit_id"),
        Index("ix_geo_unit_boundaries_boundary_source_id", "boundary_source_id"),
        Index("ix_geo_unit_boundaries_geometry_hash", "geometry_hash"),
        Index("ix_geo_unit_boundaries_is_current", "is_current"),
        Index("ix_geo_unit_boundaries_geometry", "geometry", postgresql_using="gist"),
    )
