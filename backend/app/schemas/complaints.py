"""Pydantic schemas for complaints and media."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    description: Optional[str] = Field(None, max_length=2000)
    category: str = Field(..., min_length=2, max_length=100)
    latitude: float = Field(..., ge=6.0, le=38.0, description="Valid latitude coordinate within India")
    longitude: float = Field(..., ge=68.0, le=98.0, description="Valid longitude coordinate within India")
    location_accuracy_m: Optional[float] = Field(None, ge=0, le=10000)
    address_text: Optional[str] = Field(None, max_length=500)
    priority: Optional[str] = Field(None, max_length=20)


class MediaResponse(BaseModel):
    media_id: int
    storage_url: str
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    captured_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class ComplaintResponse(BaseModel):
    complaint_id: int
    user_id: Optional[int] = None
    category: str
    title: str
    description: Optional[str] = None
    status: str
    priority: Optional[str] = None
    latitude: float
    longitude: float
    location_accuracy_m: Optional[float] = None
    address_text: Optional[str] = None
    resolved_geo_unit_id: Optional[str] = None
    upvotes: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    media: List[MediaResponse] = []
    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    page_size: int
