"""Tests for health endpoint and database connectivity."""

import pytest


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Health endpoint should return status ok with database ok."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"


@pytest.mark.asyncio
async def test_health_returns_json(client):
    """Health endpoint should return valid JSON."""
    response = await client.get("/health")
    assert response.headers["content-type"] == "application/json"


@pytest.mark.asyncio
async def test_version_endpoint(client):
    """Version endpoint should return non-sensitive deployment identity metadata."""
    response = await client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["application"] == "CivicLens"
    assert data["component"] == "backend"
    assert data["environment"] in ("SIT", "PROD", "DEV", "TEST")
    assert "commit" in data
    assert "database" in data
    assert "alembic_revision" in data["database"]


@pytest.mark.asyncio
async def test_health_is_503_when_db_down(client, monkeypatch):
    """A dead database must fail the health check, or the ALB keeps sending traffic to a broken task."""
    import app.main as main

    def broken_session():
        raise ConnectionError("db down")

    monkeypatch.setattr(main, "async_session_factory", broken_session)
    response = await client.get("/health")
    assert response.status_code == 503
    assert response.json()["database"] == "disconnected"
