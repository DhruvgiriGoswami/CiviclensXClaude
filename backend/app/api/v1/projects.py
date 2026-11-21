"""Project API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.finance import ProjectSummary, ProjectDetail, BillResponse, BillItemResponse
from app.services import finance as finance_service

router = APIRouter(tags=["Projects"])


@router.get("/projects", response_model=list[ProjectSummary])
async def list_projects(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List projects with optional filters."""
    projects, total = await finance_service.list_projects(
        db, category=category, status=status, limit=limit, offset=offset,
    )
    return projects


@router.get("/projects/{project_id}", response_model=ProjectDetail)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single project by ID."""
    project = await finance_service.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/projects/{project_id}/bills", response_model=list[BillResponse])
async def get_project_bills(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get all bills for a project."""
    bills = await finance_service.get_bills_for_project(db, project_id)
    return [_build_bill_response(b) for b in bills]


def _build_bill_response(bill) -> BillResponse:
    items = [BillItemResponse.model_validate(item) for item in bill.items] if bill.items else []
    return BillResponse(
        bill_id=bill.bill_id,
        bill_number=bill.bill_number,
        work_order_id=bill.work_order_id,
        project_id=bill.project_id,
        bill_type=bill.bill_type,
        bill_date=bill.bill_date,
        period_from=bill.period_from,
        period_to=bill.period_to,
        gross_amount=float(bill.gross_amount),
        tax_amount=float(bill.tax_amount) if bill.tax_amount else None,
        deduction_amount=float(bill.deduction_amount) if bill.deduction_amount else None,
        net_amount=float(bill.net_amount),
        status=bill.status,
        document_url=bill.document_url,
        items=items,
    )
