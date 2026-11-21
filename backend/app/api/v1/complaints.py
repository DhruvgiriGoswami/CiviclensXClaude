"""Complaint API endpoints — submit, list, get, update, upload media."""

import os
import secrets
import sys
import time
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.complaints import (
    ComplaintCreate, ComplaintResponse, ComplaintListResponse, MediaResponse,
)
from app.services import complaints as complaint_service
from app.services import media as media_service

router = APIRouter(tags=["Complaints"])

def _get_client_ip(request: Request) -> str:
    # The ALB appends the real client IP as the LAST X-Forwarded-For entry; earlier entries are client-supplied.
    # shortcut: assumes exactly one proxy (the ALB) in front; revisit if CloudFront is put in front of the API.
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _rate_limiter(max_per_minute: int, what: str):
    """Build a per-IP sliding-window limiter dependency (in-memory, per process)."""
    hits: dict[str, list[float]] = {}

    def check(request: Request):
        if "pytest" in sys.modules or os.getenv("TESTING") == "1" or not request.client or request.client.host in ("testclient", "test"):
            return
        ip = _get_client_ip(request)
        now = time.time()
        recent = [t for t in hits.get(ip, []) if t > now - 60.0]
        if len(recent) >= max_per_minute:
            hits[ip] = recent
            retry_after = int(60.0 - (now - recent[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Maximum {max_per_minute} {what} per minute allowed. Try again in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )
        recent.append(now)
        hits[ip] = recent
        if len(hits) > 10_000:  # drop idle IPs so the dict can't grow forever
            for key in [k for k, v in hits.items() if v[-1] <= now - 60.0]:
                del hits[key]

    return check


check_complaint_submit_rate_limit = _rate_limiter(5, "complaints")
check_media_upload_rate_limit = _rate_limiter(3, "picture uploads")
check_upvote_rate_limit = _rate_limiter(20, "upvotes")


def verify_admin_key(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    """Require the X-Admin-Key header for deletion and purge. Query-string keys are not accepted (they end up in logs)."""
    if not settings.ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="Admin actions are disabled: ADMIN_API_KEY is not configured on the server.")
    if not x_admin_key or not secrets.compare_digest(x_admin_key.encode(), settings.ADMIN_API_KEY.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Admin API key required for complaint deletion or purge.",
        )
    return True


@router.post("/complaints", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    payload: ComplaintCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _rate_limit=Depends(check_complaint_submit_rate_limit),
):
    """
    Submit a new complaint. GPS coordinates are automatically resolved
    to the smallest containing geographic unit (ward, village, etc.).
    """
    complaint = await complaint_service.create_complaint(
        db,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        latitude=payload.latitude,
        longitude=payload.longitude,
        priority=payload.priority,
        location_accuracy_m=payload.location_accuracy_m,
        address_text=payload.address_text,
    )
    return _build_complaint_response(complaint)


@router.get("/complaints", response_model=ComplaintListResponse)
async def list_complaints(
    geo_unit_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List complaints with optional filters, search, sorting, and pagination."""
    offset = (page - 1) * page_size
    complaints, total = await complaint_service.list_complaints(
        db, geo_unit_id=geo_unit_id, category=category,
        status=status, search=search, sort_by=sort_by,
        limit=page_size, offset=offset,
    )
    return ComplaintListResponse(
        items=[_build_complaint_response(c) for c in complaints],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/complaints/stats")
async def get_complaint_stats(
    geo_unit_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate statistics for complaints."""
    return await complaint_service.get_complaint_stats(db, geo_unit_id=geo_unit_id)


@router.get("/complaints/categories")
async def get_complaint_categories(
    db: AsyncSession = Depends(get_db),
):
    """Get distinct categories present in complaints."""
    return await complaint_service.get_categories(db)


@router.post("/complaints/purge-test-data", status_code=200)
async def purge_test_complaints(
    all: bool = Query(False, description="Set to true to purge all complaints permanently"),
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin_key),
):
    """
    Purge legacy static demo seed tickets and test complaints (or all complaints) from the database
    and remove their associated objects from AWS S3.
    Protected: Requires X-Admin-Key header.
    """
    count = await complaint_service.purge_test_complaints(db, purge_all=all)
    return {"message": "Purge completed successfully", "deleted_count": count, "purged_all": all}


@router.delete("/complaints/{complaint_id}", status_code=200)
async def delete_complaint(
    complaint_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: bool = Depends(verify_admin_key),
):
    """
    Permanently delete a complaint and remove its media from AWS S3.
    Protected: Requires X-Admin-Key header.
    """
    deleted = await complaint_service.delete_complaint(db, complaint_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"message": "Complaint deleted successfully", "complaint_id": complaint_id}


@router.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single complaint by ID."""
    complaint = await complaint_service.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return _build_complaint_response(complaint)


@router.post("/complaints/{complaint_id}/upvote", response_model=ComplaintResponse)
async def upvote_complaint(
    complaint_id: int,
    db: AsyncSession = Depends(get_db),
    _rate_limit=Depends(check_upvote_rate_limit),
):
    """
    Upvote a complaint by incrementing its upvote counter in the database.
    Returns the updated complaint response.
    """
    complaint = await complaint_service.upvote_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint #{complaint_id} not found")
    return _build_complaint_response(complaint)


@router.post("/complaints/{complaint_id}/media", response_model=MediaResponse, status_code=201)
async def upload_media(
    complaint_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _rate_limit=Depends(check_media_upload_rate_limit),
):
    """Upload a photo/video to attach to a complaint. Rate limited to max 3 uploads per minute per device."""
    # Verify complaint exists
    complaint = await complaint_service.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Read and store with magic byte verification
    try:
        # Read at most one byte past the cap so a huge upload is never loaded into memory.
        data = await file.read(media_service.MAX_FILE_SIZE + 1)
        media = await media_service.store_media(
            db,
            file_data=data,
            file_name=file.filename or "upload.bin",
            mime_type=file.content_type or "image/jpeg",
            complaint_id=complaint_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except media_service.MediaStorageError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Link to complaint
    await complaint_service.attach_media(db, complaint_id, media.media_id)

    return media


def _build_complaint_response(complaint) -> ComplaintResponse:
    """Build a ComplaintResponse from an ORM complaint object."""
    media_list = []
    if "media_links" in complaint.__dict__ and complaint.media_links:
        for link in complaint.media_links:
            if "media" in link.__dict__ and link.media:
                media_list.append(MediaResponse.model_validate(link.media))

    return ComplaintResponse(
        complaint_id=complaint.complaint_id,
        user_id=complaint.user_id,
        category=complaint.category,
        title=complaint.title,
        description=complaint.description,
        status=complaint.status,
        priority=complaint.priority,
        latitude=float(complaint.latitude),  # NOT NULL column
        longitude=float(complaint.longitude),
        location_accuracy_m=float(complaint.location_accuracy_m) if complaint.location_accuracy_m else None,
        address_text=complaint.address_text,
        resolved_geo_unit_id=complaint.resolved_geo_unit_id,
        upvotes=int(getattr(complaint, "upvotes", 0) or 0),
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        resolved_at=complaint.resolved_at,
        media=media_list,
    )
