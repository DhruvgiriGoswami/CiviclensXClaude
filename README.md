# Follow the Rupee

Mumbai spends crores every monsoon fixing the same roads. This tool takes one season of repair records and answers three questions for each ward: where the money went, whether the fixes held, and where the next rupee should go.

It is called CivicLens, a civic transparency app, and runs on the synthetic dataset from the Claude Impact Lab Mumbai hackathon (24 wards, 2,499 work orders, 6,501 complaints).

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

## Where the map comes from

The ward map on the page is drawn from `data/wards.geojson`, the 24 ward shapes that ship with the hackathon dataset. They aren't official BMC boundaries. The data dictionary describes them as a Voronoi approximation around each ward's centre: every point on the map belongs to the ward whose centre is nearest. They are still consistent with the data, because a complaint's GPS point falls inside the ward its `ward_code` names. The cleaner uses that to fill in missing ward codes.

The file travels like this:

1. The backend reads `wards.geojson` once at startup along with the CSVs, and serves it unchanged at `GET /api/v1/audit/wards.geojson`.
2. The page fetches it alongside the city totals and the ward list.
3. `WardMap.jsx` turns longitude and latitude into SVG coordinates with a flat projection. It shrinks longitude by the cosine of Mumbai's latitude so the city isn't stretched sideways. Each ward becomes one SVG `path`, and the bigger wards get a label at their centre.
4. Each ward is shaded by the measure you pick, failed-fix share or amount at risk, in five equal steps from the lowest ward to the highest, on a light-to-dark red scale. Wards with no value stay grey.
5. On top sit the complaints. 3,777 of the 6,501 rows in `complaints.csv` carry a GPS point (mostly the app reports), and each one is a dot placed with its own `lat` and `lon` through the same projection. The colour is the state of the issue it belongs to: still open, closed with no work, fixed then failed, or fixed and holding. Click a dot to get a card with the complaint, the latest work order, its cost and whether it held, plus a link to the full trail. A checkbox under the map hides the dots. Complaints without GPS aren't placed at a guessed spot; you find them through search.

The same dots appear on the main CivicLens Google map (`useAuditComplaintDots.js`) once you zoom in to city level, for example through Maharashtra, Mumbai City and then BMC. Clicking one there opens the same card in the map's info window.

No tiles, map library or API key are involved. The offline mock carries its own copy of the same shapes, so the map still draws when the backend is down. `data/roads.geojson` is in the dataset, but the page doesn't draw it.

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
cp .env.example .env.secrets   # add ANTHROPIC_API_KEY; empty gives the template text
uv run --env-file .env.secrets uvicorn app.main:app --port 8000
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

Architecture, modules and the data flow are in [`ARCHITECTURE.md`](ARCHITECTURE.md).

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
| `GET /complaints` | Every complaint with GPS, as compact rows for the map |
| `GET /complaints/{id}` | Complaint to issue to work order to contractor |
| `GET /search?q=` | Complaint, work order, road or locality lookup |
| `POST /ask` | Citizen question, answered by Claude |
| `POST /wards/{code}/summary` | Corporator brief, written by Claude |

Ward codes contain a slash (`F/S`). Pass them raw: `/api/v1/audit/wards/F/S`.

## FAQ

**Is this real BMC data?**
No. The whole dataset is synthetic, and every contractor is fictional, which is why each name ends in "(synthetic)". The page carries a banner saying so.

**Why isn't the map on Google Maps?**
The ward shapes are approximations, and so are the road coordinates. Laid over real streets, they would cut across real roads and look more exact than they are. A plain drawing makes no claim about real geography. It also means anyone can clone the repo and see the map without a key. The rest of CivicLens, outside this page, still uses Google Maps.

**Does a flag mean someone committed fraud?**
No. A flag means a bill or record is worth a second look. Each one names the work order, gives the rule it broke and shows the numbers, so a ward officer can check it. Rain, tides and low-lying wards are stated next to the numbers, and the text describes the record without blaming anyone.

**How did you pick the thresholds?**
From gaps in the data, because the hackathon answer key isn't public. For overbilling, no job sits between 1.30x and 1.35x the rate card, so the cutoff is 1.33x, inside that gap. `backend/app/audit/THRESHOLDS.md` covers every rule, including the three that found nothing.

**Why are there 493 DLP flags? Isn't that too many?**
Each one is a job where BMC paid for work on a road still under its defect liability period, when the original contractor should have done it for free. About 21% of roads are under DLP, and every contractor has between 16% and 25% of its jobs on them. So this is a payment problem spread across the city, not one contractor.

**Isn't it unfair to compare a contractor in a flood-prone ward with one in a dry ward?**
That's why the scorecards don't do it. Each contractor is compared with peers who used the same repair method, under the same rain or tide conditions, in the same kind of ward. Scores are rates per job, so a busy contractor isn't punished for doing more work. Below 15 jobs, the scorecard says there isn't enough to judge.

**Why does the plan sometimes pick a more expensive repair?**
The plan picks the method whose fixes reopened least for that kind of work. Hot mix reopened 22.6% of the time against 32.2% for cold mix, so a pothole gets hot mix even though it costs more. A patch that fails and has to be redone costs more in the end.

**What happens when a ward has already spent its whole budget?**
The plan says so at the top. Only repairs on DLP roads go ahead, because the original contractor pays for those. Everything else stays on the list as unfunded, in order of risk.

**Can Claude make up numbers?**
Claude only sees the JSON the audit engine has already computed, and it's told to cite a work order for every claim. A language model can still get a detail wrong. That's why every answer lists the work order ids it used, and the page links to the full trail so you can check.

**Which languages can citizens ask in?**
English, Hindi, Marathi and Hinglish. The backend works out the language from the question before calling Claude, and the answer comes back in the same one.

**Do I need an API key or a database to try it?**
Neither. Without `ANTHROPIC_API_KEY`, the brief and the citizen answers use template text built from the same numbers, and the page labels them as templates. The audit reads CSVs, so it needs no database. Only the rest of CivicLens uses PostgreSQL.

**Does every question cost an API call?**
Citizen answers aren't cached, so each one is a fresh call to Claude. Ward briefs are cached on disk per ward and are only written again when the data changes.

**Why do the numbers change when the backend is off?**
The page then switches to an offline mock built from the same CSVs with simpler rules. Its numbers are close to the real audit but won't match it. A label on the page tells you which source you're seeing.

**How can I check the results myself?**
Download every flag from `/api/v1/audit/export/flags.csv`, or run `uv run python -m app.audit.report` in `backend/` for counts per rule and the top items. Each flag's work order id leads back to `data/work_orders.csv`.

**Why does a ward code like `F/S` work in a URL?**
The routes accept the slash as part of the path, so `/api/v1/audit/wards/F/S` works as written.

## Known limits

- `social_posts.csv` feeds only the News tab in the sidebar (`GET /api/v1/audit/social-posts`). The posts are shown as written; they are not linked to complaints or used by the audit.
- The rain context barely separates jobs: about 85% of them fall in a week with heavy rain or a big tide. The fairness adjustment works, but it moves scores less than it would with more varied weather.
- Three rules (`area_outlier`, `sla_misreported`, `timeline_impossible`) found nothing in this data. They stay in as guards.
- Search can't open a work order's own trail, so it opens the ward's flags on that job instead.
- The CSV export has no ward filter.

## Data and licence

The data in `data/` is from [Claude-Impact-Labs-data-2](https://github.com/SumeetGDoshi/Claude-Impact-Labs-data-2), released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It is synthetic. It is not BMC data, and the contractors are fictional. `data/DATA_DICTIONARY.md` describes every column.
