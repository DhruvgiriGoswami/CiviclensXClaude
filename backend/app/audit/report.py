"""Print the audit summary: `uv run python -m app.audit.report [ward ...]`. See THRESHOLDS.md for the cutoffs."""

import sys
from collections import Counter

import numpy as np

from app.audit import budget
from app.audit.flags import NORMAL_RANGE, OVERBILL_RATIO, amount_at_risk
from app.audit.load import load_store

BINS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.33, 1.4, 1.5, 2.0, 2.5, 3.5]


def main(wards: list[str]) -> None:
    s = load_store()
    total = int(s.wo.cost_inr.sum())
    assert 12e7 <= total <= 14e7, f"total spend Rs {total:,} is not the roughly Rs 13 crore the README promises"
    print(f"Total spend Rs {total:,} ({total / 1e7:.2f} crore) across {len(s.wo)} work orders")
    print(f"Complaints {len(s.complaints)}, issues {len(s.issues)}: {dict(s.issues.state.value_counts())}")
    print(f"\nFlags by rule (Rs at risk, no double counting: {amount_at_risk(s.flags):,})")
    for rule, n in Counter(f["rule"] for f in s.flags).most_common():
        fl = [f for f in s.flags if f["rule"] == rule]
        print(f"  {rule:22} {n:5}  Rs {sum(f['amount_at_risk_inr'] for f in fl):>12,}")

    print(f"\nCost / rate card ratio per method (cutoff {OVERBILL_RATIO}x, normal {NORMAL_RANGE})")
    print("  bins " + " ".join(f"{b:>5}" for b in BINS[:-1]))
    for m, g in s.wo.groupby("repair_method"):
        h, _ = np.histogram(g.ratio, bins=BINS)
        print(f"  {m[:38]:38} " + " ".join(f"{x:>5}" for x in h) + f"   max normal {g.ratio[g.ratio <= OVERBILL_RATIO].max():.3f}")

    print("\nTop flags")
    for f in s.flags[:10]:
        print(f"  [{f['severity']}] {f['flag_id']}: {f['reason']} (Rs {f['amount_at_risk_inr']:,})")

    for code in wards:
        p = budget.plan(s, code)
        print(f"\nNext rupee for {code}: budget Rs {p['budget_inr']:,}, spent Rs {p['spent_inr']:,}, remaining Rs {p['remaining_inr']:,}")
        if p["note"]:
            print(f"  {p['note']}")
        for x in p["plan"][:5]:
            print(f"  {x['rank']}. [{'funded' if x['funded'] else 'unfunded'}] risk {x['risk_score']:.2f}, Rs {x['est_cost_inr']:,} "
                  f"({x['pay_from']}): {x['why']}")


if __name__ == "__main__":
    main(sys.argv[1:] or ["F/S", "L", "H/E"])
