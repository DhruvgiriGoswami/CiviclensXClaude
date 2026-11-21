"""Complaint clean-up: fill wards, fix categories, cluster duplicates into issues, link issues to work orders."""

import re

import numpy as np
import pandas as pd
from shapely.geometry import Point, shape

ROAD_CATEGORIES = ["Pothole", "Waterlogging", "Open or broken manhole", "Choked drain / nullah overflow",
                   "Road cave-in", "Broken paver blocks"]
NOT_ROAD = "Not a road issue"

# Order matters: a gutter lid ("gutter ka dhakkan", "गटाराचे झाकण") is a manhole, not a choked drain.
KEYWORDS = [
    ("Road cave-in", r"cave[ -]?in|caved|sunk|sinkhole|collapsed|dhans|धस|धंस|खचल"),
    ("Open or broken manhole", r"manhole|dhakkan|chamber|झाकण|ढक्कन|मैनहोल|मॅनहोल"),
    ("Choked drain / nullah overflow", r"choked|gutter|nullah|nala|drain|culvert|गटार|नाला|नाली|गटर"),
    ("Broken paver blocks", r"paver|पेवर|ब्लॉक"),
    ("Pothole", r"pothole|khadda|khada|gadda|gaddha|crater|गड्ढा|गड्डा|खड्डा|खड्डे"),
    ("Waterlogging", r"waterlog|water logged|paani bhar|pani bhar|flooded|knee deep|not receding|ghutne|साचल|पानी भर|जलभराव|पाणी"),
]
KEYWORDS = [(c, re.compile(p, re.I)) for c, p in KEYWORDS]

CLUSTER_HOURS = 72
CLUSTER_METRES = 150


def classify(text) -> str | None:
    if not isinstance(text, str):
        return None
    return next((c for c, rx in KEYWORDS if rx.search(text)), None)


def clean_category(row) -> str:
    """Checked against the work type of linked jobs: helpline notes are about 99% right, photos about 92%,
    the citizen's pick about 88%, and free text from app users only about 65% (it is often generic)."""
    desc = classify(row.description)
    if row.channel == "1916 Helpline" and desc:
        return desc
    photo = classify(row.photo_description)
    if photo:
        return photo
    if row.category_reported in ROAD_CATEGORIES:
        return row.category_reported
    return desc or NOT_ROAD


def _norm(s) -> str:
    return re.sub(r"\s+", " ", str(s).strip().lower()) if isinstance(s, str) else ""


def locality_index(localities: pd.DataFrame) -> dict:
    """Normalised name or alias (Devanagari included) to (ward_code, lat, lon, canonical locality)."""
    idx = {}
    for r in localities.itertuples():
        names = [r.locality] + (r.aliases.split(";") if isinstance(r.aliases, str) else [])
        for n in names:
            idx.setdefault(_norm(n), (r.ward_code, r.lat, r.lon, r.locality))
    return idx


def match_locality(text, idx: dict):
    t = _norm(text)
    if t in idx:
        return idx[t]
    # Shortened text such as "Malad" for "Malad West": take the prefix match only when it points to one ward.
    hits = [v for k, v in idx.items() if t and k.startswith(t + " ")]
    return hits[0] if hits and len({h[0] for h in hits}) == 1 else None


def ward_polygons(geojson: dict) -> list:
    return [(f["properties"]["ward_code"], shape(f["geometry"])) for f in geojson["features"]]


def point_ward(lat, lon, polys) -> str | None:
    if pd.isna(lat) or pd.isna(lon):
        return None
    p = Point(lon, lat)
    return next((code for code, poly in polys if poly.contains(p)), None)


def metres(lat1, lon1, lat2, lon2) -> float:
    dy = (lat2 - lat1) * 111_000
    dx = (lon2 - lon1) * 111_000 * np.cos(np.radians(lat1))
    return float(np.hypot(dx, dy))


class _UF:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, i):
        while self.p[i] != i:
            self.p[i] = self.p[self.p[i]]
            i = self.p[i]
        return i


def clean_complaints(c: pd.DataFrame, localities: pd.DataFrame, geojson: dict) -> pd.DataFrame:
    c = c.copy()
    idx, polys = locality_index(localities), ward_polygons(geojson)
    loc = c.locality_text.map(lambda t: match_locality(t, idx))
    c["locality_clean"] = [m[3] if m else _norm(t) for m, t in zip(loc, c.locality_text)]
    c["loc_lat"] = [m[1] if m else np.nan for m in loc]
    c["loc_lon"] = [m[2] if m else np.nan for m in loc]
    missing = c.ward_code.isna()
    c["ward_code_inferred"] = missing
    gps = [point_ward(a, b, polys) for a, b in zip(c.lat[missing], c.lon[missing])]
    by_name = [m[0] if m else None for m in loc[missing]]
    c.loc[missing, "ward_code"] = [g or n for g, n in zip(gps, by_name)]
    c["category_clean"] = [clean_category(r) for r in c.itertuples()]
    return c


def cluster(c: pd.DataFrame, wo: pd.DataFrame) -> pd.Series:
    """Issue root per complaint. Complaints on one work order share an issue; two different work orders never merge."""
    pos = {cid: i for i, cid in enumerate(c.complaint_id)}
    uf = _UF(len(c))
    root_wo = {}
    for w in wo.itertuples():
        ids = [pos[i] for i in w.links if i in pos]
        for i in ids:
            uf.p[uf.find(i)] = uf.find(ids[0])
        if ids:
            root_wo.setdefault(uf.find(ids[0]), set()).add(w.work_order_id)
    root_wo = {uf.find(r): s for r, s in root_wo.items()}
    t = c.received_at.values
    lat = c.lat.fillna(c.loc_lat).values
    lon = c.lon.fillna(c.loc_lon).values
    first = {}
    for _, g in c[c.category_clean != NOT_ROAD].groupby(["ward_code", "category_clean"]):
        g = g.sort_values("received_at")
        rows = [pos[x] for x in g.complaint_id]
        for a_i, a in enumerate(rows):
            for b in rows[a_i + 1:]:
                if (t[b] - t[a]) / np.timedelta64(1, "h") > CLUSTER_HOURS:
                    break
                ra, rb = uf.find(a), uf.find(b)
                if ra == rb or (ra in root_wo and rb in root_wo):
                    continue
                start = first.get(ra, t[a])
                if (t[b] - start) / np.timedelta64(1, "h") > CLUSTER_HOURS:
                    continue
                same_place = c.locality_clean.iat[a] == c.locality_clean.iat[b] or (
                    not np.isnan(lat[a]) and not np.isnan(lat[b]) and metres(lat[a], lon[a], lat[b], lon[b]) <= CLUSTER_METRES)
                if same_place:
                    keep, drop = (ra, rb) if ra in root_wo or rb not in root_wo else (rb, ra)
                    uf.p[drop] = keep
                    first[keep] = min(first.get(keep, t[a]), first.get(drop, t[b]), t[a])
                    if drop in root_wo:
                        root_wo[keep] = root_wo.pop(drop)
    return pd.Series([uf.find(i) for i in range(len(c))], index=c.index)


def nearest_road(lat, lon, ward, roads: pd.DataFrame) -> str | None:
    r = roads[roads.ward_code == ward] if ward in set(roads.ward_code) else roads
    if r.empty or pd.isna(lat):
        return r.road_id.iat[0] if not r.empty else None
    mlat, mlon = (r.start_lat + r.end_lat) / 2, (r.start_lon + r.end_lon) / 2
    return r.road_id.iat[int(np.argmin((mlat - lat) ** 2 + ((mlon - lon) * np.cos(np.radians(lat))) ** 2))]


def build_issues(c: pd.DataFrame, wo: pd.DataFrame, roads: pd.DataFrame) -> pd.DataFrame:
    wo_by_cid = {cid: w for w, links in zip(wo.work_order_id, wo.links) for cid in links}
    wo_i = wo.set_index("work_order_id")
    out = []
    for _, g in c.groupby("issue_root", sort=False):
        g = g.sort_values("received_at")
        wo_ids = sorted({wo_by_cid[x] for x in g.complaint_id if x in wo_by_cid})
        statuses = set(g.status)
        if wo_ids:
            state = "fixed_reopened" if wo_i.reopened[wo_ids].iloc[-1] else "fixed"
            road = wo_i.road_id[wo_ids[-1]]
        else:
            state = "never_fixed" if statuses & {"Resolved", "Closed - Duplicate"} else "open"
            lat = g.lat.dropna().mean() if g.lat.notna().any() else g.loc_lat.dropna().mean()
            lon = g.lon.dropna().mean() if g.lon.notna().any() else g.loc_lon.dropna().mean()
            road = nearest_road(lat, lon, g.ward_code.iat[0], roads)
        first = g.iloc[0]
        out.append({
            "issue_id": "ISS-" + first.complaint_id.split("-")[-1],
            "complaint_ids": list(g.complaint_id),
            "ward_code": first.ward_code,
            "category": first.category_clean,
            "locality": first.locality_clean,
            "first_received_at": first.received_at,
            "wo_ids": wo_ids,
            "state": state,
            "road_id": road,
            "upvotes": int(g.upvotes.fillna(0).sum()),
            # Forwarded or rejected complaints are another agency's job, so only these go to the planner.
            "actionable": state == "never_fixed" or bool(statuses & {"Open", "In Progress"}),
        })
    return pd.DataFrame(out)


def build(store) -> None:
    c = clean_complaints(store.complaints, store.localities, store.wards_geojson)
    # A linked job's work type is what the crew found on site, so it beats any text rule.
    job_type = {cid: wt for wt, links in zip(store.wo.work_type, store.wo.links) for cid in links}
    c["category_clean"] = c.complaint_id.map(job_type).fillna(c.category_clean)
    c["issue_root"] = cluster(c, store.wo)
    issues = build_issues(c, store.wo, store.roads)
    cid_issue = {cid: iid for iid, ids in zip(issues.issue_id, issues.complaint_ids) for cid in ids}
    c["issue_id"] = c.complaint_id.map(cid_issue)
    store.complaints, store.issues = c, issues
