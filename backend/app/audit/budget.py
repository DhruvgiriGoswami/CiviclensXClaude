"""Next rupee planner: rank open risk in a ward and fund it greedily by risk per rupee."""

import pandas as pd
from shapely.geometry import LineString, Point

from app.audit.flags import REPEAT_REOPENS
from app.audit.trail import NOT_ROAD

# Each part is scaled to its weight, so risk_score is their sum and stays between 0 and 1.
WEIGHTS = {"severity": 0.30, "flood": 0.20, "rain_tide": 0.10, "traffic": 0.15, "accidents": 0.15, "facilities": 0.10}
SEVERITY = {"Road cave-in": 1.0, "Open or broken manhole": 0.9, "Waterlogging": 0.7, "Pothole": 0.6,
            "Choked drain / nullah overflow": 0.5, "Broken paver blocks": 0.35}
ROAD_CAUSES = {"Pothole", "Waterlogged road", "Uneven road / open chamber"}
HOTSPOT_METRES = 500
MIN_METHOD_JOBS = 20
REPEAT_CANDIDATE = REPEAT_REOPENS - 1  # one fewer than the flag rule: worth fixing properly before it becomes a pattern


def method_table(wo: pd.DataFrame) -> dict:
    """Per work type, the method whose fixes reopened least, with its cost from the rate card x median area."""
    out = {}
    for wt, g in wo.groupby("work_type"):
        stats = g.groupby("repair_method").agg(n=("reopened", "size"), reopen=("reopened", "mean"),
                                               area=("area_sqm", "median"), unit=("unit", "first"),
                                               rate=("standard_rate_inr", "first"))
        stats = stats[stats.n >= MIN_METHOD_JOBS] if (stats.n >= MIN_METHOD_JOBS).any() else stats
        best = stats.sort_values(["reopen", "rate"]).iloc[0]
        cost = best.rate * best.area if best.unit == "per sqm" else best.rate
        out[wt] = {"method": best.name, "reopen_rate": round(float(best.reopen), 3), "cost": int(round(cost))}
    return out


def _metres_to_road(road, lat, lon) -> float:
    line = LineString([(road.start_lon, road.start_lat), (road.end_lon, road.end_lat)])
    return line.distance(Point(lon, lat)) * 111_000


def risk(road, category: str, store, low_lying: float) -> tuple[dict, list]:
    why = []
    near = [h for h in store.hotspots.itertuples() if _metres_to_road(road, h.lat, h.lon) <= HOTSPOT_METRES]
    flood = max((0.5 + 0.5 * min(h.years_flagged_last_5, 5) / 5 for h in near), default=0.0)
    if near:
        why.append(f"near flood spot {near[0].name}")
    tide = any(h.tide_sensitive == "Y" for h in near)
    t = store.traffic[store.traffic.road_id == road.road_id]
    congestion = float(t.congestion_index_0_10.iat[0]) / 10 if len(t) else 0.0
    if congestion >= 0.7:
        why.append(f"congestion {congestion * 10:.1f}/10")
    acc = store.accidents[(store.accidents.road_id == road.road_id) & store.accidents.probable_cause.isin(ROAD_CAUSES)]
    if len(acc):
        why.append(f"{len(acc)} road-defect accident{'s' if len(acc) > 1 else ''}")
    fac = store.facilities[store.facilities.ambulance_entry_road == road.road_id]
    hospitals, schools = (fac.type == "Hospital").sum(), (fac.type == "School").sum()
    if hospitals:
        why.append(f"ambulance route to {fac[fac.type == 'Hospital'].name.iat[0]}")
    elif schools:
        why.append(f"access road for {schools} school{'s' if schools > 1 else ''}")
    raw = {
        "severity": SEVERITY.get(category, 0.3),
        "flood": flood,
        "rain_tide": 0.5 * low_lying + 0.5 * tide,
        "traffic": 0.7 * congestion + 0.3 * (road.bus_route == "Y"),
        "accidents": min(1.0, len(acc) / 3),
        "facilities": min(1.0, 0.6 * hospitals + 0.3 * schools),
    }
    return {k: round(WEIGHTS[k] * v, 3) for k, v in raw.items()}, why


def candidates(store, code: str) -> pd.DataFrame:
    iss = store.issues
    open_ = iss[(iss.ward_code == code) & iss.actionable & iss.state.isin(["open", "never_fixed"]) & (iss.category != NOT_ROAD)]
    rows = [{"road_id": r, "work_type": wt, "issue_ids": list(g.issue_id), "repeat": False}
            for (r, wt), g in open_.groupby(["road_id", "category"])]
    wo = store.wo[store.wo.ward_code == code]
    for (r, wt), g in wo.groupby(["road_id", "work_type"]):
        g = g.sort_values("completed_at")
        if g.reopened.sum() >= REPEAT_CANDIDATE and g.reopened.iat[-1]:
            ids = list(iss[iss.wo_ids.map(lambda w: bool(set(w) & set(g.work_order_id)))].issue_id)
            hit = next((x for x in rows if x["road_id"] == r and x["work_type"] == wt), None)
            if hit:
                hit["repeat"] = True
                hit["issue_ids"] += ids
            else:
                rows.append({"road_id": r, "work_type": wt, "issue_ids": ids, "repeat": True})
    return pd.DataFrame(rows, columns=["road_id", "work_type", "issue_ids", "repeat"])


def allocate(items: list, remaining: int) -> list:
    """Fund greedily by risk per rupee (DLP items cost BMC nothing, so they always fit), then rank by risk
    so the list reads as "what matters most" with the funded flag showing what the money covers."""
    left = max(remaining, 0)
    for it in sorted(items, key=lambda x: (x["est_cost_inr"] > 0, -x["risk_score"] / max(x["est_cost_inr"], 1))):
        it["funded"] = it["est_cost_inr"] <= left
        if it["funded"]:
            left -= it["est_cost_inr"]
    order = sorted(items, key=lambda x: (-x["risk_score"], x["est_cost_inr"]))
    for rank, it in enumerate(order, 1):
        it["rank"] = rank
    return order


def plan(store, code: str) -> dict:
    ward = store.wards.set_index("ward_code").loc[code]
    spent = int(store.wo.loc[store.wo.ward_code == code, "cost_inr"].sum())
    budget = int(ward.monsoon_repair_budget_inr_2025)
    remaining = budget - spent
    methods = method_table(store.wo)
    roads = {r.road_id: r for r in store.roads.itertuples()}
    items = []
    for c in candidates(store, code).itertuples():
        road, m = roads.get(c.road_id), methods.get(c.work_type)
        if road is None or m is None:
            continue
        parts, why = risk(road, c.work_type, store, float(ward.low_lying_index))
        dlp = road.under_dlp == "Y"
        lead = f"{len(c.issue_ids)} open issue{'s' if len(c.issue_ids) != 1 else ''}" if not c.repeat else "fixes keep failing here"
        items.append({
            "road_id": c.road_id, "road_name": road.road_name, "issue_ids": c.issue_ids, "work_type": c.work_type,
            "method": m["method"], "method_reopen_rate": m["reopen_rate"],
            "est_cost_inr": 0 if dlp else m["cost"], "funded": False,
            "pay_from": "dlp_contractor" if dlp else "bmc",
            "risk_score": round(sum(parts.values()), 3), "risk_parts": parts,
            "why": "; ".join([f"{c.work_type} on {road.road_name}: {lead}"] + why
                             + [f"{m['method']} reopens {m['reopen_rate']:.0%} of the time, the best for this work"]
                             + (["road is under DLP so the original contractor pays"] if dlp else [])) + ".",
        })
    ordered = allocate(items, remaining)
    note = None
    if remaining <= 0:
        note = (f"The ward has already spent Rs {spent:,} against a budget of Rs {budget:,}, so there is no BMC money left. "
                "Only DLP repairs, which the original contractor pays for, can go ahead without a top-up.")
    return {"ward_code": code, "budget_inr": budget, "spent_inr": spent, "remaining_inr": remaining,
            "plan": ordered, "unfunded_count": sum(not x["funded"] for x in ordered), "note": note}
