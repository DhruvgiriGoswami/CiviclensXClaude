"""End to end: the real app, lifespan run, against the real data/ CSVs."""

import csv
import io
import os
import re

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

pytestmark = pytest.mark.asyncio(loop_scope="module")
A = "/api/v1/audit"
FLAG_KEYS = {"flag_id", "rule", "severity", "wo_id", "complaint_ids", "ward_code", "road_id", "contractor_id", "reason",
             "evidence", "amount_at_risk_inr"}
RATE_KEYS = {"observed", "expected", "ci_low", "ci_high", "n", "judgeable"}
CARD_KEYS = {"id", "name", "kind", "jobs", "spend_inr", "sla_met", "reopened", "median_cost_ratio", "flags",
             "amount_at_risk_inr", "verdict", "evidence_wo_ids"}
WARD_KEYS = {"ward_code", "ward_name", "zone", "budget_inr", "spend_inr", "spend_share", "failed_fix_spend_inr",
             "failed_fix_share", "reopen_rate", "flag_count", "amount_at_risk_inr", "low_lying_index", "open_issues"}


@pytest_asyncio.fixture(loop_scope="module", scope="module")
async def api():
    os.environ.pop("ANTHROPIC_API_KEY", None)  # tests run on the template path
    app.state.audit = None
    async with app.router.lifespan_context(app):
        assert app.state.audit is not None
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            yield c


async def get(api, path, **params):
    r = await api.get(A + path, params=params)
    assert r.status_code == 200, (path, r.text)
    return r.json()


def check_card(c, kind):
    assert CARD_KEYS <= set(c) and c["kind"] == kind
    for k in ("sla_met", "reopened"):
        assert set(c[k]) == RATE_KEYS and c[k]["ci_low"] <= c[k]["observed"] <= c[k]["ci_high"]
        assert c[k]["judgeable"] == (c[k]["n"] >= 15)
    assert len(c["verdict"].split()) < 120 and "—" not in c["verdict"] and "–" not in c["verdict"]


async def test_overview(api):
    o = await get(api, "/overview")
    assert 12e7 < o["spend_inr"] < 14e7
    assert o["work_orders"] == 2499 and o["complaints"] == 6501 and o["issues"] < o["complaints"]
    for rule in ("overbilling", "double_billing", "dlp_paid"):
        assert o["flags_by_rule"][rule] > 0


async def test_wards_list_and_geojson(api):
    wards = await get(api, "/wards")
    assert len(wards) == 24 and all(WARD_KEYS <= set(w) for w in wards)
    geo = await get(api, "/wards.geojson")
    assert geo["type"] == "FeatureCollection" and {"ward_code", "ward_name"} <= set(geo["features"][0]["properties"])


async def test_ward_detail_with_slash_code(api):
    d = await get(api, "/wards/F/S")
    assert d["ward"]["ward_code"] == "F/S" and WARD_KEYS <= set(d["ward"]) and d["ward"]["localities"]
    assert {"by_contractor", "by_method", "by_month"} <= set(d["money_trail"])
    assert sum(x["spend_inr"] for x in d["money_trail"]["by_month"]) == d["ward"]["spend_inr"]
    check_card(d["scorecard"], "ward")
    for c in d["contractors"]:
        check_card(c, "contractor")
    assert all(f["ward_code"] == "F/S" and FLAG_KEYS <= set(f) for f in d["flags"])
    assert set(d["context"]) == {"heavy_rain_days", "big_tide_days", "flood_hotspots", "low_lying_index"}


async def test_contractors(api):
    cards = await get(api, "/contractors")
    assert len(cards) == 8
    for c in cards:
        check_card(c, "contractor")
        assert c["name"].endswith("(synthetic)")
    one = await get(api, "/contractors/CT03")
    assert isinstance(one["flags"], list) and one["wards"] and one["flag_summary"]["total"] == len(one["flags"])


async def test_three_named_rules_hit_real_rows(api):
    for rule in ("overbilling", "double_billing", "dlp_paid"):
        r = await get(api, "/flags", rule=rule)
        assert r["count"] > 0 and all(f["rule"] == rule and f["wo_id"] for f in r["flags"])
    over = (await get(api, "/flags", rule="overbilling"))["flags"]
    assert all(f["evidence"]["ratio"] > 1.3 for f in over)
    dbl = (await get(api, "/flags", rule="double_billing"))["flags"]
    assert all(f["complaint_ids"] == [] and f["evidence"]["related_wo_ids"] for f in dbl)


async def test_normal_rows_not_flagged(api):
    # WO25-00004 is billed at 1.29x the drain desilting rate on a non-DLP road, with linked complaints: normal variation.
    all_flags = (await get(api, "/flags"))["flags"]
    billing = {f["wo_id"] for f in all_flags if f["rule"] in ("overbilling", "double_billing", "dlp_paid")}
    assert "WO25-00004" not in billing
    trail = await get(api, "/complaints/BMC25-000013")
    assert trail["work_orders"][0]["wo_id"] == "WO25-00004" and trail["work_orders"][0]["flags"] == []


async def test_flags_filters_and_sorting(api):
    r = await get(api, "/flags", ward="F/S", severity="high")
    assert r["count"] == len(r["flags"]) and all(f["ward_code"] == "F/S" and f["severity"] == "high" for f in r["flags"])
    allf = (await get(api, "/flags"))["flags"]
    order = {"high": 0, "medium": 1, "low": 2}
    keys = [(order[f["severity"]], -f["amount_at_risk_inr"]) for f in allf]
    assert keys == sorted(keys)


async def test_export_csv_parses(api):
    r = await api.get(A + "/export/flags.csv")
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    rows = list(csv.DictReader(io.StringIO(r.text)))
    assert list(rows[0]) == ["flag_id", "rule", "severity", "wo_id", "complaint_ids", "ward_code", "road_id", "contractor_id",
                             "amount_at_risk_inr", "reason"]
    assert len(rows) == (await get(api, "/flags"))["count"]


@pytest.mark.parametrize("code", ["F/S", "L", "A", "H/E"])
async def test_next_rupee_within_budget(api, code):
    p = await get(api, f"/next-rupee/{code}")
    assert p["remaining_inr"] == p["budget_inr"] - p["spent_inr"]
    funded = sum(x["est_cost_inr"] for x in p["plan"] if x["funded"])
    assert funded <= max(p["remaining_inr"], 0)
    assert p["unfunded_count"] == sum(not x["funded"] for x in p["plan"])
    for x in p["plan"]:
        assert abs(sum(x["risk_parts"].values()) - x["risk_score"]) < 0.01 and 0 <= x["risk_score"] <= 1
        if x["pay_from"] == "dlp_contractor":
            assert x["est_cost_inr"] == 0 and x["funded"]
    if p["remaining_inr"] <= 0:
        assert p["note"] and all(x["pay_from"] == "dlp_contractor" for x in p["plan"] if x["funded"])


async def test_dlp_items_exist_and_cost_zero(api):
    plans = [await get(api, f"/next-rupee/{w}") for w in ("L", "F/S", "A")]
    dlp = [x for p in plans for x in p["plan"] if x["pay_from"] == "dlp_contractor"]
    assert dlp and all(x["est_cost_inr"] == 0 for x in dlp)


async def test_complaint_trail(api):
    t = await get(api, "/complaints/BMC25-001657")
    assert t["complaint"]["complaint_id"] == "BMC25-001657" and t["issue"]["state"] in {"fixed", "fixed_reopened", "never_fixed", "open"}
    assert "BMC25-001657" in t["issue"]["complaint_ids"] and t["summary"]
    w = t["work_orders"][0]
    assert {"wo_id", "contractor_name", "cost_inr", "sla_met_actual", "under_dlp", "flags"} <= set(w)


async def test_complaint_points_use_csv_gps(api):
    d = await get(api, "/complaints")
    assert d["fields"] == ["complaint_id", "lat", "lon", "ward_code", "issue_state"]
    gps = [r for r in csv.DictReader(open(os.path.join(os.path.dirname(__file__), "../../../data/complaints.csv"), encoding="utf-8")) if r["lat"]]
    assert len(d["rows"]) == len(gps)
    first = next(r for r in d["rows"] if r[0] == gps[0]["complaint_id"])
    assert first[1:3] == [round(float(gps[0]["lat"]), 6), round(float(gps[0]["lon"]), 6)]
    assert {r[4] for r in d["rows"]} <= {"fixed", "fixed_reopened", "never_fixed", "open"}


async def test_search(api):
    for q, typ in [("BMC25-001657", "complaint"), ("WO25-00004", "work_order"), ("Hindmata", "ward"), ("भायखळा", "ward"),
                   ("Linking Road", "road")]:
        res = (await get(api, "/search", q=q))["results"]
        assert 0 < len(res) <= 10 and typ in {x["type"] for x in res}, (q, res)


async def test_ask_marathi_template(api):
    r = await api.post(A + "/ask", json={"question": "माझ्या तक्रारीचं काय झालं? BMC25-001657", "complaint_id": None, "ward_code": None})
    assert r.status_code == 200
    j = r.json()
    assert j["language"] == "mr" and j["source"] == "template" and j["complaint_ids"] == ["BMC25-001657"] and j["wo_ids"]
    assert re.search(r"[ऀ-ॿ]", j["answer"]) and j["wo_ids"][0] in j["answer"]


async def test_ward_summary_template(api):
    r = await api.post(A + "/wards/F/S/summary")
    assert r.status_code == 200
    j = r.json()
    assert j["source"] == "template" and j["summary_markdown"].startswith("# Ward F/S") and j["wo_ids"]
    assert all(w in j["summary_markdown"] for w in j["wo_ids"])


@pytest.mark.parametrize("method,path", [
    ("get", "/wards/ZZ"), ("get", "/contractors/CT99"), ("get", "/complaints/BMC25-999999"), ("get", "/next-rupee/Q/Q"),
    ("post", "/wards/ZZ/summary"),
])
async def test_unknown_ids_404(api, method, path):
    r = await getattr(api, method)(A + path)
    assert r.status_code == 404 and "detail" in r.json()


async def test_ask_unknown_complaint_404(api):
    r = await api.post(A + "/ask", json={"question": "x", "complaint_id": "BMC25-999999"})
    assert r.status_code == 404


POST_KEYS = {"post_id", "posted_at", "source", "platform", "author_handle", "text", "engagement", "engagement_label",
             "shared_count", "unverified"}


async def test_social_posts_shape_and_paging(api):
    p1 = await get(api, "/social-posts")
    assert p1["total"] == 509 and p1["next_offset"] == 10 and len(p1["items"]) == 10
    assert all(set(i) == POST_KEYS for i in p1["items"])  # has_media is never served
    p2 = await get(api, "/social-posts", offset=10)
    assert not {i["post_id"] for i in p1["items"]} & {i["post_id"] for i in p2["items"]}
    last = await get(api, "/social-posts", offset=500)
    assert len(last["items"]) == 9 and last["next_offset"] is None
    dates = [i["posted_at"] for i in (await get(api, "/social-posts", limit=50))["items"]]
    assert dates == sorted(dates, reverse=True)
    assert (await api.get(A + "/social-posts", params={"limit": 0})).status_code == 422


async def test_social_posts_dedup_and_flags(api):
    items = []
    for off in range(0, 509, 50):
        items += (await get(api, "/social-posts", limit=50, offset=off))["items"]
    assert len(items) == 509 and len({i["text"] for i in items}) == 509
    assert sum(i["shared_count"] for i in items) == 650
    fwd = next(i for i in items if i["text"].startswith("Fwd as received"))
    assert fwd["unverified"] is True and fwd["shared_count"] > 1
    assert not any(i["unverified"] for i in items if "unverified" not in i["text"].lower())
    for i in items:
        assert i["engagement_label"] == ("forwards" if i["platform"] == "whatsapp" else "likes")
        assert i["platform"] in {"x", "instagram", "whatsapp"}
        assert re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d", i["posted_at"])
