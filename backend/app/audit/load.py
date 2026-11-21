"""Load the Follow the Rupee CSVs once into an in-memory AuditStore."""

import hashlib
import json
import os
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "data"
BAD_RAIN = {"Heavy", "Very heavy", "Extremely heavy"}
LOW_LYING = 0.6  # wards at or above this low_lying_index count as low-lying in fairness strata
CONTEXT_DAYS = 7


@dataclass
class AuditStore:
    wards: pd.DataFrame
    roads: pd.DataFrame
    rate_card: pd.DataFrame
    contractors: pd.DataFrame
    complaints: pd.DataFrame
    wo: pd.DataFrame
    rain: pd.DataFrame
    tides: pd.DataFrame
    traffic: pd.DataFrame
    accidents: pd.DataFrame
    facilities: pd.DataFrame
    hotspots: pd.DataFrame
    localities: pd.DataFrame
    wards_geojson: dict
    data_hash: str
    issues: pd.DataFrame = None
    flags: list = field(default_factory=list)


def _csv(d: Path, name: str, dates=()) -> pd.DataFrame:
    return pd.read_csv(d / name, parse_dates=list(dates))


def bad_weather_days(rain: pd.DataFrame, tides: pd.DataFrame) -> set:
    # shortcut: uses the worse of the two rain stations for every ward, upgrade to a ward to station map if needed
    return set(rain.loc[rain.imd_category.isin(BAD_RAIN), "date"]) | set(tides.loc[tides.big_tide_flag == "Y", "date"])


def enrich_work_orders(wo, roads, rate_card, wards, complaints, bad_days) -> pd.DataFrame:
    wo = wo.copy()
    wo["links"] = wo.linked_complaint_ids.fillna("").map(lambda s: [x for x in s.split("|") if x])
    wo = wo.merge(roads[["road_id", "road_name", "under_dlp", "last_resurfaced", "bus_route"]], on="road_id", how="left")
    wo = wo.merge(rate_card, on="repair_method", how="left")
    wo = wo.merge(wards[["ward_code", "low_lying_index"]], on="ward_code", how="left")
    wo["expected_inr"] = np.where(wo.unit == "per sqm", wo.area_sqm * wo.standard_rate_inr, wo.standard_rate_inr)
    wo["ratio"] = wo.cost_inr / wo.expected_inr
    received = complaints.set_index("complaint_id").received_at
    wo["first_received_at"] = wo.links.map(lambda ids: min((received[i] for i in ids if i in received.index), default=pd.NaT))
    wo["first_received_at"] = pd.to_datetime(wo.first_received_at)
    wo["hours_taken"] = (wo.completed_at - wo.first_received_at).dt.total_seconds() / 3600
    wo["sla_met_actual"] = np.where(wo.hours_taken.isna(), None, np.where(wo.hours_taken <= wo.sla_hours, "Y", "N"))
    done = wo.completed_at.dt.normalize()
    wo["rain_context"] = [any(d + pd.Timedelta(days=k) in bad_days for k in range(CONTEXT_DAYS + 1)) for d in done]
    wo["low_lying"] = wo.low_lying_index >= LOW_LYING
    wo["reopened"] = wo.reopened_within_30d == "Y"
    # Recomputed SLA where we can, the reported one where no complaint is linked.
    wo["sla_ok"] = np.where(wo.sla_met_actual.isna(), wo.sla_met == "Y", wo.sla_met_actual == "Y")
    wo["month"] = wo.completed_at.dt.strftime("%Y-%m")
    return wo


def _hash_dir(d: Path) -> str:
    h = hashlib.sha256()
    for p in sorted(d.glob("*.csv")):
        h.update(p.name.encode())
        h.update(p.read_bytes())
    return h.hexdigest()[:16]


def load_store(data_dir: str | os.PathLike | None = None) -> AuditStore:
    from app.audit import flags, trail  # local import: both modules import this one
    from app.audit.scorecards import with_expected

    d = Path(data_dir or os.getenv("DATA_DIR") or DEFAULT_DATA_DIR)
    wards = _csv(d, "wards.csv")
    roads = _csv(d, "roads.csv", ["last_resurfaced"])
    rate_card = _csv(d, "rate_card.csv")
    complaints = _csv(d, "complaints.csv", ["received_at", "resolved_at"])
    rain = _csv(d, "rainfall_daily.csv", ["date"])
    tides = _csv(d, "tides.csv", ["date"])
    wo = _csv(d, "work_orders.csv", ["assigned_at", "work_started_at", "completed_at"])
    store = AuditStore(
        wards=wards,
        roads=roads,
        rate_card=rate_card,
        contractors=_csv(d, "contractors.csv"),
        complaints=complaints,
        wo=with_expected(enrich_work_orders(wo, roads, rate_card, wards, complaints, bad_weather_days(rain, tides))),
        rain=rain,
        tides=tides,
        traffic=_csv(d, "traffic.csv"),
        accidents=_csv(d, "accidents.csv", ["occurred_at"]),
        facilities=_csv(d, "facilities.csv"),
        hotspots=_csv(d, "flood_hotspots.csv"),
        localities=_csv(d, "localities.csv"),
        wards_geojson=json.loads((d / "wards.geojson").read_text()),
        data_hash=_hash_dir(d),
    )
    trail.build(store)
    store.flags = flags.all_flags(store)
    return store
