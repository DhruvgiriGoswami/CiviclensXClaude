"""Canonical Governance API endpoints querying persons, political_assignments, officer_assignments, political_parties, organizations, and geo_units."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.geography import GeoUnit
from app.models.people import PoliticalAssignment, OfficerAssignment

router = APIRouter(prefix="/governance", tags=["governance"])


def clean_photo_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    url_str = str(url).strip()
    if url_str.startswith("http://") or url_str.startswith("https://"):
        return None
    return url_str


def format_political_assignment(pa: PoliticalAssignment) -> dict:
    person = pa.person
    party = pa.party
    return {
        "assignment_id": pa.political_assignment_id,
        "assignment_type": "POLITICAL",
        "unit_id": pa.geo_unit_id,
        "designation": pa.role_title,
        "party_name": party.name if party else None,
        "party_abbreviation": party.abbreviation if party else None,
        "authority_type": pa.authority_type,
        "is_current": pa.is_current,
        "leader": {
            "id": person.person_id if person else None,
            "name": person.full_name if person else "Leader",
            "person_type": "POLITICIAN",
            "designation": person.designation if person else pa.role_title,
            "email": person.email if person else None,
            "phone": person.phone if person else None,
            "photo_url": clean_photo_url(person.photo_url) if person else None,
            "source_url": person.source_url if person else None,
        } if person else None
    }


def format_officer_assignment(oa: OfficerAssignment) -> dict:
    person = oa.person
    org = oa.organization
    return {
        "assignment_id": oa.officer_assignment_id,
        "assignment_type": "BUREAUCRATIC",
        "unit_id": oa.geo_unit_id,
        "designation": oa.designation,
        "organization_name": org.name if org else "Government Administration",
        "authority_type": oa.authority_type,
        "is_current": oa.is_current,
        "leader": {
            "id": person.person_id if person else None,
            "name": person.full_name if person else "Officer",
            "person_type": "BUREAUCRAT",
            "designation": person.designation if person else oa.designation,
            "email": person.email if person else None,
            "phone": person.phone if person else None,
            "photo_url": clean_photo_url(person.photo_url) if person else None,
            "source_url": person.source_url if person else None,
        } if person else None
    }


@router.get("/states")
async def get_state_leadership_list(db: AsyncSession = Depends(get_db)):
    """Return CM / State leadership for all States & UTs querying political_assignments."""
    stmt = (
        select(PoliticalAssignment)
        .options(selectinload(PoliticalAssignment.person), selectinload(PoliticalAssignment.party))
        .where(PoliticalAssignment.role_title == "Chief Minister", PoliticalAssignment.is_current == True)
    )
    res = await db.execute(stmt)
    assignments = res.scalars().all()

    if not assignments:
        # Fallback to any current political assignment if specific Chief Minister assignments aren't seeded
        fb_stmt = (
            select(PoliticalAssignment)
            .options(selectinload(PoliticalAssignment.person), selectinload(PoliticalAssignment.party))
            .where(PoliticalAssignment.is_current == True)
        )
        res_fb = await db.execute(fb_stmt)
        assignments = res_fb.scalars().all()

    # Load geo_units for names
    unit_ids = [a.geo_unit_id for a in assignments if a.geo_unit_id]
    geo_res = await db.execute(select(GeoUnit).where(GeoUnit.unit_id.in_(unit_ids)))
    geo_map = {g.unit_id: g for g in geo_res.scalars().all()}

    results = []
    for pa in assignments:
        resp = format_political_assignment(pa)
        geo = geo_map.get(pa.geo_unit_id)
        st_code = pa.geo_unit_id.replace("IN-", "") if pa.geo_unit_id and pa.geo_unit_id.startswith("IN-") else pa.geo_unit_id
        resp["state_id"] = st_code
        resp["state_name"] = geo.name if geo else st_code
        results.append(resp)
    results.sort(key=lambda x: (x.get("state_name") or "").lower())
    return results


@router.get("/states/{state_id}")
async def get_state_leadership_by_id(state_id: str, db: AsyncSession = Depends(get_db)):
    """Return CM leadership for specific state code (e.g. GJ, MH, KA)."""
    st_clean = state_id.upper().strip().replace("IN-", "")
    st_code = st_clean.split("-")[0] if "-" in st_clean else st_clean
    target_unit = f"IN-{st_code}"

    stmt = (
        select(PoliticalAssignment)
        .options(selectinload(PoliticalAssignment.person), selectinload(PoliticalAssignment.party))
        .where(
            PoliticalAssignment.role_title == "Chief Minister",
            PoliticalAssignment.is_current == True,
            # The trailing "-" stops state "M" from matching "IN-MH" or "IN-MP".
            (PoliticalAssignment.geo_unit_id == target_unit) |
            (PoliticalAssignment.geo_unit_id == st_code) |
            PoliticalAssignment.geo_unit_id.startswith(f"IN-{st_code}-")
        )
    )
    res = await db.execute(stmt)
    pa = res.scalars().first()
    # No CM on record means "unknown". Never show another state's CM.

    if not pa:
        return {
            "state_id": st_code,
            "state_name": f"State ({st_code})",
            "office_address": "State Secretariat",
            "party_name": "State Executive",
            "leader": {
                "name": "Chief Minister",
                "photo_url": "/PartyImages/India.jpg",
                "email": None,
            }
        }

    geo_res = await db.execute(select(GeoUnit).where(GeoUnit.unit_id == pa.geo_unit_id))
    geo = geo_res.scalars().first()

    resp = format_political_assignment(pa)
    resp["state_id"] = st_code
    resp["state_name"] = geo.name if geo else st_code
    return resp


@router.get("/collectors")
async def get_all_district_collectors(
    state_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Return District Collectors / DMs list querying officer_assignments."""
    stmt = (
        select(OfficerAssignment)
        .options(selectinload(OfficerAssignment.person), selectinload(OfficerAssignment.organization))
        .where(OfficerAssignment.authority_type == "DISTRICT_EXECUTIVE", OfficerAssignment.is_current == True)
    )
    if state_id:
        st_clean = state_id.upper().strip().replace("IN-", "")
        stmt = stmt.join(GeoUnit, OfficerAssignment.geo_unit_id == GeoUnit.unit_id).where(
            GeoUnit.state_code == st_clean,
            or_(GeoUnit.unit_type_id == "DISTRICT", GeoUnit.unit_id.like("%-DIST-%"))
        )

    res = await db.execute(stmt)
    assignments = res.scalars().all()
    return [format_officer_assignment(a) for a in assignments]


@router.get("/collectors/{state_id}")
async def get_district_collectors_by_state(state_id: str, db: AsyncSession = Depends(get_db)):
    """Return District Collectors for a state_id."""
    return await get_all_district_collectors(state_id=state_id, db=db)


@router.get("/collectors/district/{district_id}")
async def get_district_collector_by_district(district_id: str, db: AsyncSession = Depends(get_db)):
    """Return Collector / DM for a specific district unit ID."""
    d_clean = district_id.upper().strip()
    stmt = (
        select(OfficerAssignment)
        .options(selectinload(OfficerAssignment.person), selectinload(OfficerAssignment.organization))
        .where(
            OfficerAssignment.authority_type == "DISTRICT_EXECUTIVE",
            (OfficerAssignment.geo_unit_id == d_clean) | (OfficerAssignment.geo_unit_id == f"IN-{d_clean}")
        )
    )
    res = await db.execute(stmt)
    oa = res.scalars().first()
    if not oa:
        raise HTTPException(status_code=404, detail=f"District collector for district '{district_id}' not found")
    return format_officer_assignment(oa)


@router.get("/wards/{ward_id}/representatives")
async def get_ward_representatives(ward_id: str, db: AsyncSession = Depends(get_db)):
    """Return corporators and administrative officers for a ward or municipal corp."""
    w_clean = ward_id.strip()
    
    # Query political assignments
    p_stmt = (
        select(PoliticalAssignment)
        .options(selectinload(PoliticalAssignment.person), selectinload(PoliticalAssignment.party))
        .where(PoliticalAssignment.geo_unit_id == w_clean)
    )
    p_res = await db.execute(p_stmt)
    p_assigns = p_res.scalars().all()

    # Query officer assignments
    o_stmt = (
        select(OfficerAssignment)
        .options(selectinload(OfficerAssignment.person), selectinload(OfficerAssignment.organization))
        .where(OfficerAssignment.geo_unit_id == w_clean)
    )
    o_res = await db.execute(o_stmt)
    o_assigns = o_res.scalars().all()

    reps = [format_political_assignment(pa) for pa in p_assigns] + [format_officer_assignment(oa) for oa in o_assigns]

    return {
        "ward_id": w_clean,
        "representatives": reps
    }


@router.get("/national")
async def get_national_leaders(db: AsyncSession = Depends(get_db)):
    """Return PM, President, Union Ministers, RBI Governor, CAG from canonical assignments."""
    p_stmt = (
        select(PoliticalAssignment)
        .options(selectinload(PoliticalAssignment.person), selectinload(PoliticalAssignment.party))
        .where(PoliticalAssignment.authority_type == "NATIONAL_POLITICAL", PoliticalAssignment.is_current == True)
    )
    p_res = await db.execute(p_stmt)
    p_assigns = p_res.scalars().all()

    o_stmt = (
        select(OfficerAssignment)
        .options(selectinload(OfficerAssignment.person), selectinload(OfficerAssignment.organization))
        .where(OfficerAssignment.authority_type == "NATIONAL_INSTITUTIONAL", OfficerAssignment.is_current == True)
    )
    o_res = await db.execute(o_stmt)
    o_assigns = o_res.scalars().all()

    reps = [format_political_assignment(pa) for pa in p_assigns] + [format_officer_assignment(oa) for oa in o_assigns]
    return reps
