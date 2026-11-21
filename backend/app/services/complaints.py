"""Complaint service — creation with auto geo-resolution, listing, updates."""

import asyncio
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.complaints import Complaint, ComplaintMedia
from app.services.geography import get_smallest_containing_unit
from app.core.logging_config import logger


async def create_complaint(
    db: AsyncSession,
    title: str,
    description: Optional[str],
    category: str,
    latitude: float,
    longitude: float,
    priority: Optional[str] = None,
    location_accuracy_m: Optional[float] = None,
    address_text: Optional[str] = None,
) -> Complaint:
    """
    Create a new complaint. Automatically resolves the GPS coordinates
    to the smallest containing geo unit via PostGIS.
    """
    # Auto-resolve geographic unit from coordinates
    resolved_unit_id = await get_smallest_containing_unit(db, latitude, longitude)

    # No login exists yet, so complaints are anonymous; a client-sent user_id can't be trusted.
    complaint = Complaint(
        user_id=None,
        title=title,
        description=description,
        category=category,
        status="OPEN",
        priority=priority or "MEDIUM",
        latitude=latitude,
        longitude=longitude,
        location_accuracy_m=location_accuracy_m,
        address_text=address_text,
        resolved_geo_unit_id=resolved_unit_id,
    )
    db.add(complaint)
    await db.flush()
    logger.info(
        "Complaint created: id=%s, category=%s, priority=%s, geo_unit=%s",
        complaint.complaint_id,
        complaint.category,
        complaint.priority,
        complaint.resolved_geo_unit_id,
    )
    return complaint


async def get_complaint(db: AsyncSession, complaint_id: int) -> Optional[Complaint]:
    """Return a single complaint with its media."""
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.media_links).selectinload(ComplaintMedia.media))
        .where(Complaint.complaint_id == complaint_id)
    )
    return result.scalar_one_or_none()


async def get_matching_geo_unit_filter(db: AsyncSession, geo_unit_id: str):
    """
    Build an SQLAlchemy filter clause matching a target geo_unit_id and all its descendant units
    (e.g., IN-MH-PUNE district matching IN-MH-PMC-WARD-14, IN-MH-PCMC-WARD-01, etc.).
    """
    from app.models.geography import GeoUnit
    from sqlalchemy import or_

    prefixes = [geo_unit_id]

    # 1. Fetch direct children from geo_units where parent_unit_id == geo_unit_id
    res_child = await db.execute(select(GeoUnit.unit_id).where(GeoUnit.parent_unit_id == geo_unit_id))
    children = res_child.scalars().all()
    prefixes.extend(children)

    # 2. Handle District codes or alternate District IDs (e.g. IN-MH-PUNE vs IN-MH-DIST-PUNE)
    code = geo_unit_id.replace("IN-MH-DIST-", "").replace("IN-MH-", "").replace("IN-DIST-", "").replace("IN-", "")
    # Mumbai City and Mumbai Suburban districts (IN-MH-DIST-MUMBAI_CITY, -SUB_URBAN_MUMBAI, ...) are both BMC, stored under IN-MH-MUMBAI.
    # shortcut: either district shows every BMC complaint; split them once BMC wards carry their district.
    if "MUMBAI" in code.upper() and "-WARD-" not in geo_unit_id:
        code = "MUMBAI"
    if code and len(code) >= 3:
        res_code = await db.execute(
            select(GeoUnit.unit_id).where(
                or_(
                    GeoUnit.unit_id == f"IN-MH-{code}",
                    GeoUnit.unit_id == f"IN-MH-DIST-{code}",
                    GeoUnit.parent_unit_id == f"IN-MH-{code}",
                    GeoUnit.parent_unit_id == f"IN-MH-DIST-{code}",
                    GeoUnit.district_code == code,
                )
            )
        )
        for cid in res_code.scalars().all():
            if cid not in prefixes:
                prefixes.append(cid)

    # Return OR condition across all resolved prefixes
    return or_(*[Complaint.resolved_geo_unit_id.like(f"{p}%") for p in prefixes])


async def list_complaints(
    db: AsyncSession,
    geo_unit_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[Complaint], int]:
    """Return filtered complaints with total count."""
    from sqlalchemy import or_

    query = select(Complaint).options(
        selectinload(Complaint.media_links).selectinload(ComplaintMedia.media)
    )
    count_query = select(func.count(Complaint.complaint_id))

    if geo_unit_id:
        geo_filter = await get_matching_geo_unit_filter(db, geo_unit_id)
        query = query.where(geo_filter)
        count_query = count_query.where(geo_filter)
    if category:
        query = query.where(Complaint.category == category)
        count_query = count_query.where(Complaint.category == category)
    if status:
        query = query.where(Complaint.status == status)
        count_query = count_query.where(Complaint.status == status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        s_filter = or_(
            Complaint.title.ilike(term),
            Complaint.description.ilike(term),
            Complaint.category.ilike(term),
            Complaint.address_text.ilike(term),
            Complaint.resolved_geo_unit_id.ilike(term),
        )
        clean_num = search.strip().upper().replace("CL-", "").replace("TKT-", "")
        if clean_num.isdigit():
            s_filter = or_(s_filter, Complaint.complaint_id == int(clean_num))

        query = query.where(s_filter)
        count_query = count_query.where(s_filter)

    total = await db.scalar(count_query) or 0

    if sort_by == "created_at_asc":
        query = query.order_by(Complaint.created_at.asc())
    elif sort_by == "status":
        query = query.order_by(Complaint.status.asc(), Complaint.created_at.desc())
    elif sort_by == "category":
        query = query.order_by(Complaint.category.asc(), Complaint.created_at.desc())
    elif sort_by == "priority":
        query = query.order_by(Complaint.priority.desc().nullslast(), Complaint.created_at.desc())
    else:
        query = query.order_by(Complaint.created_at.desc())

    result = await db.execute(query.offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def get_complaint_stats(
    db: AsyncSession,
    geo_unit_id: Optional[str] = None,
) -> dict:
    """Return aggregate statistics for complaints."""
    query = select(Complaint.status, func.count(Complaint.complaint_id))
    if geo_unit_id:
        geo_filter = await get_matching_geo_unit_filter(db, geo_unit_id)
        query = query.where(geo_filter)
    query = query.group_by(Complaint.status)
    result = await db.execute(query)
    rows = result.all()

    stats = {
        "total": 0,
        "open": 0,
        "in_progress": 0,
        "resolved": 0,
        "closed": 0,
        "by_status": {}
    }
    for status_str, count in rows:
        stats["total"] += count
        st_lower = (status_str or "").lower()
        stats["by_status"][status_str] = count
        if st_lower == "open":
            stats["open"] += count
        elif st_lower in ("in_progress", "in progress", "active"):
            stats["in_progress"] += count
        elif st_lower == "resolved":
            stats["resolved"] += count
        elif st_lower == "closed":
            stats["closed"] += count

    cat_query = select(Complaint.category, func.count(Complaint.complaint_id))
    if geo_unit_id:
        geo_filter = await get_matching_geo_unit_filter(db, geo_unit_id)
        cat_query = cat_query.where(geo_filter)
    cat_query = cat_query.group_by(Complaint.category)
    cat_result = await db.execute(cat_query)
    stats["by_category"] = {cat: count for cat, count in cat_result.all() if cat}

    return stats


async def get_counts_by_child(db: AsyncSession, parent_geo_unit_id: str) -> dict:
    """Complaint counts per child unit of a parent, grouped by resolved_geo_unit_id (for the map choropleth)."""
    from app.models.geography import GeoUnit

    # shortcut: counts only complaints resolved directly to a child unit, add a descendant roll-up if a level needs it
    result = await db.execute(
        select(Complaint.resolved_geo_unit_id, func.count(Complaint.complaint_id))
        .join(GeoUnit, GeoUnit.unit_id == Complaint.resolved_geo_unit_id)
        .where(GeoUnit.parent_unit_id == parent_geo_unit_id)
        .group_by(Complaint.resolved_geo_unit_id)
    )
    return {unit_id: count for unit_id, count in result.all()}


async def get_categories(db: AsyncSession) -> List[str]:
    """Return distinct categories present in complaints."""
    result = await db.execute(select(Complaint.category).distinct().where(Complaint.category.isnot(None)))
    cats = [r for r in result.scalars().all() if r]
    return sorted(cats)


async def upvote_complaint(db: AsyncSession, complaint_id: int) -> Optional[Complaint]:
    """Atomically increment upvotes on a complaint and return the updated complaint."""
    # Single UPDATE so concurrent upvotes can't overwrite each other (read-add-write lost updates).
    result = await db.execute(
        update(Complaint)
        .where(Complaint.complaint_id == complaint_id)
        .values(upvotes=func.coalesce(Complaint.upvotes, 0) + 1, updated_at=datetime.utcnow())
        .returning(Complaint.complaint_id)
    )
    if result.scalar_one_or_none() is None:
        return None
    await db.commit()
    complaint = await get_complaint(db, complaint_id)
    logger.info("Complaint #%s upvoted (new count=%s)", complaint_id, complaint.upvotes)
    return complaint


async def attach_media(
    db: AsyncSession, complaint_id: int, media_id: int
) -> ComplaintMedia:
    """Link a media asset to a complaint."""
    link = ComplaintMedia(complaint_id=complaint_id, media_id=media_id)
    db.add(link)
    await db.flush()
    return link


async def delete_complaint(db: AsyncSession, complaint_id: int) -> bool:
    """
    Permanently delete a complaint, associated media records, and S3 objects.
    """
    from pathlib import Path
    from app.services.media import delete_s3_media

    complaint = await get_complaint(db, complaint_id)
    if not complaint:
        return False

    # 1. Clean up attached media and S3 objects
    if complaint.media_links:
        for link in list(complaint.media_links):
            media = link.media
            if media and media.storage_url:
                filename = Path(media.storage_url).name
                await asyncio.to_thread(delete_s3_media, complaint_id, filename)
            await db.delete(link)
            if media:
                await db.delete(media)

    # 2. Delete complaint record
    await db.delete(complaint)
    await db.commit()
    logger.info("Complaint permanently deleted: id=%s", complaint_id)
    return True


async def purge_test_complaints(db: AsyncSession, purge_all: bool = False) -> int:
    """
    Purge legacy static demo seed tickets, test complaints, or all complaints from the database.
    Removes database rows and cascades removal of associated AWS S3 media objects.
    """
    from sqlalchemy import or_
    from pathlib import Path
    from app.services.media import delete_s3_media

    # Match test tickets or all tickets if purge_all is True
    stmt = (
        select(Complaint)
        .options(
            selectinload(Complaint.media_links).selectinload(ComplaintMedia.media)
        )
    )
    if not purge_all:
        stmt = stmt.where(
            or_(
                Complaint.complaint_id < 17,
                Complaint.title.ilike("%test%"),
                Complaint.description.ilike("%takeout spot%"),
                Complaint.description.ilike("%xgen%"),
                Complaint.description.ilike("%gilgamesh%"),
                Complaint.description.ilike("%potholes near main intersection%"),
            )
        )

    result = await db.execute(stmt)
    test_complaints = result.scalars().all()
    count = 0

    for complaint in test_complaints:
        cid = complaint.complaint_id
        if complaint.media_links:
            for link in list(complaint.media_links):
                media = link.media
                if media and media.storage_url:
                    filename = Path(media.storage_url).name
                    await asyncio.to_thread(delete_s3_media, cid, filename)
                await db.delete(link)
                if media:
                    await db.delete(media)
        await db.delete(complaint)
        count += 1

    await db.commit()
    logger.info("Purged %s test/static complaints from database", count)
    return count


