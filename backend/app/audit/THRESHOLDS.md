# Audit thresholds and why

Every number here was read off the real data with `uv run python -m app.audit.report`.

| Rule | Threshold | Why |
|---|---|---|
| overbilling | cost / rate card above 1.33x; high from 1.5x | All 2,385 ordinary jobs sit between 0.75x and 1.30x, flat across that band, for every method. Nothing lies between 1.30x and 1.35x except one repeat bill (1.32x), so 1.33x sits in the empty gap. 113 jobs sit above it, most of them at 1.5x to 3.1x. Per sqm methods use area x rate, per job methods use the rate. Amount at risk is cost minus the rate card cost. |
| area_outlier | area above Q3 + 3 x IQR for the method, or zero | Patch areas run 0.5 to 12 sqm and per job areas 2 to 40 sqm with no tail, so this fires on nothing in this dataset. It stays in as a guard. |
| double_billing | a job with no linked complaint, same road and same method as a job assigned 1 to 7 days earlier | All 45 jobs with no linked complaint repeat an earlier job exactly 1, 2, 3 or 4 days later with the same contractor and area and a cost within a few percent. No job with linked complaints shows that pattern. The 7 day window leaves headroom. Amount at risk is the whole repeat bill. |
| dlp_paid | road `under_dlp = Y`, BMC paid, work after `last_resurfaced` | Every DLP road was resurfaced in 2023 to 2025 and every job on them falls after that date, so the date check removes nothing. Surface work (potholes, paver blocks, cave-ins) is high severity; drainage work on a DLP road is medium because it may sit outside the road contract. Amount at risk is the bill. |
| sla_misreported | reported SLA met, but first linked complaint to completion took longer than `sla_hours` | Recomputed for every job with a linked complaint. Zero cases: the reported flag matches the recomputed one everywhere it can be checked. |
| sla_missed | more than 3x `sla_hours` from the first complaint | Half of all jobs miss their SLA, and the overrun is a smooth spread, not a planted cluster. Only gross misses are flagged, at low severity, with rain context noted. |
| timeline_impossible | start before assignment, completion before start or before the first complaint, or assignment more than 48 h before the first complaint | No job breaks these in this data. Assignment up to a day before the first linked complaint is common and smooth, so it is not flagged. |
| repeat_failure | same road and work type reopened within 30 days 4 or more times | Roads average about 2 reopened jobs in the season. A single reopen is an outcome, not a flag; four on the same road and work type points to the method or the road, and goes to the planner. |
| resolved_without_work | complaint marked Resolved with no work order, or linked to a job that finished more than 72 h before the complaint came in | Late duplicates within a day or two of the fix are normal. A report several days after the fix that is still closed as Resolved suggests the problem came back. |

## Fairness

Scorecards compare each contractor or ward with peers in the same stratum: repair method x heavy rain or big tide within 7 days after completion x low-lying ward (index 0.6 or more). Expected rates are the mean peer rate over the entity's own jobs (indirect standardisation). Rates carry Wilson 95% intervals and are only called better or worse than peers when the interval excludes the expected rate. Fewer than 15 jobs is not judgeable.

## Complaint categories

Checked against the work type of the job each complaint is linked to: helpline operator notes are right about 99% of the time, photo descriptions about 92%, the citizen's own pick about 88%, and free text from app users only about 65%. The cleaner uses them in that order, and a linked job's work type overrides all of them.
