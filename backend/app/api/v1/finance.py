"""Finance API endpoints — budgets, projects, and transactions per geo unit."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.finance import BudgetResponse, ProjectSummary, TransactionResponse
from app.services import finance as finance_service

router = APIRouter(tags=["Finance"])


@router.get("/geo-units/{unit_id}/budgets", response_model=list[BudgetResponse])
async def get_budgets(
    unit_id: str,
    fiscal_year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get budgets for a geographic unit."""
    budgets = await finance_service.get_budgets_for_unit(db, unit_id, fiscal_year)
    return budgets


@router.get("/geo-units/{unit_id}/projects", response_model=list[ProjectSummary])
async def get_projects_for_unit(
    unit_id: str,
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get projects affecting a geographic unit."""
    projects = await finance_service.get_projects_for_unit(db, unit_id, status)
    return projects


@router.get("/geo-units/{unit_id}/transactions", response_model=list[TransactionResponse])
async def get_transactions(
    unit_id: str,
    fiscal_year: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Get financial transactions for a geographic unit."""
    transactions, total = await finance_service.get_transactions_for_unit(
        db, unit_id, fiscal_year, limit=limit, offset=offset,
    )
    return transactions
