"""Geography API endpoints — geo units, boundaries, GeoJSON, spatial resolution."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.geography import (
    GeoUnitSummary, GeoUnitDetail, ResolveRequest, ResolveResponse,
    ResolvedUnit,
)
from app.services import geography as geo_service

router = APIRouter(tags=["Geography"])


@router.get("/geo-units", response_model=list[GeoUnitSummary])
async def list_geo_units(
    unit_type_id: Optional[str] = Query(None, description="Filter by unit type (e.g., WARD, STATE)"),
    state_code: Optional[str] = Query(None, description="Filter by state code (e.g., MH)"),
    parent_unit_id: Optional[str] = Query(None, description="Filter by parent unit ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List geo units with optional filters."""
    units, total = await geo_service.get_geo_units(
        db, unit_type_id=unit_type_id, state_code=state_code,
        parent_unit_id=parent_unit_id, limit=limit, offset=offset,
    )
    return units


@router.get("/geo-units/corporations")
async def list_corporations(db: AsyncSession = Depends(get_db)):
    """Get all Municipal Corporations provisioned in PostgreSQL DB."""
    return await geo_service.get_corporations(db)


@router.get("/geo-units/{unit_id}", response_model=GeoUnitDetail)
async def get_geo_unit(unit_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single geo unit by ID."""
    unit = await geo_service.get_geo_unit(db, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail=f"Geo unit '{unit_id}' not found")
    return unit


@router.get("/geo-units/{unit_id}/children", response_model=list[GeoUnitSummary])
async def get_children(unit_id: str, db: AsyncSession = Depends(get_db)):
    """Get direct children of a geo unit."""
    children = await geo_service.get_children(db, unit_id)
    return children


@router.get("/geo-units/{unit_id}/boundary")
async def get_boundary(unit_id: str, db: AsyncSession = Depends(get_db)):
    """Get the current boundary geometry as GeoJSON Feature."""
    feature = await geo_service.get_boundary_geojson(db, unit_id)
    if not feature:
        raise HTTPException(status_code=404, detail=f"No boundary found for '{unit_id}'")
    return feature


@router.get("/geo-units/{unit_id}/geojson")
async def get_geojson(unit_id: str, db: AsyncSession = Depends(get_db)):
    """Get the current boundary as a GeoJSON Feature (alias for /boundary)."""
    feature = await geo_service.get_boundary_geojson(db, unit_id)
    if not feature:
        raise HTTPException(status_code=404, detail=f"No boundary found for '{unit_id}'")
    return feature


@router.get("/geo-units/{unit_id}/hierarchy")
async def get_hierarchy(unit_id: str, db: AsyncSession = Depends(get_db)):
    """Get the full geographic hierarchy for a unit (ward → city → district → state → country)."""
    hierarchy = await geo_service.get_hierarchy(db, unit_id)
    if not hierarchy:
        raise HTTPException(status_code=404, detail=f"Geo unit '{unit_id}' not found")
    return hierarchy


@router.get("/geo-units/{unit_id}/representatives")
async def get_representatives(unit_id: str, db: AsyncSession = Depends(get_db)):
    """Get all political representatives (ward holders) assigned to a geo unit."""
    reps = await geo_service.get_ward_representatives(db, unit_id)
    return reps



@router.post("/geography/resolve", response_model=ResolveResponse)
async def resolve_location(
    request: ResolveRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Resolve a GPS point to all containing geographic units.
    Returns matches from most specific (ward) to least specific (country).
    """
    units = await geo_service.resolve_location(db, request.latitude, request.longitude)
    return ResolveResponse(
        location={"latitude": request.latitude, "longitude": request.longitude},
        units=[ResolvedUnit(**u) for u in units],
    )


@router.get("/map/wards")
async def get_wards_for_city(
    city_id: str = Query(..., description="City/municipality geo unit ID"),
    db: AsyncSession = Depends(get_db),
):
    """Get GeoJSON FeatureCollection of all child boundaries for a city or state directly from PostGIS."""
    raw_json = await geo_service.get_region_features_geojson_raw(db, city_id)
    headers = {"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"}
    return Response(content=raw_json, media_type="application/json", headers=headers)
