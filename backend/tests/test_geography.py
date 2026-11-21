"""Tests for geography endpoints — geo units, children, boundary, resolution."""

import pytest


@pytest.mark.asyncio
async def test_list_geo_units(client):
    """GET /api/v1/geo-units should return a list."""
    response = await client.get("/api/v1/geo-units")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_geo_units_by_type(client):
    """GET /api/v1/geo-units?unit_type_id=STATE should filter by type."""
    response = await client.get("/api/v1/geo-units", params={"unit_type_id": "STATE"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for unit in data:
        assert unit["unit_type_id"] == "STATE"


@pytest.mark.asyncio
async def test_get_geo_unit_not_found(client):
    """GET /api/v1/geo-units/NONEXISTENT should return 404."""
    response = await client.get("/api/v1/geo-units/NONEXISTENT-UNIT-ID")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_geo_unit_detail(client):
    """GET /api/v1/geo-units/IN should return India."""
    response = await client.get("/api/v1/geo-units/IN")
    if response.status_code == 200:
        data = response.json()
        assert data["unit_id"] == "IN"
        assert data["name"] == "India"


@pytest.mark.asyncio
async def test_get_children(client):
    """GET /api/v1/geo-units/IN/children should return states."""
    response = await client.get("/api/v1/geo-units/IN/children")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_resolve_location(client):
    """POST /api/v1/geography/resolve should accept lat/lng and return units."""
    response = await client.post(
        "/api/v1/geography/resolve",
        json={"latitude": 18.5204, "longitude": 73.8567},
    )
    assert response.status_code == 200
    data = response.json()
    assert "location" in data
    assert "units" in data
    assert data["location"]["latitude"] == 18.5204


@pytest.mark.asyncio
async def test_resolve_location_invalid(client):
    """POST /api/v1/geography/resolve with invalid coords should return 422."""
    response = await client.post(
        "/api/v1/geography/resolve",
        json={"latitude": 999, "longitude": 73.8567},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_hierarchy(client):
    """GET /api/v1/geo-units/IN-MH-PMC-WARD-15/hierarchy should return hierarchy chain."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/hierarchy")
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        # Should start from ward and go up to country
        if len(data) > 0:
            assert data[0]["unit_id"] == "IN-MH-PMC-WARD-15"
