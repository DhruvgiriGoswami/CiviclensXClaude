"""Unit tests for dedupe, fair rates, the greedy allocator and language detection."""

import pandas as pd
import pytest

from app.audit import budget, scorecards, trail
from app.audit.claude import detect_language

GEO = {"features": [{"properties": {"ward_code": "F/S"},
                     "geometry": {"type": "Polygon", "coordinates": [[[72.80, 18.95], [72.90, 18.95], [72.90, 19.05],
                                                                      [72.80, 19.05], [72.80, 18.95]]]}}]}
LOCALITIES = pd.DataFrame([{"locality": "Byculla", "ward_code": "E", "lat": 18.975, "lon": 72.832, "aliases": "Bhaykhala; भायखळा"},
                           {"locality": "Parel", "ward_code": "F/S", "lat": 19.0, "lon": 72.84, "aliases": None}])


def complaints(*rows):
    base = {"channel": "MyBMC App", "category_reported": "Pothole", "description": "big pothole", "photo_description": None,
            "language": "en", "locality_text": "Parel", "ward_code": "F/S", "lat": None, "lon": None, "status": "Open", "upvotes": 0}
    df = pd.DataFrame([{**base, "complaint_id": f"BMC25-{i:06d}", **r} for i, r in enumerate(rows, 1)])
    df["received_at"] = pd.to_datetime(df.received_at)
    return df


def roots(*rows):
    c = trail.clean_complaints(complaints(*rows), LOCALITIES, GEO)
    no_wo = pd.DataFrame({"work_order_id": [], "links": []})
    return list(trail.cluster(c, no_wo)), c


def test_dedupe_same_place_within_72h():
    r, _ = roots(
        {"received_at": "2025-07-01 08:00"},
        {"received_at": "2025-07-01 18:00", "channel": "1916 Helpline", "description": "Caller reports pothole at Parel"},
        {"received_at": "2025-07-06 08:00"},                                   # too late
        {"received_at": "2025-07-01 09:00", "category_reported": "Waterlogging", "description": "paani bhar gaya"},  # other category
        {"received_at": "2025-07-01 10:00", "locality_text": "Dadar", "lat": 19.0, "lon": 72.84},
        {"received_at": "2025-07-01 11:00", "locality_text": "Lalbaug", "lat": 19.0009, "lon": 72.84},  # about 100 m from the one above
    )
    assert r[0] == r[1] and r[2] != r[0] and r[3] != r[0]
    assert r[4] == r[5]


def test_ward_fill_from_alias_and_gps():
    _, c = roots({"received_at": "2025-07-01 08:00", "ward_code": None, "locality_text": "भायखळा"},
                 {"received_at": "2025-07-01 08:00", "ward_code": None, "locality_text": "Nowhere", "lat": 19.0, "lon": 72.85})
    assert list(c.ward_code) == ["E", "F/S"] and c.ward_code_inferred.all()


def test_category_fix_uses_photo_then_helpline_text():
    _, c = roots({"received_at": "2025-07-01", "category_reported": "Other", "photo_description": "Uncovered manhole with a stick"},
                 {"received_at": "2025-07-01", "category_reported": "Road related", "channel": "1916 Helpline",
                  "description": "Caller reports road cave-in at Parel"},
                 {"received_at": "2025-07-01", "category_reported": "Other", "description": "Street light not working"})
    assert list(c.category_clean) == ["Open or broken manhole", "Road cave-in", trail.NOT_ROAD]


def test_wilson_interval():
    lo, hi = scorecards.wilson(0, 10)
    assert lo == 0 and hi == pytest.approx(0.2775, abs=1e-3)
    lo, hi = scorecards.wilson(50, 100)
    assert lo == pytest.approx(0.4038, abs=1e-3) and hi == pytest.approx(0.5962, abs=1e-3)


def test_expected_rate_from_peers_in_stratum():
    wo = pd.DataFrame({"repair_method": ["A"] * 4 + ["B"] * 4, "rain_context": True, "low_lying": False,
                       "sla_ok": [True] * 8, "reopened": [True, True, False, False, False, False, False, False]})
    wo = scorecards.with_expected(wo)
    assert list(wo.exp_reopen) == [0.5] * 4 + [0.0] * 4
    r = scorecards.rate(wo.reopened[:4], wo.exp_reopen[:4])
    assert r["observed"] == 0.5 and r["expected"] == 0.5 and r["judgeable"] is False
    assert scorecards._compare(r, good_high=False) == "too few jobs to judge"


def test_greedy_allocator_within_budget_and_dlp_free():
    items = [{"risk_score": 0.9, "est_cost_inr": 100}, {"risk_score": 0.5, "est_cost_inr": 10},
             {"risk_score": 0.4, "est_cost_inr": 0}, {"risk_score": 0.3, "est_cost_inr": 50}]
    out = budget.allocate(items, 60)
    funded = [x for x in out if x["funded"]]
    assert sum(x["est_cost_inr"] for x in funded) <= 60
    assert {x["risk_score"] for x in funded} == {0.5, 0.4, 0.3}
    assert [x["rank"] for x in out] == [1, 2, 3, 4] and out[0]["risk_score"] == 0.9
    assert [x["funded"] for x in budget.allocate([{"risk_score": 1, "est_cost_inr": 0}, {"risk_score": 1, "est_cost_inr": 5}], -10)] == [True, False]


@pytest.mark.parametrize("text,lang", [
    ("माझ्या तक्रारीचं काय झालं?", "mr"), ("मेरी शिकायत पर क्या हुआ?", "hi"),
    ("meri complaint ka kya hua", "hi-en"), ("What happened to my complaint?", "en"),
])
def test_detect_language(text, lang):
    assert detect_language(text) == lang
