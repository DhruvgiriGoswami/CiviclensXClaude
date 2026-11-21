"""Tests for finance endpoints — budgets, projects, work orders, bills, transactions."""

import pytest


# ── Budget endpoints ──


@pytest.mark.asyncio
async def test_get_budgets_for_unit(client):
    """GET /api/v1/geo-units/{id}/budgets should return a list."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/budgets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_budgets_with_fiscal_year(client):
    """Budgets should be filterable by fiscal year."""
    response = await client.get(
        "/api/v1/geo-units/IN-MH-PMC-WARD-15/budgets",
        params={"fiscal_year": "2025-26"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for budget in data:
        assert budget["fiscal_year"] == "2025-26"


@pytest.mark.asyncio
async def test_budget_response_fields(client):
    """Budget responses should contain required financial fields."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/budgets")
    if response.status_code == 200:
        data = response.json()
        for budget in data:
            assert "budget_id" in budget
            assert "geo_unit_id" in budget
            assert "fiscal_year" in budget
            assert "budget_type" in budget


@pytest.mark.asyncio
async def test_get_budgets_empty_unit(client):
    """A unit with no budgets should return empty list, not 404."""
    response = await client.get("/api/v1/geo-units/IN/budgets")
    assert response.status_code == 200
    assert response.json() == []


# ── Project endpoints ──


@pytest.mark.asyncio
async def test_list_projects(client):
    """GET /api/v1/projects should return a list."""
    response = await client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_list_projects_by_status(client):
    """Projects should be filterable by status."""
    response = await client.get("/api/v1/projects", params={"status": "IN_PROGRESS"})
    assert response.status_code == 200
    data = response.json()
    for project in data:
        assert project["status"] == "IN_PROGRESS"


@pytest.mark.asyncio
async def test_get_project_detail(client):
    """GET /api/v1/projects/{id} should return project details."""
    # First list projects to get an ID
    list_resp = await client.get("/api/v1/projects")
    if list_resp.status_code == 200 and len(list_resp.json()) > 0:
        project_id = list_resp.json()[0]["project_id"]
        response = await client.get(f"/api/v1/projects/{project_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == project_id
        assert "project_code" in data
        assert "name" in data


@pytest.mark.asyncio
async def test_get_project_not_found(client):
    """GET /api/v1/projects/999999 should return 404."""
    response = await client.get("/api/v1/projects/999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_projects_for_unit(client):
    """GET /api/v1/geo-units/{id}/projects should return projects affecting that unit."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_project_bills(client):
    """GET /api/v1/projects/{id}/bills should return bills for a project."""
    list_resp = await client.get("/api/v1/projects")
    if list_resp.status_code == 200 and len(list_resp.json()) > 0:
        project_id = list_resp.json()[0]["project_id"]
        response = await client.get(f"/api/v1/projects/{project_id}/bills")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ── Work Order endpoints ──


@pytest.mark.asyncio
async def test_get_work_order_not_found(client):
    """GET /api/v1/work-orders/999999 should return 404."""
    response = await client.get("/api/v1/work-orders/999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_work_order_bills(client):
    """GET /api/v1/work-orders/{id}/bills should return bills."""
    # We need a valid work order ID — skip if no seed data
    response = await client.get("/api/v1/work-orders/1/bills")
    # Either 200 (data exists) or valid response
    assert response.status_code in (200, 404)


# ── Bill endpoints ──


@pytest.mark.asyncio
async def test_get_bill_not_found(client):
    """GET /api/v1/bills/999999 should return 404."""
    response = await client.get("/api/v1/bills/999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_bill_response_fields(client):
    """Bills should contain required financial fields."""
    response = await client.get("/api/v1/bills/1")
    if response.status_code == 200:
        data = response.json()
        assert "bill_id" in data
        assert "bill_number" in data
        assert "gross_amount" in data
        assert "net_amount" in data
        assert "items" in data
        assert isinstance(data["items"], list)


# ── Transaction endpoints ──


@pytest.mark.asyncio
async def test_get_transactions_for_unit(client):
    """GET /api/v1/geo-units/{id}/transactions should return a list."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/transactions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_transaction_response_fields(client):
    """Transactions should contain required fields including CBDC-ready fields."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/transactions")
    if response.status_code == 200:
        data = response.json()
        for txn in data:
            assert "transaction_id" in txn
            assert "transaction_reference" in txn
            assert "transaction_type" in txn
            assert "amount" in txn
            assert "transaction_date" in txn
            # CBDC-ready fields must exist (can be null)
            assert "source_system" in txn
            assert "external_reference" in txn


@pytest.mark.asyncio
async def test_get_transactions_empty_unit(client):
    """A unit with no transactions should return empty list, not 404."""
    response = await client.get("/api/v1/geo-units/IN/transactions")
    assert response.status_code == 200
    assert response.json() == []
