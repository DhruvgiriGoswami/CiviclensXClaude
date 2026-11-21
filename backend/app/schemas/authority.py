"""Pydantic schemas for political representatives and administrative officers."""

from datetime import date, datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, model_validator


class PersonSummary(BaseModel):

    person_id: int
    full_name: str
    designation: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    model_config = {"from_attributes": True}


class PartySummary(BaseModel):
    party_id: int
    name: str
    abbreviation: Optional[str] = None
    logo_url: Optional[str] = None
    model_config = {"from_attributes": True}


class OrganizationSummary(BaseModel):
    organization_id: int
    name: str
    organization_type: str
    model_config = {"from_attributes": True}


class PoliticalRepresentativeResponse(BaseModel):
    political_assignment_id: int
    person: PersonSummary
    party: Optional[PartySummary] = None
    role_title: str
    authority_type: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    is_current: bool
    source_url: Optional[str] = None
    model_config = {"from_attributes": True}


class OfficerResponse(BaseModel):
    officer_assignment_id: int
    person: PersonSummary
    organization: OrganizationSummary
    designation: str
    authority_type: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    is_current: bool
    source_url: Optional[str] = None
    model_config = {"from_attributes": True}


class AuthorityResponse(BaseModel):
    geo_unit_id: str
    geo_unit_name: str
    political_representatives: List[PoliticalRepresentativeResponse]
    officers: List[OfficerResponse]


class LeaderFeedbackCreate(BaseModel):
    # Lengths match the leader_feedbacks columns, so oversize input is a 422 instead of a DB 500.
    leader_name: Optional[str] = Field(None, max_length=255)
    leader_id: Optional[int] = None
    leader_type: Optional[str] = Field("POLITICAL", max_length=50)
    geo_unit_id: Optional[str] = Field(None, max_length=100)
    citizen_name: Optional[str] = Field("Anonymous", max_length=255)
    rating: int = Field(..., ge=1, le=5)
    responsiveness_score: Optional[int] = Field(5, ge=1, le=5)
    transparency_score: Optional[int] = Field(5, ge=1, le=5)
    feedback_text: Optional[str] = Field(None, max_length=2000)

    # Backwards compatibility fields
    target_id: Optional[int] = None
    target_type: Optional[str] = None

    @model_validator(mode="before")
    def populate_defaults(cls, values: Any):
        if isinstance(values, dict):
            if not values.get("leader_id") and values.get("target_id"):
                try:
                    values["leader_id"] = int(values["target_id"])
                except (ValueError, TypeError):
                    pass
            if not values.get("leader_type") and values.get("target_type"):
                values["leader_type"] = str(values["target_type"]).upper()

            raw_citizen = values.get("citizen_name")
            if not raw_citizen or not str(raw_citizen).strip():
                values["citizen_name"] = "Anonymous"
            else:
                values["citizen_name"] = str(raw_citizen).strip()

            if not values.get("leader_name") or not str(values.get("leader_name")).strip():
                if values.get("leader_id"):
                    values["leader_name"] = f"Leader #{values['leader_id']}"
                else:
                    values["leader_name"] = "Elected Representative"
        return values


class LeaderFeedbackResponse(BaseModel):
    feedback_id: int
    leader_name: str
    leader_id: Optional[int] = None
    leader_type: str
    geo_unit_id: Optional[str] = None
    citizen_name: str
    rating: float
    responsiveness_score: int
    transparency_score: int
    feedback_text: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LeaderScoreSummary(BaseModel):
    leader_name: str
    average_rating: float
    total_reviews: int
    avg_responsiveness: float
    avg_transparency: float
    feedbacks: List[LeaderFeedbackResponse] = []


class LeaderRatingsMap(BaseModel):
    ratings: Dict[str, Dict[str, Any]]

