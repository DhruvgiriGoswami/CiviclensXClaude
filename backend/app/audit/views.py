"""JSON views over the AuditStore, shaped as in docs/API_CONTRACT.md. Return None for unknown ids."""

import csv
import io
import re
from collections import Counter

import pandas as pd

from app.audit.flags import amount_at_risk
from app.audit.scorecards import contractor_cards, scorecard, ward_card
from app.audit.trail import _norm, locality_index, match_locality

CSV_COLUMNS = ["flag_id", "rule", "severity", "wo_id", "complaint_ids", "ward_code", "road_id", "contractor_id",
               "amount_at_risk_inr", "reason"]


def _iso(t) -> str | None:
    return None if pd.isna(t) else pd.Timestamp(t).strftime("%Y-%m-%dT%H:%M")


def _failed_spend(wo) -> int:
    return int(wo.loc[wo.reopened, "cost_inr"].sum())


def overview(s) -> dict:
    return {
        "budget_inr": int(s.wards.monsoon_repair_budget_inr_2025.sum()),
        "spend_inr": int(s.wo.cost_inr.sum()),
        "failed_fix_spend_inr": _failed_spend(s.wo),
        "amount_at_risk_inr": amount_at_risk(s.flags),
        "flags_by_rule": dict(Counter(f["rule"] for f in s.flags)),
        "complaints": len(s.complaints),
        "issues": len(s.issues),
        "never_fixed_issues": int((s.issues.state == "never_fixed").sum()),
        "work_orders": len(s.wo),
    }


def ward_item(s, w) -> dict:
    wo = s.wo[s.wo.ward_code == w.ward_code]
    fl = [f for f in s.flags if f["ward_code"] == w.ward_code]
    spend, budget = int(wo.cost_inr.sum()), int(w.monsoon_repair_budget_inr_2025)
    failed = _failed_spend(wo)
    iss = s.issues[s.issues.ward_code == w.ward_code]
    return {
        "ward_code": w.ward_code, "ward_name": w.ward_name, "zone": w.zone, "budget_inr": budget, "spend_inr": spend,
        "spend_share": round(spend / budget, 3) if budget else 0.0,
        "failed_fix_spend_inr": failed, "failed_fix_share": round(failed / spend, 3) if spend else 0.0,
        "reopen_rate": round(float(wo.reopened.mean()), 3) if len(wo) else 0.0,
        "flag_count": len(fl), "amount_at_risk_inr": amount_at_risk(fl), "low_lying_index": float(w.low_lying_index),
        "open_issues": int((iss.actionable & iss.state.isin(["open", "never_fixed"])).sum()),
    }


def wards(s) -> list:
    return [ward_item(s, w) for w in s.wards.itertuples()]


def _ward_row(s, code):
    hit = s.wards[s.wards.ward_code == code]
    return next(hit.itertuples()) if len(hit) else None


def ward_detail(s, code: str) -> dict | None:
    w = _ward_row(s, code)
    if w is None:
        return None
    wo = s.wo[s.wo.ward_code == code]
    fl = [f for f in s.flags if f["ward_code"] == code]
    by_contractor = [{"contractor_id": cid, "contractor_name": g.contractor_name.iat[0], "spend_inr": int(g.cost_inr.sum()),
                      "jobs": len(g), "failed_fix_spend_inr": _failed_spend(g)} for cid, g in wo.groupby("contractor_id")]
    by_method = [{"repair_method": m, "spend_inr": int(g.cost_inr.sum()), "jobs": len(g),
                  "reopen_rate": round(float(g.reopened.mean()), 3)} for m, g in wo.groupby("repair_method")]
    by_month = [{"month": m, "spend_inr": int(g.cost_inr.sum()), "jobs": len(g)} for m, g in wo.groupby("month")]
    season = (s.rain.date >= wo.assigned_at.min().normalize()) & (s.rain.date <= wo.completed_at.max()) if len(wo) else s.rain.date.notna()
    rain_days = s.rain[season & s.rain.imd_category.isin(["Heavy", "Very heavy", "Extremely heavy"])].date.nunique()
    return {
        "ward": {**ward_item(s, w), "population_est": int(w.population_est), "engineering_crews": int(w.engineering_crews),
                 "localities": [x.strip() for x in str(w.localities).split(";") if x.strip()]},
        "money_trail": {"by_contractor": sorted(by_contractor, key=lambda x: -x["spend_inr"]),
                        "by_method": sorted(by_method, key=lambda x: -x["spend_inr"]), "by_month": by_month},
        "flags": fl,
        "scorecard": ward_card(s.wo, s.flags, code, w.ward_name),
        "contractors": contractor_cards(wo, fl, s.contractors),
        "context": {"heavy_rain_days": int(rain_days), "big_tide_days": int(s.tides[s.tides.big_tide_flag == "Y"].date.nunique()),
                    "flood_hotspots": int((s.hotspots.ward_code == code).sum()), "low_lying_index": float(w.low_lying_index)},
    }


def contractors(s) -> list:
    return contractor_cards(s.wo, s.flags, s.contractors)


def contractor(s, cid: str) -> dict | None:
    wo = s.wo[s.wo.contractor_id == cid]
    if wo.empty:
        return None
    fl = [f for f in s.flags if f["contractor_id"] == cid]
    card = scorecard(wo, fl, cid, wo.contractor_name.iat[0], "contractor")
    card["flags"] = fl  # contract: the detail view replaces the flag summary with the list
    card["flag_summary"] = {"total": len(fl), "by_rule": dict(Counter(f["rule"] for f in fl))}
    card["wards"] = [{"ward_code": w, "jobs": len(g), "spend_inr": int(g.cost_inr.sum())} for w, g in wo.groupby("ward_code")]
    return card


def flags(s, ward=None, rule=None, contractor=None, severity=None) -> dict:
    fl = [f for f in s.flags if (not ward or f["ward_code"] == ward) and (not rule or f["rule"] == rule)
          and (not contractor or f["contractor_id"] == contractor) and (not severity or f["severity"] == severity)]
    return {"count": len(fl), "flags": fl}


def flags_csv(s) -> str:
    buf = io.StringIO()
    w = csv.DictWriter(buf, CSV_COLUMNS, extrasaction="ignore")
    w.writeheader()
    for f in s.flags:
        w.writerow({**f, "complaint_ids": "|".join(f["complaint_ids"])})
    return buf.getvalue()


def complaint_points(s) -> dict:
    """Every complaint with GPS in the CSV, for the map. Compact rows: the card fetches the full trail on click."""
    c = s.complaints[s.complaints.lat.notna() & s.complaints.lon.notna()]
    state = c.issue_id.map(s.issues.set_index("issue_id").state)
    rows = [[i, round(float(a), 6), round(float(b), 6), w if isinstance(w, str) else None, st]
            for i, a, b, w, st in zip(c.complaint_id, c.lat, c.lon, c.ward_code, state)]
    return {"fields": ["complaint_id", "lat", "lon", "ward_code", "issue_state"], "rows": rows}


def social_posts(s, limit: int = 10, offset: int = 0) -> dict:
    """One page of the deduplicated social feed, newest first."""
    g = s.social_posts
    page = g.iloc[offset:offset + limit]
    items = [{
        "post_id": r.post_id,
        "posted_at": _iso(r.posted_at),
        "source": r.source,
        "platform": r.platform,
        "author_handle": r.author_handle.strip() if isinstance(r.author_handle, str) and r.author_handle.strip() else None,
        "text": r.text,
        "engagement": int(r.likes_or_forwards),
        "engagement_label": r.engagement_label,
        "shared_count": int(r.shared_count),
        "unverified": bool(r.unverified),
    } for r in page.itertuples()]
    end = offset + len(items)
    return {"total": len(g), "next_offset": end if end < len(g) else None, "items": items}


def complaint_tickets(s) -> list[dict]:
    """Every complaint with GPS, shaped like a sidebar ticket. The API adds unit_id from PostGIS."""
    c = s.complaints[s.complaints.lat.notna() & s.complaints.lon.notna()]
    state = c.issue_id.map(s.issues.set_index("issue_id").state)
    return [{
        "complaint_id": r.complaint_id,
        "lat": round(float(r.lat), 6),
        "lon": round(float(r.lon), 6),
        "ward_code": r.ward_code if isinstance(r.ward_code, str) else None,
        "issue_state": st if isinstance(st, str) else None,
        "category": r.category_clean,
        "description": r.description,
        "language": r.language,
        "locality": r.locality_text if isinstance(r.locality_text, str) else None,
        "status": r.status,
        "upvotes": int(r.upvotes) if r.upvotes == r.upvotes else 0,
        "received_at": _iso(r.received_at),
    } for r, st in zip(c.itertuples(), state)]


def complaint_trail(s, complaint_id: str) -> dict | None:
    hit = s.complaints[s.complaints.complaint_id == complaint_id]
    if hit.empty:
        return None
    c = hit.iloc[0]
    iss = s.issues[s.issues.issue_id == c.issue_id].iloc[0]
    wos = []
    for w in s.wo[s.wo.work_order_id.isin(iss.wo_ids)].itertuples():
        wos.append({
            "wo_id": w.work_order_id, "contractor_name": w.contractor_name, "repair_method": w.repair_method,
            "cost_inr": int(w.cost_inr), "assigned_at": _iso(w.assigned_at), "completed_at": _iso(w.completed_at),
            "sla_hours": int(w.sla_hours), "hours_taken": None if pd.isna(w.hours_taken) else round(float(w.hours_taken), 1),
            "sla_met_reported": w.sla_met == "Y", "sla_met_actual": None if w.sla_met_actual is None else w.sla_met_actual == "Y",
            "reopened_within_30d": bool(w.reopened), "under_dlp": w.under_dlp == "Y",
            "flags": [f for f in s.flags if f["wo_id"] == w.work_order_id],
        })
    out = {
        "complaint": {
            "complaint_id": c.complaint_id, "received_at": _iso(c.received_at), "channel": c.channel,
            "category_reported": c.category_reported, "category_clean": c.category_clean, "description": c.description,
            "language": c.language, "locality_text": c.locality_text, "ward_code": c.ward_code,
            "ward_code_inferred": bool(c.ward_code_inferred), "status": c.status,
        },
        "issue": {"issue_id": iss.issue_id, "complaint_ids": iss.complaint_ids, "duplicates": len(iss.complaint_ids) - 1,
                  "state": iss.state},
        "work_orders": wos,
    }
    out["summary"] = trail_summary(out)
    return out


def trail_summary(t: dict) -> str:
    c, iss, wos = t["complaint"], t["issue"], t["work_orders"]
    head = (f"Complaint {c['complaint_id']} ({c['category_clean'].lower()} at {c['locality_text']}, ward {c['ward_code']}) "
            f"is part of issue {iss['issue_id']} with {iss['duplicates']} other report{'s' if iss['duplicates'] != 1 else ''}.")
    if not wos:
        return f"{head} No work order is linked yet. Current status: {c['status']}."
    w = wos[-1]
    sla = "met" if w["sla_met_actual"] or (w["sla_met_actual"] is None and w["sla_met_reported"]) else "missed"
    held = "failed within 30 days and was reopened" if w["reopened_within_30d"] else "has held so far"
    flag_note = f" Audit notes on this job: {'; '.join(f['reason'] for f in w['flags'])}" if w["flags"] else ""
    return (f"{head} {w['contractor_name']} fixed it under {w['wo_id']} using {w['repair_method']} for Rs {w['cost_inr']:,}, "
            f"completed {w['completed_at']}. The {w['sla_hours']} h SLA was {sla} and the repair {held}.{flag_note}")


def search(s, q: str) -> dict:
    q = (q or "").strip()
    if not q:
        return {"results": []}
    ql, res = q.lower(), []
    for m in re.findall(r"BMC25-\d{6}", q.upper()):
        res += [{"type": "complaint", "id": m, "label": f"Complaint {m}", "ward_code": w}
                for w in s.complaints.loc[s.complaints.complaint_id == m, "ward_code"]]
    for m in re.findall(r"WO25-\d{5}", q.upper()):
        res += [{"type": "work_order", "id": m, "label": f"Work order {m}", "ward_code": w}
                for w in s.wo.loc[s.wo.work_order_id == m, "ward_code"]]
    if not res and len(ql) >= 2:
        res += [{"type": "complaint", "id": x, "label": f"Complaint {x}", "ward_code": w}
                for x, w in s.complaints.loc[s.complaints.complaint_id.str.lower().str.contains(ql, regex=False),
                                             ["complaint_id", "ward_code"]].head(5).itertuples(index=False)]
        res += [{"type": "work_order", "id": x, "label": f"Work order {x}", "ward_code": w}
                for x, w in s.wo.loc[s.wo.work_order_id.str.lower().str.contains(ql, regex=False),
                                     ["work_order_id", "ward_code"]].head(5).itertuples(index=False)]
        for r in s.roads[s.roads.road_name.str.lower().str.contains(ql, regex=False)].itertuples():
            res.append({"type": "road", "id": r.road_id, "label": f"{r.road_name} (segment {r.segment_no})", "ward_code": r.ward_code})
        loc = match_locality(q, locality_index(s.localities))
        wards = {loc[0]} if loc else set()
        wards |= set(s.wards.loc[s.wards.ward_code.str.lower() == ql, "ward_code"])
        wards |= {w.ward_code for w in s.wards.itertuples() if ql in _norm(w.localities) or ql in _norm(w.ward_name)}
        for code in sorted(wards):
            name = s.wards.set_index("ward_code").ward_name[code]
            res.insert(0, {"type": "ward", "id": code, "label": f"Ward {code}: {name}" + (f" ({loc[3]})" if loc and loc[0] == code else ""),
                           "ward_code": code})
    return {"results": res[:10]}
