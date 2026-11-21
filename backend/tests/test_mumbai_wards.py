import pytest
from httpx import AsyncClient
from sqlalchemy import text
from app.core.database import async_session_factory

@pytest.mark.asyncio
async def test_fetch_mumbai_wards_and_political_values(client: AsyncClient):
    """
    Verifies fetching Mumbai city wards (BMC / IN-MH-BMC) along with their
    geographical boundary data and political representatives.
    """
    # 1. Fetch Mumbai Wards via GeoJSON FeatureCollection API
    res_map = await client.get("/api/v1/map/wards?city_id=IN-MH-BMC")
    assert res_map.status_code == 200
    geojson_data = res_map.json()
    assert geojson_data.get("type") == "FeatureCollection"
    features = geojson_data.get("features", [])
    print(f"\n[Mumbai BMC Wards Map API] Returned {len(features)} ward features.")

    # 2. Fetch Mumbai Wards via GeoUnits Children API
    res_wards = await client.get("/api/v1/geo-units/IN-MH-BMC/children")
    assert res_wards.status_code == 200
    wards = res_wards.json()
    print(f"[Mumbai BMC Wards Children API] Returned {len(wards)} wards.")

    # 3. Fetch Political Representatives & Officers for Mumbai
    res_pol = await client.get("/api/v1/geo-units/IN-MH-BMC/political-representatives")
    assert res_pol.status_code == 200
    pol_reps = res_pol.json()
    print(f"[Mumbai Political Reps API] Returned {len(pol_reps)} representatives.")

    res_off = await client.get("/api/v1/geo-units/IN-MH-BMC/officers")
    assert res_off.status_code == 200
    officers = res_off.json()
    print(f"[Mumbai Officers API] Returned {len(officers)} administrative officers.")

    # 4. Verify DB Ward Scale Capability
    async with async_session_factory() as session:
        count_res = await session.execute(
            text("SELECT count(*) FROM geo_units WHERE parent_unit_id LIKE '%BMC%' OR unit_id LIKE '%BMC-WARD%';")
        )
        total_mumbai_db_wards = count_res.scalar() or 0
        print(f"[Mumbai Database Scale Check] Total Mumbai Wards in DB: {total_mumbai_db_wards}")
