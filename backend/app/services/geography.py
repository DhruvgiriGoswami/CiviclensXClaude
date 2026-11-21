"""Geography service — geo unit CRUD, spatial resolution, GeoJSON conversion."""

from typing import List, Optional

from geoalchemy2.functions import ST_AsGeoJSON, ST_Contains
from sqlalchemy import select, func, text, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.geography import GeoUnit, GeoUnitBoundary, GeoUnitType
from app.core.logging_config import logger


async def get_geo_unit_types(db: AsyncSession) -> List[GeoUnitType]:
    """Return all geo unit types."""
    result = await db.execute(select(GeoUnitType))
    return list(result.scalars().all())


async def get_geo_units(
    db: AsyncSession,
    unit_type_id: Optional[str] = None,
    state_code: Optional[str] = None,
    parent_unit_id: Optional[str] = None,
    is_active: bool = True,
    limit: int = 100,
    offset: int = 0,
) -> tuple[List[GeoUnit], int]:
    """Return filtered geo units with total count."""
    query = select(GeoUnit).where(GeoUnit.is_active == is_active)
    count_query = select(func.count(GeoUnit.unit_id)).where(GeoUnit.is_active == is_active)

    if unit_type_id:
        query = query.where(GeoUnit.unit_type_id == unit_type_id)
        count_query = count_query.where(GeoUnit.unit_type_id == unit_type_id)
    if state_code:
        query = query.where(GeoUnit.state_code == state_code)
        count_query = count_query.where(GeoUnit.state_code == state_code)
    if parent_unit_id:
        query = query.where(GeoUnit.parent_unit_id == parent_unit_id)
        count_query = count_query.where(GeoUnit.parent_unit_id == parent_unit_id)

    total = await db.scalar(count_query) or 0
    result = await db.execute(query.offset(offset).limit(limit).order_by(GeoUnit.name))
    return list(result.scalars().all()), total


async def get_geo_unit(db: AsyncSession, unit_id: str) -> Optional[GeoUnit]:
    """Return a single geo unit by ID."""
    result = await db.execute(select(GeoUnit).where(GeoUnit.unit_id == unit_id))
    return result.scalar_one_or_none()


async def get_children(db: AsyncSession, unit_id: str) -> List[GeoUnit]:
    """Return direct children of a geo unit."""
    result = await db.execute(
        select(GeoUnit)
        .where(GeoUnit.parent_unit_id == unit_id, GeoUnit.is_active == True)
        .order_by(GeoUnit.name)
    )
    return list(result.scalars().all())


async def resolve_location(db: AsyncSession, latitude: float, longitude: float) -> List[dict]:
    """
    Resolve a GPS point to all containing geo units using PostGIS ST_Contains.
    Returns a list from most specific (ward) to least specific (country).
    Uses parameterized spatial points to ensure safety and performance.
    """
    point_geom = func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326)

    query = (
        select(
            GeoUnit.unit_id,
            GeoUnit.unit_type_id,
            GeoUnit.name,
            GeoUnit.level,
        )
        .join(GeoUnitBoundary, GeoUnitBoundary.unit_id == GeoUnit.unit_id)
        .where(
            GeoUnitBoundary.is_current == True,
            ST_Contains(
                GeoUnitBoundary.geometry,
                point_geom,
            ),
        )
        .order_by(GeoUnit.level.desc().nullslast())
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "unit_id": row.unit_id,
            "type": row.unit_type_id,
            "name": row.name,
        }
        for row in rows
    ]


async def get_smallest_containing_unit(
    db: AsyncSession, latitude: float, longitude: float
) -> Optional[str]:
    """
    Find the most specific (highest level) geo unit containing a point.
    Returns the unit_id or None.
    """
    units = await resolve_location(db, latitude, longitude)
    if units:
        return units[0]["unit_id"]
    return None


CORP_CENTERS = {
    "IN-MH-NMMC": {"lat": 19.1031, "lng": 73.0125},
    "IN-MH-BMC": {"lat": 18.9220, "lng": 72.8347},
    "IN-MH-PMC": {"lat": 18.5204, "lng": 73.8567},
    "IN-MH-NMC": {"lat": 21.1458, "lng": 79.0882},
    "IN-KA-BBMP": {"lat": 12.9716, "lng": 77.5946},
    "IN-MH-TMC": {"lat": 19.2183, "lng": 72.9781},
    "IN-TG-GHMC": {"lat": 17.3850, "lng": 78.4867},
    "IN-GJ-AMC": {"lat": 23.0225, "lng": 72.5714},
    "IN-GJ-BMC-BHAVNAGAR": {"lat": 21.7645, "lng": 72.1519},
    "IN-GJ-SMC": {"lat": 21.1702, "lng": 72.8311},
    "IN-TN-GCC": {"lat": 13.0418, "lng": 80.2341},
    "IN-MP-IMC": {"lat": 22.7196, "lng": 75.8577},
    "IN-MP-BMC": {"lat": 23.2599, "lng": 77.4126},
}


async def get_ward_representatives(db: AsyncSession, unit_id: str) -> List[dict]:
    """Get all current political representatives (ward holders) assigned to a geo unit."""
    from app.models.people import PoliticalAssignment
    from sqlalchemy.orm import selectinload

    stmt = (
        select(PoliticalAssignment)
        .options(
            selectinload(PoliticalAssignment.person),
            selectinload(PoliticalAssignment.party),
        )
        .where(
            PoliticalAssignment.geo_unit_id == unit_id,
            PoliticalAssignment.is_current == True,
        )
        .order_by(PoliticalAssignment.role_title)
    )

    result = await db.execute(stmt)
    assignments = result.scalars().all()

    # Fallback to child units if querying parent unit (e.g. IN-MH-NMMC -> IN-MH-NMMC-WARD-12)
    if not assignments:
        stmt_c = (
            select(PoliticalAssignment)
            .options(
                selectinload(PoliticalAssignment.person),
                selectinload(PoliticalAssignment.party),
            )
            .where(
                PoliticalAssignment.geo_unit_id.startswith(f"{unit_id}-"),
                PoliticalAssignment.is_current == True,
            )
            .order_by(PoliticalAssignment.role_title)
        )
        result_c = await db.execute(stmt_c)
        assignments = result_c.scalars().all()

    from app.models.people import LeaderFeedback

    person_names = [a.person.full_name for a in assignments if a.person and a.person.full_name]
    person_ids = [a.person_id for a in assignments if a.person_id]
    rating_by_name = {}
    rating_by_id = {}
    if person_names or person_ids:
        fb_conditions = []
        clean_lower_names = [n.strip().lower() for n in person_names if n.strip()]
        if clean_lower_names:
            fb_conditions.append(func.lower(func.trim(LeaderFeedback.leader_name)).in_(clean_lower_names))
        if person_ids:
            fb_conditions.append(LeaderFeedback.leader_id.in_(person_ids))

        fb_stmt = (
            select(
                LeaderFeedback.leader_name,
                LeaderFeedback.leader_id,
                LeaderFeedback.rating,
                LeaderFeedback.responsiveness_score,
                LeaderFeedback.transparency_score,
            )
            .where(or_(*fb_conditions))
        )
        fb_res = await db.execute(fb_stmt)
        fb_rows = fb_res.all()

        scores_by_name = {}
        scores_by_id = {}
        for row in fb_rows:
            r_name = (row.leader_name or "").strip().lower()
            r_id = row.leader_id
            if row.responsiveness_score is not None and row.transparency_score is not None:
                r_val = round((float(row.responsiveness_score) + float(row.transparency_score)) / 2.0, 1)
            else:
                r_val = float(row.rating or 0)
            if r_name:
                scores_by_name.setdefault(r_name, []).append(r_val)
            if r_id:
                scores_by_id.setdefault(r_id, []).append(r_val)

        for k, vals in scores_by_name.items():
            rating_by_name[k] = (round(sum(vals) / len(vals), 1), len(vals))
        for k, vals in scores_by_id.items():
            rating_by_id[k] = (round(sum(vals) / len(vals), 1), len(vals))

    reps = []
    for a in assignments:
        p_name = a.person.full_name if a.person else "Unknown"
        clean_p_name = p_name.strip().lower()
        stats = rating_by_id.get(a.person_id) or rating_by_name.get(clean_p_name)
        reps.append({
            "assignment_id": a.political_assignment_id,
            "person_id": a.person_id,
            "name": p_name,
            "person_name": p_name,
            "role_title": a.role_title,
            "designation": a.person.designation if a.person else a.role_title,
            "party": a.party.abbreviation if a.party else "IND",
            "party_name": a.party.name if a.party else "Independent",
            "photo_url": a.person.photo_url if a.person else None,
            "user_rating": stats[0] if stats else None,
            "total_votes": stats[1] if stats else 0,
            "approval_status": "VERIFIED",
        })
    return reps


async def get_corporations(db: AsyncSession) -> List[dict]:
    """
    Retrieve all Municipal Corporations provisioned in PostgreSQL DB with dynamic aggregations.
    Optimized with consolidated batch queries to eliminate N+1 query overhead.
    """
    try:
        from app.models.complaints import Complaint
        from app.models.finance import Budget
        from app.models.people import PoliticalAssignment, OfficerAssignment

        result = await db.execute(
            select(GeoUnit).where(GeoUnit.unit_type_id.in_(["MUNICIPALITY", "MUNICIPAL_CORPORATION"]))
        )
        corps = result.scalars().all()
        if not corps:
            return []

        corp_ids = [c.unit_id for c in corps]

        # 1. Batch Wards Count for all corporations in a single query
        ward_counts_res = await db.execute(
            select(GeoUnit.parent_unit_id, func.count(GeoUnit.unit_id))
            .where(GeoUnit.parent_unit_id.in_(corp_ids))
            .group_by(GeoUnit.parent_unit_id)
        )
        ward_counts_map = {row[0]: row[1] for row in ward_counts_res.all() if row[0]}

        # 2. Batch Budgets for all corporations
        budget_res = await db.execute(
            select(
                Budget.geo_unit_id,
                func.coalesce(func.sum(Budget.allocated_amount), 0.0),
                func.coalesce(func.sum(Budget.utilized_amount), 0.0),
            )
            .group_by(Budget.geo_unit_id)
        )
        budget_map = {}
        for b_geo, b_alloc, b_util in budget_res.all():
            if b_geo:
                budget_map[b_geo] = (float(b_alloc), float(b_util))

        # 3. Batch Political Assignments
        pol_res = await db.execute(
            select(PoliticalAssignment)
            .options(selectinload(PoliticalAssignment.person), selectinload(PoliticalAssignment.party))
            .where(PoliticalAssignment.is_current == True)
        )
        pol_map = {}
        for pa in pol_res.scalars().all():
            if pa.geo_unit_id and pa.geo_unit_id not in pol_map:
                pol_map[pa.geo_unit_id] = pa

        # 4. Batch Officer Assignments
        off_res = await db.execute(
            select(OfficerAssignment)
            .options(selectinload(OfficerAssignment.person), selectinload(OfficerAssignment.organization))
            .where(OfficerAssignment.is_current == True)
        )
        off_map = {}
        for oa in off_res.scalars().all():
            if oa.geo_unit_id and oa.geo_unit_id not in off_map:
                off_map[oa.geo_unit_id] = oa

        # 5. Batch Complaint Counts grouped by resolved_geo_unit_id
        complaint_res = await db.execute(
            select(
                Complaint.resolved_geo_unit_id,
                func.count(Complaint.complaint_id),
                func.count(func.nullif(Complaint.status.in_(["RESOLVED", "CLOSED"]), False))
            )
            .group_by(Complaint.resolved_geo_unit_id)
        )
        complaint_map = {}
        for c_geo, c_tot, c_res in complaint_res.all():
            if c_geo:
                complaint_map[c_geo] = (c_tot, c_res)

        corps_list = []
        for c in corps:
            code = c.unit_id.split("-")[-1]
            city = c.name.split(" ")[0]
            center = CORP_CENTERS.get(c.unit_id, {"lat": 19.0760, "lng": 72.8777})

            # Wards count
            wards_count = ward_counts_map.get(c.unit_id, 0)

            # Ticket counts (aggregate corporation and child units from map)
            total_tickets = 0
            resolved_tickets = 0
            for g_id, (t_tot, t_res) in complaint_map.items():
                if g_id == c.unit_id or g_id.startswith(f"{c.unit_id}-"):
                    total_tickets += t_tot
                    resolved_tickets += t_res

            # Budget allocation & spent
            allocated_val = 0.0
            spent_val = 0.0
            for b_id, (b_alloc, b_util) in budget_map.items():
                if b_id == c.unit_id or b_id.startswith(f"{c.unit_id}-"):
                    allocated_val += b_alloc
                    spent_val += b_util

            # No budget rows means unknown, not a made-up figure.
            budget_allocated_fmt = f"₹{int(allocated_val):,}" if allocated_val > 0 else None
            budget_spent_fmt = f"₹{int(spent_val):,}" if spent_val > 0 else None

            # Political Voice
            pol_assign = pol_map.get(c.unit_id)
            if not pol_assign:
                # check prefix matches
                for p_id, pa in pol_map.items():
                    if p_id.startswith(f"{c.unit_id}-"):
                        pol_assign = pa
                        break

            if pol_assign:
                political_voice = {
                    "name": pol_assign.person.full_name if pol_assign.person else f"{code} Mayor",
                    "role": pol_assign.role_title,
                    "party": pol_assign.party.name if pol_assign.party else "Municipal Council",
                    "userRating": None,  # real ratings come from /representatives/ratings-summary
                    "approvalStatus": "VERIFIED",
                }
            else:
                political_voice = None

            # Administrative Spender
            off_assign = off_map.get(c.unit_id)
            if not off_assign:
                for o_id, oa in off_map.items():
                    if o_id.startswith(f"{c.unit_id}-"):
                        off_assign = oa
                        break

            if off_assign:
                admin_spender = {
                    "name": off_assign.person.full_name if off_assign.person else f"{code} Municipal Commissioner",
                    "role": off_assign.designation,
                    "party": off_assign.organization.name if off_assign.organization else "State Urban Development Dept",
                    "userRating": None,
                    "approvalStatus": "VERIFIED",
                }
            else:
                admin_spender = None

            corps_list.append({
                "id": c.unit_id,
                "unitId": c.unit_id,
                "code": code,
                "name": c.name,
                "city": city,
                "stateId": c.state_code,
                "center": center,
                "unitType": "MUNICIPAL_CORPORATION",
                "wardsCount": wards_count,
                "budgetAllocatedCapEx": budget_allocated_fmt,
                "budgetSpentOnTime": budget_spent_fmt,
                "totalTicketsCount": total_tickets,
                "resolvedTicketsCount": resolved_tickets,
                "politicalVoice": political_voice,
                "administrativeSpender": admin_spender,
                "projects": [],  # no project data source is wired up yet
            })

        return corps_list
    except Exception:
        logger.exception("get_corporations failed")
        raise


async def get_boundary_geojson(db: AsyncSession, unit_id: str) -> Optional[dict]:
    """
    Get the current boundary of a geo unit as GeoJSON.
    Falls back to another unit with the same name if this unit_id has no boundary stored.
    Returns None when no real boundary exists (no synthetic polygons).
    """
    import json

    # 1. Exact unit_id query
    query = (
        select(
            GeoUnit.unit_id,
            GeoUnit.name,
            GeoUnit.unit_type_id,
            ST_AsGeoJSON(GeoUnitBoundary.geometry).label("geojson"),
        )
        .join(GeoUnitBoundary, GeoUnitBoundary.unit_id == GeoUnit.unit_id)
        .where(
            GeoUnit.unit_id == unit_id,
            GeoUnitBoundary.is_current == True,
        )
    )

    result = await db.execute(query)
    row = result.first()

    # 2. Fallback search by exact unit name if exact unit_id boundary isn't found
    if not row:
        unit = await get_geo_unit(db, unit_id)
        if unit and unit.name:
            fallback_query = (
                select(
                    GeoUnit.unit_id,
                    GeoUnit.name,
                    GeoUnit.unit_type_id,
                    ST_AsGeoJSON(GeoUnitBoundary.geometry).label("geojson"),
                )
                .join(GeoUnitBoundary, GeoUnitBoundary.unit_id == GeoUnit.unit_id)
                .where(
                    GeoUnit.name == unit.name,
                    GeoUnitBoundary.is_current == True,
                )
            )
            fb_res = await db.execute(fallback_query)
            row = fb_res.first()

    if not row:
        return None

    # ST_AsGeoJSON returns JSON text; some drivers hand back an already-parsed dict.
    geometry = row.geojson if isinstance(row.geojson, dict) else json.loads(row.geojson)
    return {
        "type": "Feature",
        "properties": {
            "unit_id": unit_id,
            "name": row.name,
            "unit_type_id": row.unit_type_id,
        },
        "geometry": geometry,
    }


async def get_region_features_geojson_raw(db: AsyncSession, parent_unit_id: str) -> str:
    """
    High-performance GeoJSON FeatureCollection generation directly from PostGIS.
    Preserves 100% exact geometry precision for Wards & Municipal units.
    Applies light simplification only for state-level District overviews.
    """
    sql = text("""
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(
                json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'properties', json_build_object(
                            'unit_id', gu.unit_id,
                            'name', gu.name,
                            'unit_type_id', gu.unit_type_id
                        ),
                        'geometry', ST_AsGeoJSON(
                            CASE 
                                WHEN gu.unit_type_id = 'DISTRICT' THEN ST_SimplifyPreserveTopology(gub.geometry, 0.0005)
                                ELSE gub.geometry
                            END
                        )::json
                    )
                    ORDER BY gu.name
                ),
                '[]'::json
            )
        )::text
        FROM geo_units gu
        INNER JOIN geo_unit_boundaries gub ON gub.unit_id = gu.unit_id AND gub.is_current = true
        WHERE gu.parent_unit_id = :parent_unit_id
          AND gu.is_active = true
    """)
    res = await db.execute(sql, {"parent_unit_id": parent_unit_id})
    raw_str = res.scalar()
    return raw_str or '{"type":"FeatureCollection","features":[]}'


async def get_hierarchy(db: AsyncSession, unit_id: str) -> List[dict]:
    """Walk up the parent chain to build the full geographic hierarchy."""
    hierarchy = []
    current_id = unit_id

    while current_id:
        unit = await get_geo_unit(db, current_id)
        if not unit:
            break
        hierarchy.append({
            "unit_id": unit.unit_id,
            "type": unit.unit_type_id,
            "name": unit.name,
        })
        current_id = unit.parent_unit_id

    return hierarchy
