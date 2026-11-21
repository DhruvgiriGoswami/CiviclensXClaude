"""Follow the Rupee audit API. In-memory, no database: see docs/API_CONTRACT.md."""

import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from app.audit import budget, claude, views
from app.audit.load import AuditStore, load_store

router = APIRouter(prefix="/audit", tags=["Audit"])


def store(request: Request) -> AuditStore:
    # Built in lifespan; loaded here too so a bare ASGI client (no lifespan) still works.
    if getattr(request.app.state, "audit", None) is None:
        request.app.state.audit = load_store()
    return request.app.state.audit


def _found(x, what: str):
    if x is None:
        raise HTTPException(status_code=404, detail=f"{what} not found")
    return x


def _ward(s: AuditStore, code: str) -> str:
    return _found(code if code in set(s.wards.ward_code) else None, f"Ward {code}")


class AskBody(BaseModel):
    question: str = Field("", max_length=1000)  # caps what anyone can send to the paid model
    complaint_id: Optional[str] = Field(None, max_length=40)
    ward_code: Optional[str] = Field(None, max_length=20)


@router.get("/overview")
def overview(request: Request):
    return views.overview(store(request))


@router.get("/wards")
def wards(request: Request):
    return views.wards(store(request))


@router.get("/wards.geojson")
def wards_geojson(request: Request):
    return store(request).wards_geojson


@router.post("/wards/{code:path}/summary")
async def ward_summary(code: str, request: Request):
    s = store(request)
    _ward(s, code)
    return await asyncio.to_thread(claude.ward_summary, s, code)


@router.get("/wards/{code:path}")
def ward(code: str, request: Request):
    return _found(views.ward_detail(store(request), code), f"Ward {code}")


@router.get("/contractors")
def contractors(request: Request):
    return views.contractors(store(request))


@router.get("/contractors/{cid}")
def contractor(cid: str, request: Request):
    return _found(views.contractor(store(request), cid), f"Contractor {cid}")


@router.get("/flags")
def flags(request: Request, ward: Optional[str] = None, rule: Optional[str] = None,
          contractor: Optional[str] = None, severity: Optional[str] = None):
    return views.flags(store(request), ward, rule, contractor, severity)


@router.get("/export/flags.csv")
def flags_csv(request: Request):
    return PlainTextResponse(views.flags_csv(store(request)), media_type="text/csv",
                             headers={"Content-Disposition": 'attachment; filename="flags.csv"'})


@router.get("/next-rupee/{code:path}")
def next_rupee(code: str, request: Request):
    s = store(request)
    return budget.plan(s, _ward(s, code))


@router.get("/complaints")
def complaint_points(request: Request):
    return views.complaint_points(store(request))


@router.get("/complaints/{complaint_id}")
def complaint(complaint_id: str, request: Request):
    return _found(views.complaint_trail(store(request), complaint_id), f"Complaint {complaint_id}")


@router.get("/search")
def search(request: Request, q: str = Query("")):
    return views.search(store(request), q)


@router.post("/ask")
async def ask(body: AskBody, request: Request):
    s = store(request)
    if body.complaint_id and views.complaint_trail(s, body.complaint_id) is None:
        raise HTTPException(status_code=404, detail=f"Complaint {body.complaint_id} not found")
    return await asyncio.to_thread(claude.ask, s, body.question, body.complaint_id, body.ward_code)
