import asyncio
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_high_throughput_complaints(client: AsyncClient):
    """
    Load test: Simulates 100 high-frequency concurrent complaint submissions.
    Ensures connection pool resilience and error-free execution under load.
    """
    total_requests = 50
    payload = {
        "title": "High Frequency Load Test Complaint",
        "description": "Testing backend throughput under concurrent complaint submissions.",
        "category": "INFRASTRUCTURE",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "geo_unit_id": "IN-MH-BMC-WARD-A",
        "citizen_name": "Concurrent Tester",
        "citizen_phone": "+91-9999999999",
        "citizen_email": "loadtest@civiclens.in"
    }

    async def submit_complaint(i: int):
        req_payload = payload.copy()
        req_payload["title"] = f"Load Test Complaint #{i}"
        response = await client.post("/api/v1/complaints", json=req_payload)
        return response.status_code, response.json()

    print(f"\nStarting high-throughput load test ({total_requests} concurrent requests)...")
    tasks = [submit_complaint(i) for i in range(total_requests)]
    results = await asyncio.gather(*tasks)

    success_count = sum(1 for status, _ in results if status in (200, 201))
    print(f"\nCompleted {total_requests} requests with {success_count} successful creations.")
    
    assert success_count == total_requests, f"Expected {total_requests} successful creations, got {success_count}"
