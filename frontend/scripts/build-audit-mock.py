# Builds src/pages/FollowTheRupee/mockData.json from the hackathon CSVs so the page
# works offline. Shapes follow docs/API_CONTRACT.md. The rules here are rough stand-ins
# for the backend audit, good enough for a demo fallback and the e2e tests.
# Run from frontend/: python3 scripts/build-audit-mock.py ../data src/pages/FollowTheRupee/mockData.json
import csv, json, sys, math, collections, datetime as dt

D, OUT = sys.argv[1], sys.argv[2]


def rd(n):
    return list(csv.DictReader(open(f"{D}/{n}", encoding="utf-8")))


wards = rd("wards.csv")
wos = rd("work_orders.csv")
comps = rd("complaints.csv")
roads = {r["road_id"]: r for r in rd("roads.csv")}
rates = {r["repair_method"]: r for r in rd("rate_card.csv")}
traffic = {r["road_id"]: r for r in rd("traffic.csv")}
hot = rd("flood_hotspots.csv")
acc = rd("accidents.csv")
fac = rd("facilities.csv")
cmap = {c["complaint_id"]: c for c in comps}


def T(s):
    return dt.datetime.strptime(s, "%Y-%m-%d %H:%M")


def expected(w):
    r = rates.get(w["repair_method"])
    if not r:
        return None
    rate = int(r["standard_rate_inr"])
    return round(rate * float(w["area_sqm"] or 0)) if r["unit"] == "per sqm" else rate


def rate(k, n, exp):
    o = k / n if n else 0
    se = math.sqrt(max(o * (1 - o), 1e-4) / max(n, 1))
    return {"observed": round(o, 3), "expected": round(exp, 3), "ci_low": round(max(0, o - 1.96 * se), 3),
            "ci_high": round(min(1, o + 1.96 * se), 3), "n": n, "judgeable": n >= 15}


flags = []
seen = collections.defaultdict(list)
for w in wos:
    cost = int(w["cost_inr"])
    exp = expected(w)
    road = roads.get(w["road_id"], {})
    base = dict(wo_id=w["work_order_id"], complaint_ids=[c for c in w["linked_complaint_ids"].split("|") if c],
                ward_code=w["ward_code"], road_id=w["road_id"], contractor_id=w["contractor_id"])
    if exp and cost / exp > 1.6:
        ratio = round(cost / exp, 2)
        flags.append(dict(flag_id=f"OVERBILL-{w['work_order_id']}", rule="overbilling", severity="high" if ratio > 2 else "medium", **base,
                          reason=f"Billed {ratio}x the rate card for {w['repair_method']} (normal range is 0.7x to 1.3x).",
                          evidence=dict(cost_inr=cost, expected_inr=exp, ratio=ratio, related_wo_ids=[]),
                          amount_at_risk_inr=cost - round(exp * 1.3)))
    if road.get("under_dlp") == "Y":
        flags.append(dict(flag_id=f"DLP-{w['work_order_id']}", rule="dlp_paid", severity="medium", **base,
                          reason=f"BMC paid for a repair on a road still under the original contractor's warranty (last resurfaced {road['last_resurfaced']}).",
                          evidence=dict(cost_inr=cost, expected_inr=0, last_resurfaced=road["last_resurfaced"], related_wo_ids=[]),
                          amount_at_risk_inr=cost))
    key = (w["road_id"], w["repair_method"])
    for o in seen[key]:
        days = abs((T(w["assigned_at"]) - T(o["assigned_at"])).days)
        if days <= 7 and o["contractor_id"] == w["contractor_id"]:
            flags.append(dict(flag_id=f"DOUBLE-{w['work_order_id']}", rule="double_billing", severity="high", **base,
                              reason=f"Same road, method and contractor billed twice within a week (see {o['work_order_id']}).",
                              evidence=dict(cost_inr=cost, expected_inr=0, days_apart=days, related_wo_ids=[o["work_order_id"]]),
                              amount_at_risk_inr=cost))
            break
    seen[key].append(w)
    if w["sla_met"] == "Y" and w["completed_at"] and base["complaint_ids"]:
        first = min((T(cmap[c]["received_at"]) for c in base["complaint_ids"] if c in cmap), default=None)
        if first:
            hrs = (T(w["completed_at"]) - first).total_seconds() / 3600
            if hrs > int(w["sla_hours"]) * 1.5:
                flags.append(dict(flag_id=f"SLA-{w['work_order_id']}", rule="sla_misreported", severity="low", **base,
                                  reason=f"Marked on time, but it took {round(hrs)} hours from the first complaint against a {w['sla_hours']} hour target.",
                                  evidence=dict(cost_inr=cost, expected_inr=exp or 0, hours_taken=round(hrs), sla_hours=int(w["sla_hours"]), related_wo_ids=[]),
                                  amount_at_risk_inr=0))

sev = {"high": 0, "medium": 1, "low": 2}
flags.sort(key=lambda f: (sev[f["severity"]], -f["amount_at_risk_inr"]))
byward = collections.defaultdict(list)
for w in wos:
    byward[w["ward_code"]].append(w)
fward = collections.defaultdict(list)
for f in flags:
    fward[f["ward_code"]].append(f)
city_reopen = sum(w["reopened_within_30d"] == "Y" for w in wos) / len(wos)
city_sla = sum(w["sla_met"] == "Y" for w in wos) / len(wos)


def scorecard(id_, name, kind, ws, fl):
    n = len(ws)
    ratios = sorted(int(w["cost_inr"]) / e for w in ws if (e := expected(w)))
    re_ = sum(w["reopened_within_30d"] == "Y" for w in ws)
    if n < 15:
        verdict = f"{n} jobs is too few to judge fairly."
    else:
        verdict = (f"{re_} of {n} repairs failed within 30 days, against about {round(city_reopen * 100)}% citywide. "
                   + (f"{len(fl)} jobs show billing or timing issues worth checking." if fl else "No billing issues found."))
    return dict(id=id_, name=name, kind=kind, jobs=n, spend_inr=sum(int(w["cost_inr"]) for w in ws),
                sla_met=rate(sum(w["sla_met"] == "Y" for w in ws), n, city_sla), reopened=rate(re_, n, city_reopen),
                median_cost_ratio=round(ratios[len(ratios) // 2], 2) if ratios else None,
                flags=dict(total=len(fl), by_rule=dict(collections.Counter(f["rule"] for f in fl))),
                amount_at_risk_inr=sum(f["amount_at_risk_inr"] for f in fl), verdict=verdict,
                evidence_wo_ids=[f["wo_id"] for f in fl[:5] if f["wo_id"]])


def group(ws, keyf):
    g = collections.defaultdict(list)
    for w in ws:
        g[keyf(w)].append(w)
    return g


def spend(ws):
    return sum(int(w["cost_inr"]) for w in ws)


def failed(ws):
    return sum(int(w["cost_inr"]) for w in ws if w["reopened_within_30d"] == "Y")


def reopen(ws):
    return round(sum(w["reopened_within_30d"] == "Y" for w in ws) / len(ws), 3) if ws else None


items, details, plans = [], {}, {}
for wd in wards:
    c = wd["ward_code"]
    ws = byward[c]
    fl = fward[c]
    budget = int(wd["monsoon_repair_budget_inr_2025"])
    s = spend(ws)
    item = dict(ward_code=c, ward_name=wd["ward_name"], zone=wd["zone"], budget_inr=budget, spend_inr=s,
                spend_share=round(s / budget, 3), failed_fix_spend_inr=failed(ws),
                failed_fix_share=round(failed(ws) / s, 3) if s else None, reopen_rate=reopen(ws),
                flag_count=len(fl), amount_at_risk_inr=sum(f["amount_at_risk_inr"] for f in fl),
                low_lying_index=float(wd["low_lying_index"]),
                open_issues=sum(1 for x in comps if x["ward_code"] == c and x["status"] in ("Open", "In Progress")))
    items.append(item)
    bc = group(ws, lambda w: (w["contractor_id"], w["contractor_name"]))
    bm = group(ws, lambda w: w["repair_method"])
    bmo = group(ws, lambda w: w["assigned_at"][:7])
    contractors = sorted([scorecard(k[0], k[1], "contractor", v, [f for f in fl if f["contractor_id"] == k[0]]) for k, v in bc.items()],
                         key=lambda x: -x["spend_inr"])
    by_method = sorted([dict(repair_method=k, spend_inr=spend(v), jobs=len(v), reopen_rate=reopen(v)) for k, v in bm.items()],
                       key=lambda x: -x["spend_inr"])
    details[c] = dict(
        ward={**item, "population_est": int(wd["population_est"]), "engineering_crews": int(wd["engineering_crews"]),
              "localities": [x.strip() for x in wd["localities"].split(";")]},
        money_trail=dict(
            by_contractor=sorted([dict(contractor_id=k[0], contractor_name=k[1], spend_inr=spend(v), jobs=len(v), failed_fix_spend_inr=failed(v))
                                  for k, v in bc.items()], key=lambda x: -x["spend_inr"]),
            by_method=by_method,
            by_month=sorted([dict(month=k, spend_inr=spend(v), jobs=len(v)) for k, v in bmo.items()], key=lambda x: x["month"])),
        flags=fl[:12], scorecard=scorecard(c, f"Ward {c}", "ward", ws, fl), contractors=contractors,
        context=dict(heavy_rain_days=19, big_tide_days=11, flood_hotspots=sum(h["ward_code"] == c for h in hot),
                     low_lying_index=float(wd["low_lying_index"])))
    mreopen = {m["repair_method"]: m["reopen_rate"] for m in by_method}
    scored = []
    for r in (r for r in roads.values() if r["ward_code"] == c):
        t = traffic.get(r["road_id"], {})
        a = sum(x["road_id"] == r["road_id"] for x in acc)
        fc = sum(x["ambulance_entry_road"] == r["road_id"] for x in fac)
        bad = [x for x in ws if x["road_id"] == r["road_id"] and x["reopened_within_30d"] == "Y"]
        parts = dict(severity=round(0.08 * min(len(bad), 3), 3), flood=round(0.25 * float(wd["low_lying_index"]), 3), rain_tide=0.08,
                     traffic=round(0.02 * float(t.get("congestion_index_0_10") or 0), 3), accidents=round(min(a, 5) * 0.02, 3),
                     facilities=round(min(fc, 2) * 0.03, 3))
        method = ("Mastic asphalt" if r["surface"] == "Asphalt" else
                  "Paver blocks relaid" if r["surface"].startswith("Paver") else "Excavation, pipeline repair, PQC patch")
        unit = rates[method]
        cost = int(unit["standard_rate_inr"]) * (round(int(r["length_m"]) * 0.06) if unit["unit"] == "per sqm" else 1)
        dlp = r["under_dlp"] == "Y"
        scored.append(dict(road_id=r["road_id"], road_name=r["road_name"], issue_ids=[f"ISS-{x['work_order_id'][5:]}" for x in bad[:2]],
                           work_type="Pothole", method=method, method_reopen_rate=mreopen.get(method, 0.06), est_cost_inr=cost,
                           pay_from="dlp_contractor" if dlp else "bmc", risk_score=round(sum(parts.values()), 3), risk_parts=parts,
                           why=("Still under warranty, so the original contractor repairs it at no cost to BMC." if dlp else
                                f"Congestion {t.get('congestion_index_0_10', 'unknown')} of 10, {a} accidents and {len(bad)} failed repairs here.")))
    scored.sort(key=lambda x: -x["risk_score"])
    scored = scored[:8]
    remaining = max(budget - s, 0)
    # Rank follows risk; funding is a separate greedy pass by risk per rupee, as in the contract.
    left = remaining
    funded_ids = {p["road_id"] for p in scored if p["pay_from"] != "bmc"}
    for p in sorted((p for p in scored if p["pay_from"] == "bmc"), key=lambda p: -p["risk_score"] / max(p["est_cost_inr"], 1)):
        if p["est_cost_inr"] <= left:
            left -= p["est_cost_inr"]
            funded_ids.add(p["road_id"])
    plan = [dict(rank=i + 1, **{k: p[k] for k in ["road_id", "road_name", "issue_ids", "work_type", "method", "method_reopen_rate", "est_cost_inr"]},
                 funded=p["road_id"] in funded_ids, **{k: p[k] for k in ["pay_from", "risk_score", "risk_parts", "why"]})
            for i, p in enumerate(scored)]
    plans[c] = dict(ward_code=c, budget_inr=budget, spent_inr=s, remaining_inr=budget - s, plan=plan,
                    unfunded_count=sum(not p["funded"] for p in plan),
                    note=("This ward has spent its whole budget. Only roads under warranty go ahead, at the contractor's cost." if budget - s <= 0 else None))

wo_by_c = collections.defaultdict(list)
for w in wos:
    for cid in w["linked_complaint_ids"].split("|"):
        if cid:
            wo_by_c[cid].append(w)
fl_by_wo = collections.defaultdict(list)
for f in flags:
    fl_by_wo[f["wo_id"]].append(f)
pick = []
for d in details.values():
    for f in d["flags"][:3]:
        pick += f["complaint_ids"][:1]
pick += [x["complaint_id"] for x in comps if x["language"] == "mr" and x["complaint_id"] in wo_by_c][:8]
if "BMC25-001657" in cmap:
    pick.append("BMC25-001657")

trails = {}
for cid in dict.fromkeys(pick):
    x = cmap[cid]
    ws_ = wo_by_c.get(cid, [])
    ids = sorted({i for w in ws_ for i in w["linked_complaint_ids"].split("|") if i})
    reopened = any(w["reopened_within_30d"] == "Y" for w in ws_)
    wol = []
    for w in ws_:
        first = min(T(cmap[i]["received_at"]) for i in w["linked_complaint_ids"].split("|") if i in cmap)
        hrs = round((T(w["completed_at"]) - first).total_seconds() / 3600) if w["completed_at"] else None
        wol.append(dict(wo_id=w["work_order_id"], contractor_name=w["contractor_name"], repair_method=w["repair_method"], cost_inr=int(w["cost_inr"]),
                        assigned_at=w["assigned_at"].replace(" ", "T"), completed_at=w["completed_at"].replace(" ", "T") or None,
                        sla_hours=int(w["sla_hours"]), hours_taken=hrs, sla_met_reported=w["sla_met"] == "Y",
                        sla_met_actual=hrs is not None and hrs <= int(w["sla_hours"]), reopened_within_30d=w["reopened_within_30d"] == "Y",
                        under_dlp=roads.get(w["road_id"], {}).get("under_dlp") == "Y", flags=fl_by_wo.get(w["work_order_id"], [])))
    state = "open" if not ws_ else ("fixed_reopened" if reopened else "fixed")
    summary = (f"Your complaint about {x['category_reported'].lower()} at {x['locality_text']} was grouped with {max(len(ids) - 1, 0)} others about the same spot. "
               + (f"{len(wol)} work order(s) followed, billed at Rs {sum(w['cost_inr'] for w in wol):,}. " if wol else "No work order is linked yet. ")
               + ("The repair failed within 30 days." if reopened else ("The repair has held so far." if wol else "")))
    trails[cid] = dict(
        complaint=dict(complaint_id=cid, received_at=x["received_at"].replace(" ", "T"), channel=x["channel"], category_reported=x["category_reported"],
                       category_clean=ws_[0]["work_type"] if ws_ else x["category_reported"], description=x["description"], language=x["language"],
                       locality_text=x["locality_text"], ward_code=x["ward_code"] or (ws_[0]["ward_code"] if ws_ else None),
                       ward_code_inferred=not x["ward_code"], status=x["status"]),
        issue=dict(issue_id=f"ISS-{cid[6:]}", complaint_ids=ids or [cid], duplicates=max(len(ids) - 1, 0), state=state),
        work_orders=wol, summary=summary.strip())

overview = dict(budget_inr=sum(i["budget_inr"] for i in items), spend_inr=sum(i["spend_inr"] for i in items),
                failed_fix_spend_inr=sum(i["failed_fix_spend_inr"] for i in items), amount_at_risk_inr=sum(f["amount_at_risk_inr"] for f in flags),
                flags_by_rule=dict(collections.Counter(f["rule"] for f in flags)), complaints=len(comps),
                issues=len({w["linked_complaint_ids"] for w in wos}), never_fixed_issues=sum(1 for x in comps if x["status"] == "Open"),
                work_orders=len(wos))
search = [dict(type="complaint", id=k, label=f"{k}, {v['complaint']['locality_text']}", ward_code=v["complaint"]["ward_code"]) for k, v in trails.items()]
search += [dict(type="ward", id=i["ward_code"], label=f"Ward {i['ward_code']}, {i['ward_name']}", ward_code=i["ward_code"]) for i in items]
seen_names = set()
for r in roads.values():
    if r["road_name"] not in seen_names:
        seen_names.add(r["road_name"])
        search.append(dict(type="road", id=r["road_id"], label=r["road_name"], ward_code=r["ward_code"]))

json.dump(dict(overview=overview, wards=items, geojson=json.load(open(f"{D}/wards.geojson")), details=details, plans=plans,
               trails=trails, search=search), open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(flags), "flags,", len(trails), "trails,", "marathi:", [k for k, v in trails.items() if v["complaint"]["language"] == "mr"][:3])
