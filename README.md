# Follow the Rupee

Mumbai spends crores every monsoon fixing the same roads. This tool takes one season of repair records and answers three questions for each ward: where the money went, whether the fixes held, and where the next rupee should go.

It is built on CivicLens, a civic transparency app, and runs on the synthetic dataset from the Claude Impact Lab Mumbai hackathon (24 wards, 2,499 work orders, 6,501 complaints).

> Synthetic data. These are not BMC records, and every contractor is fictional. Don't use anything here to judge a real person, contractor or department.

## What the audit found

| Measure | Amount |
|---|---|
| Monsoon repair budget, all wards | ₹14.91 crore |
| Spent | ₹13.43 crore on 2,499 work orders |
| Spent on fixes that failed within 30 days | ₹3.07 crore |
| Money in bills worth checking | ₹3.35 crore |
| Audit flags | 908 |

The flags by rule:

| Rule | Flags | What it catches |
|---|---|---|
| `dlp_paid` | 493 | BMC paid for work on a road still under its defect liability period, where the original contractor should repair it for free |
| `sla_missed` | 228 | Repairs that took more than 3x their target time, counted from the first complaint |
| `overbilling` | 113 | Bills above 1.33x the rate card |
| `double_billing` | 45 | The same job billed again 1 to 4 days later with no complaint behind it |
| `repeat_failure` | 21 | The same road and work type reopened 4 or more times |
| `resolved_without_work` | 8 | Complaints closed as Resolved with no repair behind them |

Two contractors stand out on overbilling: CT03 and CT07 have 14.5% and 11.6% of their jobs above the cutoff. Every other contractor is near 1.5%.

The DLP flags don't point at anyone in particular. Every contractor has 16% to 25% of its jobs on DLP roads, so it isn't one firm's habit. The flags point at the payments, which BMC should not have made.

Every flag carries the work order id, a one-line reason and the numbers behind it. The full list downloads as CSV from `/api/v1/audit/export/flags.csv`.

## How it works

The engine lives in `backend/app/audit/`. It loads the CSVs from `data/` into memory when the server starts. It doesn't need a database.

**Connect** (`trail.py`). It fills a blank ward code from the locality, using the Devanagari aliases as well as English. Failing that, it places the complaint's GPS point inside the ward map. It corrects wrong or vague complaint categories, trusting sources in the order they proved accurate against the linked jobs: helpline notes (about 99% right), photo descriptions (92%), the citizen's own pick (88%), then app free text (65%). It groups duplicate complaints into issues and follows each issue to its work orders, contractor and cost. That leaves 3,027 issues from 6,501 complaints.

**Audit** (`flags.py`). One function per rule. Each threshold was read off the real distribution, not guessed. For overbilling, all 2,385 ordinary jobs sit between 0.75x and 1.30x the rate card. That matches the dataset's note that normal jobs vary by 20% to 30%. Nothing falls between 1.30x and 1.35x, so the cutoff sits in that gap at 1.33x. The reasoning for every rule, including the three that found nothing in this data, is in [`backend/app/audit/THRESHOLDS.md`](backend/app/audit/THRESHOLDS.md).

**Hold to account** (`scorecards.py`). Patching a low-lying road in a heavy-rain week is harder than patching a dry one, so each contractor and ward is compared with peers who faced the same conditions: the same repair method, heavy rain or a big tide within 7 days after the job, and a low-lying or ordinary ward. The expected rate is what those peers achieved on the same mix of jobs (indirect standardisation). Rates carry Wilson 95% intervals. A score is called better or worse than peers only when the interval rules out the expected rate. With fewer than 15 jobs, the scorecard says there isn't enough to judge. Scores use rates per job, so nobody is punished for doing more work. The scorecard text describes the record and doesn't accuse anyone.

**Budget smarter** (`budget.py`). For each ward, the planner takes the budget, subtracts what was spent, and lists open issues and roads where fixes keep failing. Each item gets a risk score, the sum of six parts, each shown on screen:

| Part | Weight |
|---|---|
| Severity of the problem | 0.30 |
| Flood hotspot within 500 m | 0.20 |
| Low-lying ward, tide-sensitive spot | 0.10 |
| Congestion and bus route | 0.15 |
| Accidents caused by road defects | 0.15 |
| Ambulance route to a hospital, or school access | 0.10 |

The planner picks the repair method with the lowest reopen rate for that kind of work, using methods with at least 20 jobs. That favours repairs that last over the cheapest patch: hot mix (22.6% reopened) over cold mix (32.2%) for potholes, and a dewatering pump (14%) over drain desilting (26%) for waterlogging. Cost comes from the rate card times the typical area. A road under DLP costs BMC nothing, because the original contractor has to fix it. Items are funded in order of risk per rupee until the remaining budget runs out. If a ward has already overspent, the plan says so, and only DLP repairs go ahead.

## Where Claude comes in

Claude (`claude-sonnet-5-5`) writes two things, both from the computed audit JSON and nothing else:

- **A one-page brief for a ward corporator**: where the money went, which fixes failed, what to check and where to spend next. Every claim cites its work order id.
- **An answer for a citizen asking what happened to their complaint**, in their own language: English, Hindi, Marathi or Hinglish. It covers the work order, contractor, cost, whether the target time was met and whether the fix held.

Ask "माझ्या तक्रारीचं काय झालं? BMC25-002653" and the answer comes back in Marathi. It names work order WO25-01011, ₹2,46,513, a 72-hour target missed at 110 hours, a fix that held, and a bill 2.24x the rate card that is worth a check.

Without an API key, or if a call fails, both features fall back to template text built from the same numbers, so the page always works. The page labels each answer with its source.

## Run it

You need [uv](https://docs.astral.sh/uv/) and Node (tested on Node 24).

```bash
# backend, on http://localhost:8000
cd backend
uv sync
export ANTHROPIC_API_KEY=...   # optional: without it you get the template text
uv run uvicorn app.main:app --port 8000
```

```bash
# frontend, on http://localhost:3000
cd frontend
npm install
npm run dev -- --port 3000
```

Open http://localhost:3000/follow-the-rupee. If the backend isn't running, the page falls back to a mock built from the same CSVs. The mock is a rough stand-in, so its numbers won't match the real audit. `VITE_AUDIT_MOCK=1` forces the mock.

The audit doesn't need a database. The rest of CivicLens (the map of representatives, complaints, budgets) needs PostgreSQL with PostGIS. See `backend/docker-compose.yml`.

To print flag counts and top items from the command line:

```bash
cd backend && uv run python -m app.audit.report
```

## Tests

```bash
cd backend && uv run pytest     # 109 tests: one or more per rule, plus end to end on the real data
cd frontend && npm test         # unit tests
cd frontend && npm run e2e      # Playwright; the @live test runs when the backend is up on :8000
```

The backend's end-to-end tests start the real FastAPI app, load the real CSVs and call every `/audit` endpoint. They check the response shapes, that each rule fires on known rows, and that the plan stays within budget.

## API

All routes sit under `/api/v1/audit`. The full contract is in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

| Route | Returns |
|---|---|
| `GET /overview` | City totals |
| `GET /wards`, `/wards/{code}` | Per-ward money trail, flags, scorecards, context |
| `GET /contractors`, `/contractors/{id}` | Contractor scorecards |
| `GET /flags` | Flags, filterable by ward, rule, contractor and severity |
| `GET /export/flags.csv` | Every flag as CSV |
| `GET /next-rupee/{code}` | The ranked plan for a ward |
| `GET /complaints/{id}` | Complaint to issue to work order to contractor |
| `GET /search?q=` | Complaint, work order, road or locality lookup |
| `POST /ask` | Citizen question, answered by Claude |
| `POST /wards/{code}/summary` | Corporator brief, written by Claude |

Ward codes contain a slash (`F/S`). Pass them raw: `/api/v1/audit/wards/F/S`.

## Known limits

- `social_posts.csv` is not used.
- The rain context barely separates jobs: about 85% of them fall in a week with heavy rain or a big tide. The fairness adjustment works, but it moves scores less than it would with more varied weather.
- Three rules (`area_outlier`, `sla_misreported`, `timeline_impossible`) found nothing in this data. They stay in as guards.
- Search can't open a work order's own trail, so it opens the ward's flags on that job instead.
- The CSV export has no ward filter.

## Data and licence

The data in `data/` is from [Claude-Impact-Labs-data-2](https://github.com/SumeetGDoshi/Claude-Impact-Labs-data-2), released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is synthetic. It is not BMC data, and the contractors are fictional. `data/DATA_DICTIONARY.md` describes every column.
