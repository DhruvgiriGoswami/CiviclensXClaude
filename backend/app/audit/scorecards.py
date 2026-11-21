"""Fair scorecards by indirect standardisation.

Each job's expected SLA and reopen rate is the city-wide rate of its peers in the same stratum:
repair method x bad weather within a week after completion x low-lying ward. An entity's expected
rate is the mean over its own jobs, so a contractor working in flood-prone wards in a wet week is
compared with others who faced the same conditions. Rates only, never counts.
"""

import math
from collections import Counter

import pandas as pd

from app.audit.flags import amount_at_risk

STRATUM = ["repair_method", "rain_context", "low_lying"]
MIN_JOBS = 15
BILL_FLAG_SHARE = 0.10  # city-wide, about 6% of jobs carry a billing flag; above 10% is worth a conversation
Z = 1.96


def wilson(k: int, n: int) -> tuple[float, float]:
    if n == 0:
        return 0.0, 1.0
    p = k / n
    centre = (p + Z * Z / (2 * n)) / (1 + Z * Z / n)
    half = Z * math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n)) / (1 + Z * Z / n)
    return max(0.0, centre - half), min(1.0, centre + half)


def with_expected(wo: pd.DataFrame) -> pd.DataFrame:
    g = wo.groupby(STRATUM)
    return wo.assign(exp_sla=g.sla_ok.transform("mean"), exp_reopen=g.reopened.transform("mean"))


def rate(obs: pd.Series, exp: pd.Series) -> dict:
    n, k = len(obs), int(obs.sum())
    lo, hi = wilson(k, n)
    return {"observed": round(k / n, 3) if n else 0.0, "expected": round(float(exp.mean()), 3) if n else 0.0,
            "ci_low": round(lo, 3), "ci_high": round(hi, 3), "n": n, "judgeable": n >= MIN_JOBS}


def _compare(r: dict, good_high: bool) -> str:
    """Plain words for observed vs expected. Only says better or worse when the 95% interval excludes the peer rate."""
    if not r["judgeable"]:
        return "too few jobs to judge"
    if r["ci_low"] > r["expected"]:
        return "better than peers" if good_high else "worse than peers"
    if r["ci_high"] < r["expected"]:
        return "worse than peers" if good_high else "better than peers"
    return "in line with peers"


def verdict(name: str, jobs: int, sla: dict, reopen: dict, cost_ratio: float, by_rule: dict) -> str:
    speed, durability = _compare(sla, True), _compare(reopen, False)
    text = (f"{name} handled {jobs} jobs. Speed: {sla['observed']:.0%} met the SLA against {sla['expected']:.0%} expected "
            f"for the same methods, weather and ward conditions ({speed}). Durability: {reopen['observed']:.0%} of fixes "
            f"reopened within 30 days against {reopen['expected']:.0%} expected ({durability}). Cost: the median job was "
            f"billed at {cost_ratio:.2f}x the rate card.")
    bill_share = (by_rule.get("overbilling", 0) + by_rule.get("double_billing", 0)) / max(jobs, 1)
    if bill_share > BILL_FLAG_SHARE:
        tip = (f"One thing to improve: {bill_share:.0%} of jobs have a bill well above the rate card or a repeat bill, "
               "so share the site measurements behind them (listed below).")
    elif durability == "worse than peers":
        tip = "One thing to improve: fixes are failing faster than peers in similar conditions, so a longer-lasting method may pay off."
    elif speed == "worse than peers":
        tip = "One thing to improve: response time, which trails peers working in similar conditions."
    elif by_rule.get("dlp_paid"):
        tip = "One thing to improve: send repairs on roads still under warranty back to the original contractor."
    else:
        tip = "One thing to improve: keep linking every job to the complaints behind it so the record stays clear."
    return f"{text} {tip}"


def scorecard(wo: pd.DataFrame, flags: list, id_: str, name: str, kind: str, label: str | None = None) -> dict:
    by_rule = dict(Counter(f["rule"] for f in flags))
    sla = rate(wo.sla_ok, wo.exp_sla)
    reopen = rate(wo.reopened, wo.exp_reopen)
    cost_ratio = round(float(wo.ratio.median()), 2) if len(wo) else 0.0
    return {
        "id": id_, "name": name, "kind": kind, "jobs": len(wo), "spend_inr": int(wo.cost_inr.sum()),
        "sla_met": sla, "reopened": reopen, "median_cost_ratio": cost_ratio,
        "flags": {"total": len(flags), "by_rule": by_rule},
        "amount_at_risk_inr": amount_at_risk(flags),
        "verdict": verdict(label or name, len(wo), sla, reopen, cost_ratio, by_rule),
        "evidence_wo_ids": list(dict.fromkeys(f["wo_id"] for f in flags if f["wo_id"]))[:20],
    }


def contractor_cards(wo: pd.DataFrame, flags: list, contractors: pd.DataFrame) -> list:
    """`wo` is already passed through with_expected; scope it (for example to one ward) before calling."""
    cards = []
    for cid, g in wo.groupby("contractor_id"):
        name = contractors.set_index("contractor_id").contractor_name.get(cid, g.contractor_name.iat[0])
        ids = set(g.work_order_id)
        cards.append(scorecard(g, [f for f in flags if f["wo_id"] in ids], cid, name, "contractor"))
    return cards


def ward_card(wo: pd.DataFrame, flags: list, code: str, name: str) -> dict:
    g = wo[wo.ward_code == code]
    return scorecard(g, [f for f in flags if f["ward_code"] == code], code, name, "ward", f"Ward {code} ({name})")
