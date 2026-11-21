"""Finance service — budgets, projects, work orders, bills, transactions."""

from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.finance import Bill, Budget, FinancialTransaction
from app.models.projects import Project, ProjectGeoUnit, WorkOrder


# ── Budgets ──

async def get_budgets_for_unit(
    db: AsyncSession,
    geo_unit_id: str,
    fiscal_year: Optional[str] = None,
) -> List[Budget]:
    """Return budgets for a geographic unit, optionally filtered by fiscal year."""
    query = select(Budget).where(Budget.geo_unit_id == geo_unit_id)
    if fiscal_year:
        query = query.where(Budget.fiscal_year == fiscal_year)
    query = query.order_by(Budget.fiscal_year.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


# ── Projects ──

async def get_projects_for_unit(
    db: AsyncSession,
    geo_unit_id: str,
    status: Optional[str] = None,
) -> List[Project]:
    """Return projects affecting a geographic unit (via project_geo_units junction)."""
    query = (
        select(Project)
        .join(ProjectGeoUnit, ProjectGeoUnit.project_id == Project.project_id)
        .where(ProjectGeoUnit.geo_unit_id == geo_unit_id)
    )
    if status:
        query = query.where(Project.status == status)
    query = query.order_by(Project.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def list_projects(
    db: AsyncSession,
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[Project], int]:
    """Return projects with optional filters and pagination."""
    query = select(Project)
    count_query = select(func.count(Project.project_id))

    if category:
        query = query.where(Project.category == category)
        count_query = count_query.where(Project.category == category)
    if status:
        query = query.where(Project.status == status)
        count_query = count_query.where(Project.status == status)

    total = await db.scalar(count_query) or 0
    result = await db.execute(
        query.order_by(Project.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result.scalars().all()), total


async def get_project(db: AsyncSession, project_id: int) -> Optional[Project]:
    """Return a single project by ID."""
    result = await db.execute(
        select(Project).where(Project.project_id == project_id)
    )
    return result.scalar_one_or_none()


# ── Work Orders ──

async def get_work_order(db: AsyncSession, work_order_id: int) -> Optional[WorkOrder]:
    """Return a single work order with its contractor."""
    result = await db.execute(
        select(WorkOrder)
        .options(selectinload(WorkOrder.contractor))
        .where(WorkOrder.work_order_id == work_order_id)
    )
    return result.scalar_one_or_none()


# ── Bills ──

async def get_bill(db: AsyncSession, bill_id: int) -> Optional[Bill]:
    """Return a single bill with its items."""
    result = await db.execute(
        select(Bill)
        .options(selectinload(Bill.items))
        .where(Bill.bill_id == bill_id)
    )
    return result.scalar_one_or_none()


async def get_bills_for_project(db: AsyncSession, project_id: int) -> List[Bill]:
    """Return all bills for a project."""
    result = await db.execute(
        select(Bill)
        .options(selectinload(Bill.items))
        .where(Bill.project_id == project_id)
        .order_by(Bill.bill_date.desc())
    )
    return list(result.scalars().all())


async def get_bills_for_work_order(db: AsyncSession, work_order_id: int) -> List[Bill]:
    """Return all bills for a work order."""
    result = await db.execute(
        select(Bill)
        .options(selectinload(Bill.items))
        .where(Bill.work_order_id == work_order_id)
        .order_by(Bill.bill_date.desc())
    )
    return list(result.scalars().all())


# ── Financial Transactions ──

async def get_transactions_for_unit(
    db: AsyncSession,
    geo_unit_id: str,
    fiscal_year: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[FinancialTransaction], int]:
    """Return financial transactions for a geographic unit."""
    query = select(FinancialTransaction).where(
        FinancialTransaction.geo_unit_id == geo_unit_id
    )
    count_query = select(func.count(FinancialTransaction.transaction_id)).where(
        FinancialTransaction.geo_unit_id == geo_unit_id
    )

    if fiscal_year:
        query = query.where(FinancialTransaction.fiscal_year == fiscal_year)
        count_query = count_query.where(FinancialTransaction.fiscal_year == fiscal_year)

    total = await db.scalar(count_query) or 0
    result = await db.execute(
        query.order_by(FinancialTransaction.transaction_date.desc()).offset(offset).limit(limit)
    )
    return list(result.scalars().all()), total
