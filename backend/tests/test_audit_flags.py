"""Unit tests for the audit flag rules on tiny in-memory fixtures."""

import pandas as pd

from app.audit import flags
from app.audit.load import enrich_work_orders

RATE_CARD = pd.DataFrame([
    {"repair_method": "Hot mix patch", "unit": "per sqm", "standard_rate_inr": 2600},
    {"repair_method": "Drain desilting", "unit": "per job", "standard_rate_inr": 90000},
])
ROADS = pd.DataFrame([
    {"road_id": "RD1", "road_name": "Test Marg", "under_dlp": "N", "last_resurfaced": pd.Timestamp("2020-01-01"), "bus_route": "N"},
    {"road_id": "RD2", "road_name": "DLP Marg", "under_dlp": "Y", "last_resurfaced": pd.Timestamp("2024-06-01"), "bus_route": "Y"},
])
WARDS = pd.DataFrame([{"ward_code": "F/S", "low_lying_index": 0.85}])
COMPLAINTS = pd.DataFrame([
    {"complaint_id": "BMC25-000001", "received_at": pd.Timestamp("2025-07-01 08:00")},
    {"complaint_id": "BMC25-000002", "received_at": pd.Timestamp("2025-07-01 09:00")},
])


def wo(*rows) -> pd.DataFrame:
    base = {"ward_code": "F/S", "road_id": "RD1", "work_type": "Pothole", "repair_method": "Hot mix patch",
            "contractor_id": "CT01", "contractor_name": "Test Co (synthetic)", "linked_complaint_ids": "BMC25-000001",
            "assigned_at": "2025-07-01 10:00", "work_started_at": "2025-07-01 12:00", "completed_at": "2025-07-02 08:00",
            "area_sqm": 10.0, "cost_inr": 26000, "sla_hours": 48, "sla_met": "Y", "reopened_within_30d": "N",
            "engineer_remark": "Work done"}
    df = pd.DataFrame([{**base, "work_order_id": f"WO25-{i:05d}", **r} for i, r in enumerate(rows, 1)])
    for c in ("assigned_at", "work_started_at", "completed_at"):
        df[c] = pd.to_datetime(df[c])
    df["linked_complaint_ids"] = df.linked_complaint_ids.replace("", None)
    return enrich_work_orders(df, ROADS, RATE_CARD, WARDS, COMPLAINTS, set())


def ids(fl):
    return [f["wo_id"] for f in fl]


def test_overbilling_flags_above_gap_and_names_tolerance():
    w = wo({"cost_inr": 26000 * 2}, {"repair_method": "Drain desilting", "cost_inr": 90000 * 1.6})
    fl = flags.overbilling(w)
    assert ids(fl) == ["WO25-00001", "WO25-00002"]
    assert fl[0]["severity"] == "high" and fl[0]["amount_at_risk_inr"] == 26000
    assert "2.00x" in fl[0]["reason"] and "1.30x" in fl[0]["reason"]
    assert fl[0]["evidence"]["expected_inr"] == 26000


def test_overbilling_ignores_normal_variation():
    w = wo({"cost_inr": 26000 * 1.30}, {"cost_inr": 26000 * 0.75}, {"repair_method": "Drain desilting", "cost_inr": 117000})
    assert flags.overbilling(w) == []


def test_area_outlier_only_far_out():
    w = wo(*[{"area_sqm": a} for a in (5, 6, 7, 8, 6, 5, 7, 400)])
    assert ids(flags.area_outlier(w)) == ["WO25-00008"]
    assert flags.area_outlier(wo(*[{"area_sqm": a} for a in (5, 6, 7, 8, 12)])) == []


def test_double_billing_repeat_without_complaint():
    w = wo({}, {"linked_complaint_ids": "", "assigned_at": "2025-07-03 10:00", "work_started_at": "2025-07-03 12:00",
               "completed_at": "2025-07-04 08:00", "cost_inr": 26500})
    fl = flags.double_billing(w)
    assert ids(fl) == ["WO25-00002"]
    assert fl[0]["severity"] == "high" and fl[0]["evidence"]["related_wo_ids"] == ["WO25-00001"]
    assert fl[0]["amount_at_risk_inr"] == 26500


def test_double_billing_not_when_complaint_linked_or_far_apart():
    linked = wo({}, {"linked_complaint_ids": "BMC25-000002", "assigned_at": "2025-07-03 10:00"})
    far = wo({}, {"linked_complaint_ids": "", "assigned_at": "2025-07-20 10:00", "work_started_at": "2025-07-20 12:00",
                 "completed_at": "2025-07-21 08:00"})
    other_method = wo({}, {"linked_complaint_ids": "", "repair_method": "Drain desilting", "assigned_at": "2025-07-03 10:00"})
    assert flags.double_billing(linked) == flags.double_billing(far) == flags.double_billing(other_method) == []


def test_dlp_paid_only_on_dlp_roads():
    w = wo({"road_id": "RD2"}, {"road_id": "RD1"}, {"road_id": "RD2", "work_type": "Waterlogging", "repair_method": "Drain desilting",
                                                   "cost_inr": 90000})
    fl = flags.dlp_paid(w)
    assert ids(fl) == ["WO25-00001", "WO25-00003"]
    assert [f["severity"] for f in fl] == ["high", "medium"]
    assert fl[0]["amount_at_risk_inr"] == 26000


def test_sla_recomputed_from_first_complaint():
    # First complaint 07-01 08:00, completed 07-05 08:00 = 96 h against 24 h: misreported and more than 3x.
    w = wo({"linked_complaint_ids": "BMC25-000002|BMC25-000001", "completed_at": "2025-07-05 08:00", "sla_hours": 24})
    assert w.hours_taken.iat[0] == 96
    assert ids(flags.sla_misreported(w)) == ["WO25-00001"]
    assert ids(flags.sla_missed(w)) == ["WO25-00001"]
    ok = wo({"completed_at": "2025-07-02 07:00", "sla_hours": 24})
    assert flags.sla_misreported(ok) == [] and flags.sla_missed(ok) == []


def test_timeline_impossible():
    bad = wo({"work_started_at": "2025-07-01 09:00"})
    assert ids(flags.timeline_impossible(bad)) == ["WO25-00001"]
    assert flags.timeline_impossible(wo({})) == []


def test_repeat_failure_needs_pattern_not_one_reopen():
    days = [f"2025-07-{d:02d} 10:00" for d in (2, 6, 10, 14)]
    rows = [{"reopened_within_30d": "Y", "assigned_at": d, "work_started_at": d, "completed_at": d} for d in days]
    assert len(flags.repeat_failure(wo(*rows))) == 1
    assert flags.repeat_failure(wo(*rows[:3])) == []


def test_amount_at_risk_no_double_count():
    fl = [{"wo_id": "W1", "flag_id": "a", "amount_at_risk_inr": 100}, {"wo_id": "W1", "flag_id": "b", "amount_at_risk_inr": 60},
          {"wo_id": None, "flag_id": "c", "amount_at_risk_inr": 5}]
    assert flags.amount_at_risk(fl) == 105
