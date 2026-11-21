"""Pydantic schemas for budgets, projects, work orders, bills, and financial transactions."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


# ── Budget ──

class BudgetResponse(BaseModel):
    budget_id: int
    geo_unit_id: str
    organization_id: Optional[int] = None
    fiscal_year: str
    budget_type: str
    fund_source: Optional[str] = None
    allocated_amount: Optional[float] = None
    revised_amount: Optional[float] = None
    released_amount: Optional[float] = None
    utilized_amount: Optional[float] = None
    status: Optional[str] = None
    source_reference: Optional[str] = None
    source_url: Optional[str] = None
    model_config = {"from_attributes": True}


# ── Project ──

class ProjectSummary(BaseModel):
    project_id: int
    project_code: str
    name: str
    category: Optional[str] = None
    status: Optional[str] = None
    sanctioned_amount: Optional[float] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    model_config = {"from_attributes": True}


class ProjectDetail(ProjectSummary):
    description: Optional[str] = None
    owning_geo_unit_id: Optional[str] = None
    implementing_organization_id: Optional[int] = None
    funding_source: Optional[str] = None
    actual_end_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ── Contractor ──

class ContractorSummary(BaseModel):
    contractor_id: int
    legal_name: str
    registration_number: Optional[str] = None
    gstin: Optional[str] = None
    model_config = {"from_attributes": True}


# ── Work Order ──

class WorkOrderResponse(BaseModel):
    work_order_id: int
    work_order_number: str
    project_id: int
    contractor: ContractorSummary
    work_description: Optional[str] = None
    contract_amount: Optional[float] = None
    issue_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    model_config = {"from_attributes": True}


# ── Bill ──

class BillItemResponse(BaseModel):
    bill_item_id: int
    description: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_rate: Optional[float] = None
    amount: float
    model_config = {"from_attributes": True}


class BillResponse(BaseModel):
    bill_id: int
    bill_number: str
    work_order_id: int
    project_id: int
    bill_type: Optional[str] = None
    bill_date: Optional[date] = None
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    gross_amount: float
    tax_amount: Optional[float] = None
    deduction_amount: Optional[float] = None
    net_amount: float
    status: Optional[str] = None
    document_url: Optional[str] = None
    items: List[BillItemResponse] = []
    model_config = {"from_attributes": True}


# ── Financial Transaction ──

class TransactionResponse(BaseModel):
    transaction_id: int
    transaction_reference: str
    geo_unit_id: Optional[str] = None
    project_id: Optional[int] = None
    bill_id: Optional[int] = None
    organization_id: Optional[int] = None
    fiscal_year: Optional[str] = None
    transaction_type: str
    amount: float
    transaction_date: datetime
    status: Optional[str] = None
    source_system: Optional[str] = None
    external_reference: Optional[str] = None
    description: Optional[str] = None
    model_config = {"from_attributes": True}
