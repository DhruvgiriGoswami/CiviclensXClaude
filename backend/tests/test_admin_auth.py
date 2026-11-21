"""Admin key checks. None of these reach the database: auth fails before any query runs."""

import pytest

from app.core.config import settings


@pytest.fixture
def admin_key(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_API_KEY", "test-admin-key")
    return "test-admin-key"


@pytest.mark.asyncio
async def test_delete_without_key_is_401(client, admin_key):
    response = await client.delete("/api/v1/complaints/1")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_with_wrong_key_is_401(client, admin_key):
    response = await client.delete("/api/v1/complaints/1", headers={"X-Admin-Key": "wrong"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_query_string_key_is_rejected(client, admin_key):
    response = await client.delete(f"/api/v1/complaints/1?admin_key={admin_key}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_unconfigured_key_disables_admin(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_API_KEY", "")
    response = await client.post("/api/v1/complaints/purge-test-data", headers={"X-Admin-Key": ""})
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_old_hardcoded_key_no_longer_works(client, admin_key):
    response = await client.delete("/api/v1/complaints/1", headers={"X-Admin-Key": "civiclens-admin-secret-key-2026"})
    assert response.status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize("path", ["/api/v1/complaints/delete", "/api/v1/complaints/admin-delete"])
async def test_password_body_endpoints_are_gone(client, path):
    response = await client.post(path, json={"complaint_ID": "all", "password": "x"})
    assert response.status_code in (404, 405)
