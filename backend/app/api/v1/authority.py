"""Authority API endpoints — political representatives and officers for a geo unit."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.authority import (
    PoliticalRepresentativeResponse, OfficerResponse,
    PersonSummary, PartySummary, OrganizationSummary,
    LeaderFeedbackCreate, LeaderFeedbackResponse, LeaderScoreSummary,
)
from app.services import authority as auth_service
from app.api.v1.complaints import _rate_limiter

check_rating_rate_limit = _rate_limiter(5, "ratings")

router = APIRouter(tags=["Authority"])



@router.get(
    "/geo-units/{unit_id}/political-representatives",
    response_model=list[PoliticalRepresentativeResponse],
)
async def get_political_representatives(
    unit_id: str,
    current_only: bool = Query(True, description="Only show current assignments"),
    db: AsyncSession = Depends(get_db),
):
    """Get political representatives for a geographic unit."""
    assignments = await auth_service.get_political_representatives(db, unit_id, current_only)
    return [
        PoliticalRepresentativeResponse(
            political_assignment_id=a.political_assignment_id,
            person=PersonSummary.model_validate(a.person),
            party=PartySummary.model_validate(a.party) if a.party else None,
            role_title=a.role_title,
            authority_type=a.authority_type,
            valid_from=a.valid_from,
            valid_to=a.valid_to,
            is_current=a.is_current,
            source_url=a.source_url,
        )
        for a in assignments
    ]


@router.get(
    "/geo-units/{unit_id}/officers",
    response_model=list[OfficerResponse],
)
async def get_officers(
    unit_id: str,
    current_only: bool = Query(True, description="Only show current assignments"),
    db: AsyncSession = Depends(get_db),
):
    """Get administrative officers for a geographic unit."""
    assignments = await auth_service.get_officers(db, unit_id, current_only)
    return [
        OfficerResponse(
            officer_assignment_id=a.officer_assignment_id,
            person=PersonSummary.model_validate(a.person),
            organization=OrganizationSummary.model_validate(a.organization),
            designation=a.designation,
            authority_type=a.authority_type,
            valid_from=a.valid_from,
            valid_to=a.valid_to,
            is_current=a.is_current,
            source_url=a.source_url,
        )
        for a in assignments
    ]


@router.post("/representatives/rate")
async def rate_representative(
    payload: LeaderFeedbackCreate,
    db: AsyncSession = Depends(get_db),
    _rate_limit=Depends(check_rating_rate_limit),
):
    """
    Submit citizen rating and written review for a politician or administrative officer.
    Stores feedback dynamically into PostgreSQL `leader_feedbacks`.
    """
    feedback = await auth_service.record_leader_feedback(
        db=db,
        leader_name=payload.leader_name or "Representative",
        rating=payload.rating,
        leader_id=payload.leader_id,
        leader_type=payload.leader_type or "POLITICAL",
        geo_unit_id=payload.geo_unit_id,
        citizen_name=payload.citizen_name or "Anonymous",
        responsiveness_score=payload.responsiveness_score or 5,
        transparency_score=payload.transparency_score or 5,
        feedback_text=payload.feedback_text,
    )
    # Compute updated live summary for this leader
    summary = await auth_service.get_leader_feedbacks(
        db=db,
        leader_name=feedback.leader_name,
        leader_id=feedback.leader_id,
    )
    return {
        "status": "success",
        "message": "Citizen rating successfully recorded and persisted to database.",
        "feedback_id": feedback.feedback_id,
        "leader_name": feedback.leader_name,
        "citizen_name": feedback.citizen_name,
        "rating": feedback.rating,
        "average_rating": summary["average_rating"],
        "total_reviews": summary["total_reviews"],
    }


@router.get("/representatives/feedbacks", response_model=LeaderScoreSummary)
async def get_representative_feedbacks(
    leader_name: Optional[str] = Query(None, description="Exact or partial name of leader"),
    leader_id: Optional[int] = Query(None, description="Person ID of leader"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all verified citizen feedbacks and star reviews for a politician or bureaucrat.
    Returns individual reviews list with timestamps along with live aggregated ratings.
    """
    summary = await auth_service.get_leader_feedbacks(
        db=db,
        leader_name=leader_name,
        leader_id=leader_id,
    )
    def to_feedback_response(f):
        calc_rating = round((f.responsiveness_score + f.transparency_score) / 2.0, 1) if (f.responsiveness_score is not None and f.transparency_score is not None) else float(f.rating)
        return LeaderFeedbackResponse(
            feedback_id=f.feedback_id,
            leader_name=f.leader_name,
            leader_id=f.leader_id,
            leader_type=f.leader_type,
            geo_unit_id=f.geo_unit_id,
            citizen_name=f.citizen_name,
            rating=calc_rating,
            responsiveness_score=f.responsiveness_score,
            transparency_score=f.transparency_score,
            feedback_text=f.feedback_text,
            created_at=f.created_at,
        )

    return LeaderScoreSummary(
        leader_name=summary["leader_name"],
        average_rating=summary["average_rating"],
        total_reviews=summary["total_reviews"],
        avg_responsiveness=summary["avg_responsiveness"],
        avg_transparency=summary["avg_transparency"],
        feedbacks=[to_feedback_response(f) for f in summary["feedbacks"]],
    )


@router.get("/representatives/ratings-summary")
async def get_all_representatives_ratings_summary(
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated live rating scores and review counts for all leaders across the nation.
    Used by frontend components to display genuine, live numbers instead of static values.
    """
    ratings = await auth_service.get_all_ratings_summary(db=db)
    return {"ratings": ratings}

