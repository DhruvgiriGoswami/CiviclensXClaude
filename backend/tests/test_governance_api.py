"""Automated API integration test for Canonical Governance and Fuzzy Search endpoints."""

import pytest


@pytest.mark.asyncio
async def test_get_state_leadership_list(client):
    response = await client.get("/api/v1/governance/states")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 28
    assert any(item["state_id"].startswith("MH") for item in data)


@pytest.mark.asyncio
async def test_get_state_leadership_by_id(client):
    response = await client.get("/api/v1/governance/states/GJ")
    assert response.status_code == 200
    data = response.json()
    assert data["state_id"] == "GJ"
    assert data["leader"]["name"] is not None


@pytest.mark.asyncio
async def test_get_district_collectors(client):
    response = await client.get("/api/v1/governance/collectors/GJ")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_national_leaders(client):
    response = await client.get("/api/v1/governance/national")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5


@pytest.mark.asyncio
async def test_fuzzy_search(client):
    response = await client.get("/api/v1/search/fuzzy?q=Mumbai&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0
    assert data["query"] == "Mumbai"
