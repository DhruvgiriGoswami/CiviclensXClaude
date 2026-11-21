"""Tests for complaint endpoints — creation, listing, update, media upload."""

import pytest


@pytest.mark.asyncio
async def test_create_complaint(client):
    """POST /api/v1/complaints should create a complaint with geo-resolution."""
    response = await client.post(
        "/api/v1/complaints",
        json={
            "title": "Test pothole complaint",
            "description": "Large pothole on FC Road near Vaishali restaurant",
            "category": "ROAD",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "priority": "HIGH",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test pothole complaint"
    assert data["category"] == "ROAD"
    assert data["status"] == "OPEN"
    assert "complaint_id" in data


@pytest.mark.asyncio
async def test_list_complaints(client):
    """GET /api/v1/complaints should return paginated list."""
    response = await client.get("/api/v1/complaints")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_list_complaints_by_category(client):
    """GET /api/v1/complaints?category=ROAD should filter by category."""
    response = await client.get("/api/v1/complaints", params={"category": "ROAD"})
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["category"] == "ROAD"


@pytest.mark.asyncio
async def test_get_complaint_not_found(client):
    """GET /api/v1/complaints/999999 should return 404."""
    response = await client.get("/api/v1/complaints/999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_complaint_is_gone(client):
    """PATCH was unauthenticated and let anyone rewrite any complaint; it must not exist."""
    response = await client.patch("/api/v1/complaints/1", json={"priority": "HIGH"})
    assert response.status_code == 405


@pytest.mark.asyncio
async def test_create_complaint_missing_fields(client):
    """POST /api/v1/complaints with missing required fields should return 422."""
    response = await client.post(
        "/api/v1/complaints",
        json={"title": "Missing coordinates"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upvote_complaint(client):
    """POST /api/v1/complaints/{id}/upvote should increment upvotes."""
    create_resp = await client.post(
        "/api/v1/complaints",
        json={
            "title": "Test complaint for upvoting",
            "category": "ROAD",
            "latitude": 19.0760,
            "longitude": 72.8777,
        },
    )
    if create_resp.status_code == 201:
        complaint_id = create_resp.json()["complaint_id"]
        initial_upvotes = create_resp.json().get("upvotes", 0)
        upvote_resp = await client.post(f"/api/v1/complaints/{complaint_id}/upvote")
        assert upvote_resp.status_code == 200
        assert upvote_resp.json()["upvotes"] == initial_upvotes + 1


def test_magic_bytes_decide_the_type_not_the_client():
    from app.services.media import _detect_mime_from_magic_bytes as detect
    assert detect(b"\xff\xd8\xff\xe0" + b"0" * 8) == "image/jpeg"
    assert detect(b"\x00\x00\x00\x18ftypheic" + b"0" * 8) == "image/heic"
    assert detect(b"\x00\x00\x00\x18ftypmif1" + b"0" * 8) == "image/heif"
    assert detect(b"not an image at all") is None
    assert detect(b"") is None


@pytest.mark.asyncio
async def test_mumbai_district_ids_include_bmc_complaints(client):
    """Both Mumbai district ids from the map should list the same complaints as the BMC parent unit."""
    bmc = (await client.get("/api/v1/complaints", params={"geo_unit_id": "IN-MH-MUMBAI", "page_size": 1})).json()["total"]
    for dist in ("IN-MH-DIST-MUMBAI_CITY", "IN-MH-DIST-SUB_URBAN_MUMBAI", "IN-MH-DIST-MUMBAI_SUBURBAN"):
        r = await client.get("/api/v1/complaints", params={"geo_unit_id": dist, "page_size": 1})
        assert r.json()["total"] == bmc, dist
