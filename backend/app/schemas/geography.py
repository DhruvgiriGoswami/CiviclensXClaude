"""Pydantic schemas for geographic units, boundaries, and spatial resolution."""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Geo Unit Types ──

class GeoUnitTypeResponse(BaseModel):
    unit_type_id: str
    name: str
    description: Optional[str] = None
    model_config = {"from_attributes": True}


# ── Geo Units ──

class GeoUnitSummary(BaseModel):
    unit_id: str
    unit_type_id: str
    name: str
    official_code: Optional[str] = None
    state_code: Optional[str] = None
    district_code: Optional[str] = None
    parent_unit_id: Optional[str] = None
    level: Optional[int] = None
    is_active: bool = True
    model_config = {"from_attributes": True}


class GeoUnitDetail(GeoUnitSummary):
    description: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class GeoUnitCreate(BaseModel):
    unit_id: str
    unit_type_id: str
    name: str
    official_code: Optional[str] = None
    state_code: Optional[str] = None
    district_code: Optional[str] = None
    parent_unit_id: Optional[str] = None
    level: Optional[int] = None
    description: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None


# ── Spatial Resolution ──

class ResolveRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class ResolvedUnit(BaseModel):
    unit_id: str
    type: str
    name: str
    model_config = {"from_attributes": True}


class ResolveResponse(BaseModel):
    location: Dict[str, float]
    units: List[ResolvedUnit]


# ── GeoJSON ──

class GeoJsonFeature(BaseModel):
    type: str = "Feature"
    properties: Dict[str, Any]
    geometry: Dict[str, Any]


class GeoJsonFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJsonFeature]


# ── Boundary ──

class BoundaryResponse(BaseModel):
    boundary_id: int
    unit_id: str
    boundary_source_id: str
    geometry_format: Optional[str] = None
    area_sq_km: Optional[float] = None
    is_current: bool = True
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ── Pagination ──

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int
