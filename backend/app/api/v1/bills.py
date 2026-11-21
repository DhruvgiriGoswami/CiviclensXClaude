"""Bill API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.finance import BillResponse, BillItemResponse
from app.services import finance as finance_service

router = APIRouter(tags=["Bills"])


@router.get("/bills/{bill_id}", response_model=BillResponse)
async def get_bill(bill_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single bill with its line items."""
    bill = await finance_service.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
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
        items=[BillItemResponse.model_validate(item) for item in bill.items] if bill.items else [],
    )
