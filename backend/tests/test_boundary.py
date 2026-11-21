"""get_boundary_geojson must return a GeoJSON Feature. A refactor once dropped its return and nobody noticed."""

import pytest

from app.services import geography


class _Row:
    unit_id = "IN-MH-PMC-WARD-15"
    name = "Ward 15"
    unit_type_id = 7
    geojson = '{"type": "MultiPolygon", "coordinates": []}'


class _Result:
    def first(self):
        return _Row()


class _FakeDB:
    async def execute(self, _query):
        return _Result()


@pytest.mark.asyncio
async def test_boundary_returns_feature():
    feature = await geography.get_boundary_geojson(_FakeDB(), "IN-MH-PMC-WARD-15")
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "MultiPolygon"
    assert feature["properties"] == {"unit_id": "IN-MH-PMC-WARD-15", "name": "Ward 15", "unit_type_id": 7}
