# Follow the Rupee API contract

The backend and frontend both build against this file. All routes sit under `/api/v1/audit`. Responses are JSON unless noted.

Conventions:
- Money is integer rupees (`*_inr`). Rates and shares are floats from 0 to 1.
- Ward codes contain `/` (for example `F/S`). Routes take them with the `{code:path}` converter, so the frontend sends `F/S` raw: `/api/v1/audit/wards/F/S`.
- Dates are ISO strings, IST, no offset (`2025-07-07T06:05`).
- Every response that makes a claim carries the ids behind it (`wo_ids`, `complaint_ids`).
- Unknown ids return 404 `{"detail": "..."}`.

## Shared shapes

```jsonc
// Flag
{
  "flag_id": "OVERBILL-WO25-00123",
  "rule": "overbilling",        // overbilling | area_outlier | double_billing | dlp_paid | sla_misreported | sla_missed | timeline_impossible | repeat_failure | resolved_without_work
  "severity": "high",           // high | medium | low
  "wo_id": "WO25-00123",        // null for complaint-level rules
  "complaint_ids": [],
  "ward_code": "H/E",
  "road_id": "RD0101",
  "contractor_id": "CT03",
  "reason": "Billed 2.4x the rate card for Hot mix patch (normal range is 0.7x to 1.3x).",
  "evidence": { "cost_inr": 93600, "expected_inr": 39000, "ratio": 2.4, "related_wo_ids": [] },
  "amount_at_risk_inr": 54600
}

// Rate with fairness context
{
  "observed": 0.31, "expected": 0.22, "ci_low": 0.24, "ci_high": 0.39,
  "n": 120, "judgeable": true      // judgeable is false when n < 15
}

// Scorecard
{
  "id": "CT03", "name": "Mahalaxmi Civil Contractors (synthetic)", "kind": "contractor", // or "ward"
  "jobs": 310, "spend_inr": 15400000,
  "sla_met": Rate, "reopened": Rate,
  "median_cost_ratio": 1.04,
  "flags": { "total": 12, "by_rule": { "overbilling": 4 } },
  "amount_at_risk_inr": 380000,
  "verdict": "plain-language text under 120 words, no accusations",
  "evidence_wo_ids": ["WO25-00123"]
}
```

## Endpoints

### `GET /audit/overview`
City totals: `{ "budget_inr", "spend_inr", "failed_fix_spend_inr", "amount_at_risk_inr", "flags_by_rule": {}, "complaints": int, "issues": int, "never_fixed_issues": int, "work_orders": int }`

### `GET /audit/wards`
List for the map. Each item:
`{ "ward_code", "ward_name", "zone", "budget_inr", "spend_inr", "spend_share", "failed_fix_spend_inr", "failed_fix_share", "reopen_rate", "flag_count", "amount_at_risk_inr", "low_lying_index", "open_issues" }`

### `GET /audit/wards.geojson`
The ward polygons (FeatureCollection) with `properties.ward_code` and `properties.ward_name`.

### `GET /audit/wards/{code}`
```jsonc
{
  "ward": { /* same item as /audit/wards */, "population_est", "engineering_crews", "localities": [] },
  "money_trail": {
    "by_contractor": [{ "contractor_id", "contractor_name", "spend_inr", "jobs", "failed_fix_spend_inr" }],
    "by_method":     [{ "repair_method", "spend_inr", "jobs", "reopen_rate" }],
    "by_month":      [{ "month": "2025-07", "spend_inr", "jobs" }]
  },
  "flags": [Flag],
  "scorecard": Scorecard,          // kind "ward"
  "contractors": [Scorecard],      // contractors that worked in this ward, ward-scoped numbers
  "context": { "heavy_rain_days": int, "big_tide_days": int, "flood_hotspots": int, "low_lying_index": 0.55 }
}
```

### `GET /audit/contractors` and `GET /audit/contractors/{id}`
A list of `Scorecard`, or one `Scorecard` plus `"flags": [Flag]` and `"wards": [{ "ward_code", "jobs", "spend_inr" }]`. In the detail view `flags` is the list, and the `{ total, by_rule }` summary moves to `"flag_summary"`.

### `GET /audit/flags?ward=&rule=&contractor=&severity=`
`{ "count": int, "flags": [Flag] }`, sorted by severity, then `amount_at_risk_inr` descending.

### `GET /audit/export/flags.csv`
CSV with columns `flag_id,rule,severity,wo_id,complaint_ids,ward_code,road_id,contractor_id,amount_at_risk_inr,reason`.

### `GET /audit/next-rupee/{code}`
```jsonc
{
  "ward_code": "H/E",
  "budget_inr": 4300000, "spent_inr": 3900000, "remaining_inr": 400000,
  "plan": [{
    "rank": 1,                    // by risk_score; funded comes from a greedy pass by risk per rupee
    "road_id": "RD0101", "road_name": "...", "issue_ids": ["ISS-..."], "work_type": "Pothole",
    "method": "Mastic asphalt", "method_reopen_rate": 0.08,
    "est_cost_inr": 84000, "funded": true,
    "pay_from": "bmc",            // bmc | dlp_contractor (DLP roads cost BMC 0)
    "risk_score": 0.82,
    "risk_parts": { "severity": 0.3, "flood": 0.2, "rain_tide": 0.1, "traffic": 0.12, "accidents": 0.05, "facilities": 0.05 },
    "why": "one plain line"
  }],
  "unfunded_count": int,
  "note": "string or null"        // set when remaining_inr <= 0: no BMC money left, only DLP items go ahead
}
```

### `GET /audit/complaints`
Every complaint whose CSV row has `lat` and `lon`, for the map. Compact rows, in the order of `fields`:
```jsonc
{ "fields": ["complaint_id", "lat", "lon", "ward_code", "issue_state"],
  "rows": [["BMC25-000005", 19.000536, 72.834779, "F/S", "fixed"]] }   // issue_state: fixed|fixed_reopened|never_fixed|open
```

### `GET /audit/complaints/{complaint_id}`
The citizen trail:
```jsonc
{
  "complaint": { "complaint_id", "received_at", "channel", "category_reported", "category_clean", "description", "language", "locality_text", "ward_code", "ward_code_inferred": bool, "status" },
  "issue": { "issue_id", "complaint_ids": [], "duplicates": int, "state": "fixed|fixed_reopened|never_fixed|open" },
  "work_orders": [{ "wo_id", "contractor_name", "repair_method", "cost_inr", "assigned_at", "completed_at", "sla_hours", "hours_taken", "sla_met_reported", "sla_met_actual", "reopened_within_30d", "under_dlp", "flags": [Flag] }],
  "summary": "plain one-paragraph template text"
}
```

### `GET /audit/search?q=`
Look up by complaint id, WO id, road name or locality (Devanagari aliases count). Returns `{ "results": [{ "type": "complaint|work_order|road|ward", "id", "label", "ward_code" }] }`, at most 10.

### `POST /audit/ask`
Body `{ "question": "माझ्या तक्रारीचं काय झालं? BMC25-001657", "complaint_id": null, "ward_code": null }`. Returns `{ "answer", "language", "source": "claude|template", "complaint_ids": [], "wo_ids": [] }`.

### `POST /audit/wards/{code}/summary`
Returns `{ "summary_markdown", "source": "claude|template", "wo_ids": [] }`. Cached per ward.

### `GET /complaints/counts?parent_geo_unit_id=` (UI fix Phase 5, existing CivicLens DB)
`{ "<geo_unit_id>": count }`
