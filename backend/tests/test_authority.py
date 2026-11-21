"""Tests for authority endpoints — political representatives and officers."""

import pytest


@pytest.mark.asyncio
async def test_get_political_representatives(client):
    """GET /api/v1/geo-units/{id}/political-representatives should return a list."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/political-representatives")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_political_representatives_with_party(client):
    """Political representatives should include party info when available."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/political-representatives")
    if response.status_code == 200:
        data = response.json()
        for rep in data:
            assert "person" in rep
            assert "role_title" in rep
            assert "is_current" in rep
            assert "political_assignment_id" in rep
            # Person must have required fields
            assert "full_name" in rep["person"]
            assert "person_id" in rep["person"]


@pytest.mark.asyncio
async def test_get_political_representatives_current_only(client):
    """current_only=true should only return current assignments."""
    response = await client.get(
        "/api/v1/geo-units/IN-MH-PMC-WARD-15/political-representatives",
        params={"current_only": True},
    )
    assert response.status_code == 200
    data = response.json()
    for rep in data:
        assert rep["is_current"] is True


@pytest.mark.asyncio
async def test_get_political_representatives_empty(client):
    """A unit with no assignments should return empty list, not 404."""
    response = await client.get("/api/v1/geo-units/IN/political-representatives")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_officers(client):
    """GET /api/v1/geo-units/{id}/officers should return a list."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/officers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_officers_with_organization(client):
    """Officers should include organization info."""
    response = await client.get("/api/v1/geo-units/IN-MH-PMC-WARD-15/officers")
    if response.status_code == 200:
        data = response.json()
        for officer in data:
            assert "person" in officer
            assert "organization" in officer
            assert "designation" in officer
            assert "is_current" in officer
            assert "officer_assignment_id" in officer
            # Organization must have required fields
            assert "name" in officer["organization"]
            assert "organization_type" in officer["organization"]


@pytest.mark.asyncio
async def test_get_officers_current_only(client):
    """current_only=true should only return current officer assignments."""
    response = await client.get(
        "/api/v1/geo-units/IN-MH-PMC-WARD-15/officers",
        params={"current_only": True},
    )
    assert response.status_code == 200
    data = response.json()
    for officer in data:
        assert officer["is_current"] is True


@pytest.mark.asyncio
async def test_get_officers_empty(client):
    """A unit with no officers should return empty list, not 404."""
    response = await client.get("/api/v1/geo-units/IN/officers")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_rate_representative(client):
    """POST /api/v1/representatives/rate should record rating in database and return updated score."""
    payload = {
        "leader_name": "Test Representative",
        "rating": 5,
        "citizen_name": "Rohan Deshmukh",
        "responsiveness_score": 5,
        "transparency_score": 5,
        "feedback_text": "Prompt response on road pothole repair."
    }
    response = await client.post("/api/v1/representatives/rate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["leader_name"] == "Test Representative"
    assert data["citizen_name"] == "Rohan Deshmukh"
    assert data["rating"] == 5
    assert data["total_reviews"] >= 1
    assert data["average_rating"] >= 1.0


@pytest.mark.asyncio
async def test_rate_representative_anonymous(client):
    """Rating without a citizen name should default to 'Anonymous'."""
    payload = {
        "leader_name": "Test Representative",
        "rating": 4,
        "citizen_name": "",
        "responsiveness_score": 4,
        "transparency_score": 4,
        "feedback_text": "Good work overall."
    }
    response = await client.post("/api/v1/representatives/rate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["citizen_name"] == "Anonymous"


@pytest.mark.asyncio
async def test_get_representative_feedbacks(client):
    """GET /api/v1/representatives/feedbacks should return individual reviews and summary."""
    response = await client.get("/api/v1/representatives/feedbacks", params={"leader_name": "Test Representative"})
    assert response.status_code == 200
    data = response.json()
    assert data["leader_name"] == "Test Representative"
    assert "average_rating" in data
    assert "total_reviews" in data
    assert isinstance(data["feedbacks"], list)
    assert len(data["feedbacks"]) >= 1


@pytest.mark.asyncio
async def test_get_ratings_summary(client):
    """GET /api/v1/representatives/ratings-summary should return dictionary of ratings."""
    response = await client.get("/api/v1/representatives/ratings-summary")
    assert response.status_code == 200
    data = response.json()
    assert "ratings" in data
    assert isinstance(data["ratings"], dict)
    assert "Test Representative" in data["ratings"]

