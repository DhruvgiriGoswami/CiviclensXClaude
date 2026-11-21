"""GET /api/v1/complaints/counts groups complaints by resolved unit under a parent (map choropleth)."""

import pytest


@pytest.mark.asyncio
async def test_counts_by_child_unit(client):
    created = await client.post("/api/v1/complaints", json={
        "title": "Test counts complaint", "description": "Pothole for counts test", "category": "ROAD",
        "latitude": 18.5204, "longitude": 73.8567, "priority": "LOW",
    })
    assert created.status_code == 201
    unit_id = created.json()["resolved_geo_unit_id"]
    assert unit_id, "test DB has no boundary for this point"
    unit = await client.get(f"/api/v1/geo-units/{unit_id}")
    parent = unit.json()["parent_unit_id"]

    before = (await client.get("/api/v1/complaints/counts", params={"parent_geo_unit_id": parent})).json()
    # Test complaints are left in place, like test_complaints.py does (purge-test-data cleans them).
    assert before.get(unit_id, 0) >= 1 and all(isinstance(v, int) for v in before.values())


@pytest.mark.asyncio
async def test_counts_unknown_parent_is_empty(client):
    r = await client.get("/api/v1/complaints/counts", params={"parent_geo_unit_id": "NO-SUCH-UNIT"})
    assert r.status_code == 200 and r.json() == {}


@pytest.mark.asyncio
async def test_counts_needs_parent(client):
    assert (await client.get("/api/v1/complaints/counts")).status_code == 422
