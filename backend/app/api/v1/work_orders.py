"""Work Order API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.finance import WorkOrderResponse, ContractorSummary, BillResponse, BillItemResponse
from app.services import finance as finance_service

router = APIRouter(tags=["Work Orders"])


@router.get("/work-orders/{work_order_id}", response_model=WorkOrderResponse)
async def get_work_order(work_order_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single work order by ID."""
    wo = await finance_service.get_work_order(db, work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return WorkOrderResponse(
        work_order_id=wo.work_order_id,
        work_order_number=wo.work_order_number,
        project_id=wo.project_id,
        contractor=ContractorSummary.model_validate(wo.contractor),
        work_description=wo.work_description,
        contract_amount=float(wo.contract_amount) if wo.contract_amount else None,
        issue_date=wo.issue_date,
        start_date=wo.start_date,
        end_date=wo.end_date,
        status=wo.status,
    )


@router.get("/work-orders/{work_order_id}/bills", response_model=list[BillResponse])
async def get_work_order_bills(work_order_id: int, db: AsyncSession = Depends(get_db)):
    """Get all bills for a work order."""
    bills = await finance_service.get_bills_for_work_order(db, work_order_id)
    return [
        BillResponse(
            bill_id=b.bill_id,
            bill_number=b.bill_number,
            work_order_id=b.work_order_id,
            project_id=b.project_id,
            bill_type=b.bill_type,
            bill_date=b.bill_date,
            period_from=b.period_from,
            period_to=b.period_to,
            gross_amount=float(b.gross_amount),
            tax_amount=float(b.tax_amount) if b.tax_amount else None,
            deduction_amount=float(b.deduction_amount) if b.deduction_amount else None,
            net_amount=float(b.net_amount),
            status=b.status,
            document_url=b.document_url,
            items=[BillItemResponse.model_validate(item) for item in b.items] if b.items else [],
        )
        for b in bills
    ]
