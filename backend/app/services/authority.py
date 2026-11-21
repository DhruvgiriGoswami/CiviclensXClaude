"""Authority service — query political and officer assignments for geographic units."""

from typing import List, Optional

from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.people import PoliticalAssignment, OfficerAssignment, LeaderFeedback, Person


GEO_UNIT_ALIASES = {
    "IN-GJ-DIST-AHMEDABAD": "IN-GJ-DIST-AHMADABAD",
    "IN-GJ-DIST-AMDAVAD": "IN-GJ-DIST-AHMADABAD",
    "IN-GJ-DIST-ARVALLI": "IN-GJ-DIST-ARAVALLI",
    "IN-GJ-DIST-BANASKANTHA": "IN-GJ-DIST-BANAS_KANTHA",
    "IN-GJ-DIST-BANAS-KANTHA": "IN-GJ-DIST-BANAS_KANTHA",
    "IN-GJ-DIST-CHHOTAUDEPUR": "IN-GJ-DIST-CHHOTA_UDEPUR",
    "IN-GJ-DIST-CHHOTA-UDEPUR": "IN-GJ-DIST-CHHOTA_UDEPUR",
    "IN-GJ-DIST-DANGS-AHWA": "IN-GJ-DIST-DANGS",
    "IN-GJ-DIST-DANGSAHWA": "IN-GJ-DIST-DANGS",
    "IN-GJ-DIST-DEVBHUMIDWARKA": "IN-GJ-DIST-DEVBHUMI_DWARKA",
    "IN-GJ-DIST-DEVBHUMI-DWARKA": "IN-GJ-DIST-DEVBHUMI_DWARKA",
    "IN-GJ-DIST-DEVBHUMI-DWARKA-KHAMBHALIYA": "IN-GJ-DIST-DEVBHUMI_DWARKA",
    "IN-GJ-DIST-DEVBHUMIDWARKAKHAMBHALIYA": "IN-GJ-DIST-DEVBHUMI_DWARKA",
    "IN-GJ-DIST-GIR-SOMNATH": "IN-GJ-DIST-GIR_SOMNATH",
    "IN-GJ-DIST-GIR-SOMNATH-VERAVAL": "IN-GJ-DIST-GIR_SOMNATH",
    "IN-GJ-DIST-GIRSOMNATHVERAVAL": "IN-GJ-DIST-GIR_SOMNATH",
    "IN-GJ-DIST-KUTCH": "IN-GJ-DIST-KACHCHH",
    "IN-GJ-DIST-MEHSANA": "IN-GJ-DIST-MAHESANA",
    "IN-GJ-DIST-MAHISAGAR-LUNAVADA": "IN-GJ-DIST-MAHISAGAR",
    "IN-GJ-DIST-MAHISAGARLUNAVADA": "IN-GJ-DIST-MAHISAGAR",
    "IN-GJ-DIST-NARMADA-RAJPIPLA": "IN-GJ-DIST-NARMADA",
    "IN-GJ-DIST-NARMADARAJPIPLA": "IN-GJ-DIST-NARMADA",
    "IN-GJ-DIST-PANCHMAHAL": "IN-GJ-DIST-PANCH_MAHALS",
    "IN-GJ-DIST-PANCHMAHALS": "IN-GJ-DIST-PANCH_MAHALS",
    "IN-GJ-DIST-PANCH-MAHALS": "IN-GJ-DIST-PANCH_MAHALS",
    "IN-GJ-DIST-SABARKANTHA": "IN-GJ-DIST-SABAR_KANTHA",
    "IN-GJ-DIST-SABAR-KANTHA": "IN-GJ-DIST-SABAR_KANTHA",
    "IN-GJ-DIST-TAPI-VYARA": "IN-GJ-DIST-TAPI",
    "IN-GJ-DIST-TAPIVYARA": "IN-GJ-DIST-TAPI",
}


def normalize_geo_unit_id(unit_id: str) -> str:
    if not unit_id:
        return unit_id
    u = str(unit_id).strip().upper()
    return GEO_UNIT_ALIASES.get(u, unit_id)


async def get_political_representatives(
    db: AsyncSession,
    geo_unit_id: str,
    current_only: bool = True,
) -> List[PoliticalAssignment]:
    """Return political assignments for a geo unit (with child and parent fallback)."""
    geo_unit_id = normalize_geo_unit_id(geo_unit_id)
    query = (
        select(PoliticalAssignment)
        .options(
            selectinload(PoliticalAssignment.person),
            selectinload(PoliticalAssignment.party),
        )
        .where(PoliticalAssignment.geo_unit_id == geo_unit_id)
    )
    if current_only:
        query = query.where(PoliticalAssignment.is_current == True)

    query = query.order_by(PoliticalAssignment.role_title)
    result = await db.execute(query)
    reps = list(result.scalars().all())

    # 1. Fallback to child units (e.g. corporation -> ward)
    if not reps:
        query_c = (
            select(PoliticalAssignment)
            .options(
                selectinload(PoliticalAssignment.person),
                selectinload(PoliticalAssignment.party),
            )
            .where(PoliticalAssignment.geo_unit_id.startswith(f"{geo_unit_id}-"))
        )
        if current_only:
            query_c = query_c.where(PoliticalAssignment.is_current == True)
        query_c = query_c.order_by(PoliticalAssignment.role_title)
        res_c = await db.execute(query_c)
        reps = list(res_c.scalars().all())

    # 2. Fallback to parent unit (e.g. ward -> corporation -> state)
    if not reps and "-" in geo_unit_id:
        parts = geo_unit_id.split("-")
        parent_candidates = []
        if "WARD" in parts:
            idx = parts.index("WARD")
            parent_candidates.append("-".join(parts[:idx]))
        if len(parts) >= 3:
            parent_candidates.append("-".join(parts[:3]))
        if len(parts) >= 2:
            parent_candidates.append("-".join(parts[:2]))

        for parent_id in parent_candidates:
            if not parent_id or parent_id == geo_unit_id:
                continue
            query_p = (
                select(PoliticalAssignment)
                .options(
                    selectinload(PoliticalAssignment.person),
                    selectinload(PoliticalAssignment.party),
                )
                .where(PoliticalAssignment.geo_unit_id == parent_id)
            )
            if current_only:
                query_p = query_p.where(PoliticalAssignment.is_current == True)
            query_p = query_p.order_by(PoliticalAssignment.role_title)
            res_p = await db.execute(query_p)
            reps = list(res_p.scalars().all())
            if reps:
                break

    return reps


async def get_officers(
    db: AsyncSession,
    geo_unit_id: str,
    current_only: bool = True,
) -> List[OfficerAssignment]:
    """Return officer assignments for a geo unit (with child and parent fallback)."""
    geo_unit_id = normalize_geo_unit_id(geo_unit_id)
    query = (
        select(OfficerAssignment)
        .options(
            selectinload(OfficerAssignment.person),
            selectinload(OfficerAssignment.organization),
        )
        .where(OfficerAssignment.geo_unit_id == geo_unit_id)
    )
    if current_only:
        query = query.where(OfficerAssignment.is_current == True)

    query = query.order_by(OfficerAssignment.designation)
    result = await db.execute(query)
    offs = list(result.scalars().all())

    # 1. Fallback to child units (e.g. corporation -> ward)
    if not offs:
        query_c = (
            select(OfficerAssignment)
            .options(
                selectinload(OfficerAssignment.person),
                selectinload(OfficerAssignment.organization),
            )
            .where(OfficerAssignment.geo_unit_id.startswith(f"{geo_unit_id}-"))
        )
        if current_only:
            query_c = query_c.where(OfficerAssignment.is_current == True)
        query_c = query_c.order_by(OfficerAssignment.designation)
        res_c = await db.execute(query_c)
        offs = list(res_c.scalars().all())

    # 2. Fallback to parent unit (e.g. ward -> corporation -> district -> state)
    if not offs and "-" in geo_unit_id:
        parts = geo_unit_id.split("-")
        parent_candidates = []
        if "WARD" in parts:
            idx = parts.index("WARD")
            parent_candidates.append("-".join(parts[:idx]))
        if len(parts) >= 3:
            parent_candidates.append("-".join(parts[:3]))
        if len(parts) >= 2:
            parent_candidates.append("-".join(parts[:2]))

        for parent_id in parent_candidates:
            if not parent_id or parent_id == geo_unit_id:
                continue
            query_p = (
                select(OfficerAssignment)
                .options(
                    selectinload(OfficerAssignment.person),
                    selectinload(OfficerAssignment.organization),
                )
                .where(OfficerAssignment.geo_unit_id == parent_id)
            )
            if current_only:
                query_p = query_p.where(OfficerAssignment.is_current == True)
            query_p = query_p.order_by(OfficerAssignment.designation)
            res_p = await db.execute(query_p)
            offs = list(res_p.scalars().all())
            if offs:
                break

    return offs


async def record_leader_feedback(
    db: AsyncSession,
    leader_name: str,
    rating: int,
    leader_id: Optional[int] = None,
    leader_type: str = "POLITICAL",
    geo_unit_id: Optional[str] = None,
    citizen_name: str = "Anonymous",
    responsiveness_score: int = 5,
    transparency_score: int = 5,
    feedback_text: Optional[str] = None,
) -> LeaderFeedback:
    """Store citizen feedback and rating in PostgreSQL DB."""
    # Resolve leader name if missing
    clean_name = (leader_name or "").strip()
    if not clean_name and leader_id:
        p_res = await db.execute(select(Person).where(Person.person_id == leader_id))
        person = p_res.scalar_one_or_none()
        if person:
            clean_name = person.full_name
        else:
            clean_name = f"Leader #{leader_id}"
    elif not clean_name:
        clean_name = "Representative"

    # Calculate rating as the average of responsiveness and transparency
    calculated_rating = round((responsiveness_score + transparency_score) / 2.0)

    feedback = LeaderFeedback(
        leader_name=clean_name,
        leader_id=leader_id,
        leader_type=leader_type or "POLITICAL",
        geo_unit_id=geo_unit_id,
        citizen_name=(citizen_name or "Anonymous").strip() or "Anonymous",
        rating=max(1, min(5, calculated_rating)),
        responsiveness_score=max(1, min(5, responsiveness_score)),
        transparency_score=max(1, min(5, transparency_score)),
        feedback_text=feedback_text.strip() if feedback_text else None,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


async def get_leader_feedbacks(
    db: AsyncSession,
    leader_name: Optional[str] = None,
    leader_id: Optional[int] = None,
) -> dict:
    """Retrieve all feedbacks for a politician/bureaucrat with dynamic score aggregations."""
    stmt = select(LeaderFeedback)
    conditions = []
    clean_name = (leader_name or "").strip()

    if clean_name:
        conditions.append(func.lower(LeaderFeedback.leader_name) == clean_name.lower())
    if leader_id:
        conditions.append(LeaderFeedback.leader_id == leader_id)

    if conditions:
        stmt = stmt.where(or_(*conditions))

    stmt = stmt.order_by(desc(LeaderFeedback.created_at))
    res = await db.execute(stmt)
    feedbacks = list(res.scalars().all())

    def calc_fb_rating(f):
        if f.responsiveness_score is not None and f.transparency_score is not None:
            return round((f.responsiveness_score + f.transparency_score) / 2.0, 1)
        return float(f.rating or 5.0)

    total_reviews = len(feedbacks)
    if total_reviews > 0:
        avg_rating = round(sum(calc_fb_rating(f) for f in feedbacks) / total_reviews, 1)
        avg_resp = round(sum(f.responsiveness_score for f in feedbacks) / total_reviews, 1)
        avg_trans = round(sum(f.transparency_score for f in feedbacks) / total_reviews, 1)
    else:
        avg_rating = 0.0
        avg_resp = 0.0
        avg_trans = 0.0

    return {
        "leader_name": clean_name or (f"Leader #{leader_id}" if leader_id else "All Leaders"),
        "average_rating": avg_rating,
        "total_reviews": total_reviews,
        "avg_responsiveness": avg_resp,
        "avg_transparency": avg_trans,
        "feedbacks": feedbacks,
    }


async def get_all_ratings_summary(db: AsyncSession) -> dict:
    """Return live ratings and review counts for all leaders in the database."""
    stmt = select(
        LeaderFeedback.leader_name,
        LeaderFeedback.leader_id,
        LeaderFeedback.rating,
        LeaderFeedback.responsiveness_score,
        LeaderFeedback.transparency_score,
    )
    res = await db.execute(stmt)
    rows = res.all()

    grouped_name = {}
    grouped_id = {}
    for r in rows:
        name_key = (r.leader_name or "").strip()
        name_lower = name_key.lower()
        id_key = str(r.leader_id) if r.leader_id else None

        resp = float(r.responsiveness_score if r.responsiveness_score is not None else 5)
        trans = float(r.transparency_score if r.transparency_score is not None else 5)
        rating = round((resp + trans) / 2.0, 1)

        for key in (name_key, name_lower):
            if key:
                grouped_name.setdefault(key, []).append((rating, resp, trans))
        if id_key:
            grouped_id.setdefault(id_key, []).append((rating, resp, trans))

    summary_map = {}
    def calc_stats(items):
        cnt = len(items)
        if cnt == 0:
            return {"average_rating": 0.0, "total_reviews": 0, "avg_responsiveness": 0.0, "avg_transparency": 0.0}
        return {
            "average_rating": round(sum(x[0] for x in items) / cnt, 1),
            "total_reviews": cnt,
            "avg_responsiveness": round(sum(x[1] for x in items) / cnt, 1),
            "avg_transparency": round(sum(x[2] for x in items) / cnt, 1),
        }

    for k, items in grouped_name.items():
        summary_map[k] = calc_stats(items)
    for k, items in grouped_id.items():
        summary_map[k] = calc_stats(items)

    return summary_map

