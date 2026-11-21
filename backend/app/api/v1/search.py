"""Fuzzy Search API powered by PostgreSQL pg_trgm trigram indexing over canonical entities."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_, literal_column
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.geography import GeoUnit
from app.models.people import Person, PoliticalAssignment, OfficerAssignment

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/fuzzy")
async def fuzzy_search(
    q: str = Query(..., min_length=2, description="Search query string"),
    limit: int = Query(20, ge=1, le=50, description="Max results limit"),
    db: AsyncSession = Depends(get_db)
):
    """Execute fast PostgreSQL GIN-indexed trigram similarity search across GeoUnits, Persons, Parties, and Orgs."""
    clean_q = q.strip()
    if not clean_q:
        return {"query": q, "results": []}

    like_pattern = f"%{clean_q}%"
    results = []

    # 1. Search GeoUnits (States, Districts, Municipal Corporations, Wards)
    geo_stmt = (
        select(
            GeoUnit.unit_id,
            GeoUnit.name,
            GeoUnit.unit_type_id,
            GeoUnit.parent_unit_id,
            func.similarity(GeoUnit.name, clean_q).label("score")
        )
        .where(
            or_(
                func.similarity(GeoUnit.name, clean_q) > 0.15,
                GeoUnit.name.ilike(like_pattern),
                GeoUnit.unit_id.ilike(like_pattern)
            ),
            GeoUnit.is_active == True
        )
        .order_by(literal_column("score").desc())
        .limit(limit)
    )
    geo_res = await db.execute(geo_stmt)
    for row in geo_res.all():
        results.append({
            "id": row.unit_id,
            "name": row.name,
            "entity_type": row.unit_type_id,
            "parent_name": row.parent_unit_id,
            "score": round(float(row.score or 0), 2)
        })

    # 2. Search Persons (CMs, Collectors, Corporators, Leaders)
    person_stmt = (
        select(
            Person,
            func.similarity(Person.full_name, clean_q).label("score")
        )
        .options(
            selectinload(Person.political_assignments).selectinload(PoliticalAssignment.party),
            selectinload(Person.officer_assignments).selectinload(OfficerAssignment.organization)
        )
        .where(
            or_(
                func.similarity(Person.full_name, clean_q) > 0.15,
                Person.full_name.ilike(like_pattern)
            ),
            Person.is_active == True
        )
        .order_by(literal_column("score").desc())
        .limit(limit // 2)
    )
    person_res = await db.execute(person_stmt)
    person_rows = person_res.all()

    # Collect geo_unit_ids to fetch names in batch
    person_geo_ids = set()
    for person_obj, score in person_rows:
        for pa in person_obj.political_assignments or []:
            if pa.is_current and pa.geo_unit_id:
                person_geo_ids.add(pa.geo_unit_id)
        for oa in person_obj.officer_assignments or []:
            if oa.is_current and oa.geo_unit_id:
                person_geo_ids.add(oa.geo_unit_id)

    geo_units_map = {}
    if person_geo_ids:
        gu_res = await db.execute(select(GeoUnit).where(GeoUnit.unit_id.in_(list(person_geo_ids))))
        for gu in gu_res.scalars().all():
            geo_units_map[gu.unit_id] = gu

    for person_obj, score in person_rows:
        assigned_geo_id = None
        assigned_geo_name = None
        assigned_state_id = None
        assigned_unit_type = None
        role_title = person_obj.designation or "Governance Representative"
        party_or_dept = None
        person_type = "LEADER"

        # Check political assignments first
        curr_pa = next((p for p in (person_obj.political_assignments or []) if p.is_current), None)
        if curr_pa:
            assigned_geo_id = curr_pa.geo_unit_id
            role_title = curr_pa.role_title
            party_or_dept = curr_pa.party.abbreviation if curr_pa.party else "Political Representative"
            person_type = "POLITICIAN"
        else:
            curr_oa = next((o for o in (person_obj.officer_assignments or []) if o.is_current), None)
            if curr_oa:
                assigned_geo_id = curr_oa.geo_unit_id
                role_title = curr_oa.designation
                party_or_dept = curr_oa.organization.name if curr_oa.organization else "IAS / Administrative Officer"
                person_type = "BUREAUCRAT"

        if assigned_geo_id:
            gu_obj = geo_units_map.get(assigned_geo_id)
            if gu_obj:
                assigned_geo_name = gu_obj.name
                assigned_unit_type = gu_obj.unit_type_id
                assigned_state_id = gu_obj.state_code
            else:
                if assigned_geo_id.startswith("IN-"):
                    parts = assigned_geo_id.split("-")
                    if len(parts) >= 2:
                        assigned_state_id = parts[1]

        results.append({
            "id": str(person_obj.person_id),
            "name": person_obj.full_name,
            "entity_type": "PERSON",
            "person_type": person_type,
            "parent_name": f"{role_title} • {assigned_geo_name or assigned_geo_id or 'India'}",
            "score": round(float(score or 0), 2),
            "geo_unit_id": assigned_geo_id,
            "geo_unit_name": assigned_geo_name,
            "state_id": assigned_state_id,
            "unit_type": assigned_unit_type,
            "role_title": role_title,
            "party_or_dept": party_or_dept,
            "photo_url": person_obj.photo_url
        })

    # Sort combined results by score DESC and truncate to limit
    results.sort(key=lambda r: r["score"], reverse=True)
    results = results[:limit]

    return {
        "query": clean_q,
        "count": len(results),
        "results": results
    }
