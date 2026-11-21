"""Hackathon complaints as map tickets: the batch geo lookup must agree with the single-point one."""

import pytest
from httpx import AsyncClient

from app.core.database import async_session_factory
from app.services.geography import get_smallest_containing_unit, smallest_units_for_points

POINTS = [(19.000536, 72.834779), (19.0176, 72.8562), (19.1197, 72.8464), (18.0, 60.0)]  # last one is at sea


@pytest.mark.asyncio
async def test_batch_lookup_matches_single_lookup(client: AsyncClient):
    async with async_session_factory() as db:
        batch = await smallest_units_for_points(db, POINTS)
        single = [await get_smallest_containing_unit(db, lat, lon) for lat, lon in POINTS]
    assert batch == single
    assert batch[-1] is None


@pytest.mark.asyncio
async def test_complaint_tickets_carry_a_unit(client: AsyncClient):
    r = await client.get("/api/v1/audit/complaint-tickets")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) > 3000
    assert sum(1 for x in rows if (x["unit_id"] or "").startswith("IN-MH-BMC-WARD-")) / len(rows) > 0.95
    assert {"complaint_id", "lat", "lon", "category", "description", "status", "upvotes", "unit_id"} <= rows[0].keys()
