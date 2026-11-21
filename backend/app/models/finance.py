"""Financial models: bills, bill items, budgets, and transactions."""

from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import (
    Date, DateTime, ForeignKey, Index, Numeric,
    String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Bill(Base):
    """A bill submitted against a work order."""
    __tablename__ = "bills"

    bill_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bill_number: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    work_order_id: Mapped[int] = mapped_column(
        ForeignKey("work_orders.work_order_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    bill_type: Mapped[Optional[str]] = mapped_column(String(100))
    bill_date: Mapped[Optional[date]] = mapped_column(Date)
    period_from: Mapped[Optional[date]] = mapped_column(Date)
    period_to: Mapped[Optional[date]] = mapped_column(Date)
    gross_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    tax_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    deduction_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    net_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(50))
    document_url: Mapped[Optional[str]] = mapped_column(String(1000))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items: Mapped[List["BillItem"]] = relationship(back_populates="bill")

    __table_args__ = (
        Index("ix_bills_work_order_id", "work_order_id"),
        Index("ix_bills_project_id", "project_id"),
        Index("ix_bills_bill_date", "bill_date"),
        Index("ix_bills_status", "status"),
    )


class BillItem(Base):
    """A line item within a bill."""
    __tablename__ = "bill_items"

    bill_item_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bill_id: Mapped[int] = mapped_column(
        ForeignKey("bills.bill_id", deferrable=True, initially="IMMEDIATE"), nullable=False,
    )
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    quantity: Mapped[Optional[float]] = mapped_column(Numeric(18, 4))
    unit: Mapped[Optional[str]] = mapped_column(String(50))
    unit_rate: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    bill: Mapped["Bill"] = relationship(back_populates="items")

    __table_args__ = (
        Index("ix_bill_items_bill_id", "bill_id"),
    )


class Budget(Base):
    """A fiscal-year budget allocation for a geographic unit."""
    __tablename__ = "budgets"

    budget_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    geo_unit_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE"),
    )
    fiscal_year: Mapped[str] = mapped_column(String(20), nullable=False)
    budget_type: Mapped[str] = mapped_column(String(50), nullable=False)
    fund_source: Mapped[Optional[str]] = mapped_column(String(255))
    allocated_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    revised_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    released_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    utilized_amount: Mapped[Optional[float]] = mapped_column(Numeric(18, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    source_reference: Mapped[Optional[str]] = mapped_column(String(500))
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_budgets_geo_unit_id", "geo_unit_id"),
        Index("ix_budgets_organization_id", "organization_id"),
        Index("ix_budgets_fiscal_year", "fiscal_year"),
        Index("ix_budgets_budget_type", "budget_type"),
    )


class FinancialTransaction(Base):
    """An individual financial transaction — designed for future CBDC integration."""
    __tablename__ = "financial_transactions"

    transaction_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    transaction_reference: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    geo_unit_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("geo_units.unit_id", deferrable=True, initially="IMMEDIATE"),
    )
    project_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("projects.project_id", deferrable=True, initially="IMMEDIATE"),
    )
    bill_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("bills.bill_id", deferrable=True, initially="IMMEDIATE"),
    )
    organization_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("organizations.organization_id", deferrable=True, initially="IMMEDIATE"),
    )
    fiscal_year: Mapped[Optional[str]] = mapped_column(String(20))
    transaction_type: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(50))
    source_system: Mapped[Optional[str]] = mapped_column(String(255))
    external_reference: Mapped[Optional[str]] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_financial_transactions_geo_unit_id", "geo_unit_id"),
        Index("ix_financial_transactions_project_id", "project_id"),
        Index("ix_financial_transactions_bill_id", "bill_id"),
        Index("ix_financial_transactions_organization_id", "organization_id"),
        Index("ix_financial_transactions_fiscal_year", "fiscal_year"),
        Index("ix_financial_transactions_transaction_type", "transaction_type"),
        Index("ix_financial_transactions_transaction_date", "transaction_date"),
        Index("ix_financial_transactions_status", "status"),
    )
