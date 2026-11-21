"""API v1 router — aggregates all sub-routers under /api/v1."""

from fastapi import APIRouter

from app.api.v1.geography import router as geography_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.authority import router as authority_router
from app.api.v1.projects import router as projects_router
from app.api.v1.work_orders import router as work_orders_router
from app.api.v1.bills import router as bills_router
from app.api.v1.finance import router as finance_router
from app.api.v1.governance import router as governance_router
from app.api.v1.search import router as search_router
from app.api.v1.audit import router as audit_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(geography_router)
api_v1_router.include_router(complaints_router)
api_v1_router.include_router(authority_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(work_orders_router)
api_v1_router.include_router(bills_router)
api_v1_router.include_router(finance_router)
api_v1_router.include_router(governance_router)
api_v1_router.include_router(search_router)
api_v1_router.include_router(audit_router)
