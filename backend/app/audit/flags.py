"""Audit rules. One function per rule, each returns a list of Flag dicts (see docs/API_CONTRACT.md).

Thresholds come from the real distributions, see THRESHOLDS.md and `python -m app.audit.report`.
"""

import pandas as pd

# Every normal job in the data sits between 0.75x and 1.30x of the rate card. The next value up is 1.32x
# (a duplicate copy of a 1.28x job), then 1.35x. 1.33x sits in that empty gap.
OVERBILL_RATIO = 1.33
OVERBILL_HIGH = 1.5
NORMAL_RANGE = "0.75x to 1.30x"
AREA_IQR_K = 3  # Tukey far-out fence per method
DOUBLE_BILL_DAYS = 7
SURFACE_WORK = {"Pothole", "Broken paver blocks", "Road cave-in"}
SLA_GROSS = 3.0  # half of all jobs miss the SLA, so only a miss of more than three times the target is flagged
REPEAT_REOPENS = 4  # same road and work type reopened this many times in one season
EARLY_ASSIGN_HOURS = 48
LATE_REPORT_HOURS = 72

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def _flag(rule, sev, w, reason, evidence, amount, prefix, complaint_ids=None):
    return {
        "flag_id": f"{prefix}-{w.work_order_id}",
        "rule": rule,
        "severity": sev,
        "wo_id": w.work_order_id,
        "complaint_ids": list(w.links) if complaint_ids is None else complaint_ids,
        "ward_code": w.ward_code,
        "road_id": w.road_id,
        "contractor_id": w.contractor_id,
        "reason": reason,
        "evidence": evidence,
        "amount_at_risk_inr": int(max(amount, 0)),
    }


def overbilling(wo: pd.DataFrame) -> list:
    out = []
    for w in wo[wo.ratio > OVERBILL_RATIO].itertuples():
        basis = f"{w.area_sqm} sqm at Rs {w.standard_rate_inr}" if w.unit == "per sqm" else f"Rs {w.standard_rate_inr} per job"
        out.append(_flag(
            "overbilling", "high" if w.ratio >= OVERBILL_HIGH else "medium", w,
            f"Billed {w.ratio:.2f}x the rate card for {w.repair_method} ({basis}). Normal jobs fall in the {NORMAL_RANGE} range.",
            {"cost_inr": int(w.cost_inr), "expected_inr": int(w.expected_inr), "ratio": round(w.ratio, 2), "related_wo_ids": []},
            w.cost_inr - w.expected_inr, "OVERBILL"))
    return out


def area_outlier(wo: pd.DataFrame) -> list:
    out = []
    for method, g in wo[wo.unit == "per sqm"].groupby("repair_method"):
        q1, q3 = g.area_sqm.quantile([0.25, 0.75])
        hi = q3 + AREA_IQR_K * (q3 - q1)
        for w in g[(g.area_sqm > hi) | (g.area_sqm <= 0)].itertuples():
            out.append(_flag(
                "area_outlier", "medium", w,
                f"Area of {w.area_sqm} sqm is outside the plausible range for {method} (0 to {hi:.1f} sqm).",
                {"area_sqm": w.area_sqm, "max_plausible_sqm": round(hi, 1), "cost_inr": int(w.cost_inr), "related_wo_ids": []},
                w.cost_inr - hi * w.standard_rate_inr, "AREA"))
    return out


def double_billing(wo: pd.DataFrame) -> list:
    """A job with no linked complaint that repeats an earlier job on the same road with the same method within days."""
    later = wo[wo.links.str.len() == 0]
    pairs = later.merge(wo, on=["road_id", "repair_method"], suffixes=("", "_orig"))
    pairs["gap"] = (pairs.assigned_at - pairs.assigned_at_orig).dt.total_seconds() / 86400
    pairs = pairs[(pairs.gap > 0) & (pairs.gap <= DOUBLE_BILL_DAYS)]
    out = []
    for w in pairs.sort_values("gap").drop_duplicates("work_order_id").itertuples():
        same = w.contractor_id == w.contractor_id_orig and w.area_sqm == w.area_sqm_orig
        out.append(_flag(
            "double_billing", "high" if same else "medium", w,
            f"Same road and method ({w.repair_method}) as {w.work_order_id_orig}, billed again {w.gap:.0f} days later"
            f"{' with the same contractor and area' if same else ''}, and no complaint is linked."
            f" Repeat jobs within {DOUBLE_BILL_DAYS} days without a complaint are not normal.",
            {"cost_inr": int(w.cost_inr), "original_cost_inr": int(w.cost_inr_orig), "days_apart": round(w.gap, 1),
             "related_wo_ids": [w.work_order_id_orig]},
            w.cost_inr, "DOUBLE"))
    return out


def dlp_paid(wo: pd.DataFrame) -> list:
    hit = wo[(wo.under_dlp == "Y") & (wo.cost_inr > 0) & (wo.completed_at >= wo.last_resurfaced)]
    out = []
    for w in hit.itertuples():
        surface = w.work_type in SURFACE_WORK
        why = ("The original contractor should have fixed it at no cost to BMC."
               if surface else "Repairs here are the original contractor's job at no cost to BMC; check whether this drainage work was in that contract.")
        out.append(_flag(
            "dlp_paid", "high" if surface else "medium", w,
            f"Road {w.road_id} is under its Defect Liability Period (resurfaced {w.last_resurfaced:%Y-%m-%d}) "
            f"but BMC paid Rs {w.cost_inr:,} for {w.work_type.lower()}. {why}",
            {"cost_inr": int(w.cost_inr), "last_resurfaced": f"{w.last_resurfaced:%Y-%m-%d}", "related_wo_ids": []},
            w.cost_inr, "DLP"))
    return out


def sla_misreported(wo: pd.DataFrame) -> list:
    hit = wo[(wo.sla_met == "Y") & (wo.sla_met_actual == "N")]
    return [_flag(
        "sla_misreported", "medium", w,
        f"Marked as SLA met, but it took {w.hours_taken:.0f} h from the first complaint against a {w.sla_hours} h target.",
        {"hours_taken": round(w.hours_taken, 1), "sla_hours": int(w.sla_hours), "related_wo_ids": []}, 0, "SLAREP")
        for w in hit.itertuples()]


def sla_missed(wo: pd.DataFrame) -> list:
    hit = wo[wo.hours_taken > SLA_GROSS * wo.sla_hours]
    return [_flag(
        "sla_missed", "low", w,
        f"Took {w.hours_taken:.0f} h from the first complaint against a {w.sla_hours} h target, more than {SLA_GROSS:.0f}x the SLA"
        f"{' (heavy rain or a big tide that week)' if w.rain_context else ''}.",
        {"hours_taken": round(w.hours_taken, 1), "sla_hours": int(w.sla_hours), "rain_context": bool(w.rain_context),
         "related_wo_ids": []}, 0, "SLAMISS")
        for w in hit.itertuples()]


def timeline_impossible(wo: pd.DataFrame) -> list:
    early = (wo.first_received_at - wo.assigned_at).dt.total_seconds() / 3600
    checks = [
        (wo.work_started_at < wo.assigned_at, "work started before it was assigned"),
        (wo.completed_at < wo.work_started_at, "work completed before it started"),
        (wo.completed_at < wo.first_received_at, "work completed before the first complaint arrived"),
        (early > EARLY_ASSIGN_HOURS, f"assigned more than {EARLY_ASSIGN_HOURS} h before the first linked complaint"),
    ]
    out = []
    for mask, what in checks:
        for w in wo[mask.fillna(False)].itertuples():
            out.append(_flag("timeline_impossible", "medium", w, f"Timeline does not add up: {what}.",
                             {"assigned_at": f"{w.assigned_at:%Y-%m-%dT%H:%M}", "completed_at": f"{w.completed_at:%Y-%m-%dT%H:%M}",
                              "related_wo_ids": []}, 0, "TIME"))
    return list({f["flag_id"]: f for f in out}.values())


def repeat_failure(wo: pd.DataFrame) -> list:
    out = []
    for (road, wt), g in wo[wo.reopened].groupby(["road_id", "work_type"]):
        if len(g) < REPEAT_REOPENS:
            continue
        g = g.sort_values("completed_at")
        row = next(g.tail(1).itertuples())
        out.append(_flag(
            "repeat_failure", "medium", row,
            f"{wt} fixes on {road} failed within 30 days {len(g)} times this season ({REPEAT_REOPENS} or more is a pattern, "
            f"not bad luck). A longer-lasting method may be needed.",
            {"reopened_jobs": len(g), "failed_fix_spend_inr": int(g.cost_inr.sum()), "related_wo_ids": list(g.work_order_id)},
            0, "REPEAT"))
    return out


def resolved_without_work(complaints: pd.DataFrame, wo: pd.DataFrame) -> list:
    """Complaint closed as Resolved against a job that finished days before the citizen even reported it."""
    by_cid = {cid: w for w in wo.itertuples() for cid in w.links}
    out = []
    for c in complaints[complaints.status == "Resolved"].itertuples():
        w = by_cid.get(c.complaint_id)
        if w is None:
            out.append({**_flag("resolved_without_work", "medium", _Blank(c), "Marked Resolved but no work order is linked.",
                                {"related_wo_ids": []}, 0, "NOWORK", [c.complaint_id]), "wo_id": None})
            continue
        gap = (c.received_at - w.completed_at).total_seconds() / 3600
        if gap > LATE_REPORT_HOURS:
            f = _flag("resolved_without_work", "low", w,
                      f"Complaint {c.complaint_id} came in {gap / 24:.0f} days after {w.work_order_id} was completed, "
                      f"yet it was closed as Resolved with no new work. The problem may have come back.",
                      {"received_at": f"{c.received_at:%Y-%m-%dT%H:%M}", "completed_at": f"{w.completed_at:%Y-%m-%dT%H:%M}",
                       "related_wo_ids": [w.work_order_id]}, 0, "NOWORK", [c.complaint_id])
            f["flag_id"] = f"NOWORK-{c.complaint_id}"
            f["wo_id"] = None
            out.append(f)
    return out


class _Blank:
    def __init__(self, c):
        self.work_order_id, self.links = c.complaint_id, [c.complaint_id]
        self.ward_code, self.road_id, self.contractor_id = c.ward_code, None, None


def sort_flags(flags: list) -> list:
    return sorted(flags, key=lambda f: (SEVERITY_ORDER[f["severity"]], -f["amount_at_risk_inr"], f["flag_id"]))


def all_flags(store) -> list:
    wo = store.wo
    flags = (overbilling(wo) + area_outlier(wo) + double_billing(wo) + dlp_paid(wo) + sla_misreported(wo)
             + sla_missed(wo) + timeline_impossible(wo) + repeat_failure(wo) + resolved_without_work(store.complaints, wo))
    return sort_flags(flags)


def amount_at_risk(flags: list) -> int:
    """Rupees at risk without double counting a work order caught by two rules."""
    per_wo = {}
    for f in flags:
        key = f["wo_id"] or f["flag_id"]
        per_wo[key] = max(per_wo.get(key, 0), f["amount_at_risk_inr"])
    return int(sum(per_wo.values()))
