"""Claude features: the corporator ward brief and the citizen "what happened to my complaint" answer.

Both are built only from the computed audit JSON. Without ANTHROPIC_API_KEY (or on any API error) they fall
back to template text from the same JSON, marked source "template".
"""

import json
import os
import re
from pathlib import Path

import anthropic

from app.audit import budget, views
from app.audit.trail import _norm, locality_index

MODEL = "claude-sonnet-5-5"
CACHE_DIR = Path(__file__).resolve().parents[2] / ".audit_cache"
WO_RX = re.compile(r"WO25-\d{5}")
CID_RX = re.compile(r"BMC25-\d{6}", re.I)
DEVANAGARI = re.compile(r"[ऀ-ॿ]")
MARATHI_HINTS = ("माझ्या", "माझी", "माझा", "माझं", "तक्रार", "झालं", "झाले", "आहे", "काय", "नाही", "केव्हा", "कधी", "कुठे")
HINGLISH_HINTS = ("kya", "hua", "meri", "mera", "kab", "kaha", "nahi", "hai", "kyun", "shikayat", "kuch")

RULES = ("Use only facts in the JSON. Cite the work order id (WO25-...) behind every claim. Never accuse anyone: "
         "describe what the record shows, and mention context such as heavy rain, big tides or a low-lying ward. "
         "Plain language a non-expert can follow. No em dashes.")


def _call(system: str, user: str, max_tokens: int = 4000) -> str | None:
    if not os.getenv("ANTHROPIC_API_KEY"):
        return None
    try:
        client = anthropic.Anthropic(timeout=90.0)
        # Sonnet 5.5 only: no server-side model fallback; a refusal falls back to the template instead.
        resp = client.messages.create(
            model=MODEL, max_tokens=max_tokens, system=system,
            messages=[{"role": "user", "content": user}],
            output_config={"effort": "medium"},
        )
    except anthropic.APIError:
        return None  # any API failure falls back to the template
    if resp.stop_reason == "refusal":
        return None
    text = "".join(b.text for b in resp.content if b.type == "text").strip()
    return text or None


# Ward brief --------------------------------------------------------------------------------------------------

def ward_facts(s, code: str) -> dict:
    d = views.ward_detail(s, code)
    p = budget.plan(s, code)
    return {
        "ward": d["ward"], "context": d["context"], "money_trail": d["money_trail"],
        "scorecard": d["scorecard"],
        "contractors": [{k: c[k] for k in ("id", "name", "jobs", "spend_inr", "sla_met", "reopened", "median_cost_ratio",
                                           "flags", "amount_at_risk_inr")} for c in d["contractors"]],
        "top_flags": [{k: f[k] for k in ("wo_id", "rule", "severity", "reason", "amount_at_risk_inr")} for f in d["flags"][:15]],
        "flag_counts": d["scorecard"]["flags"]["by_rule"],
        "next_rupee": {k: p[k] for k in ("budget_inr", "spent_inr", "remaining_inr", "unfunded_count", "note")}
        | {"top": [{k: x[k] for k in ("road_name", "work_type", "method", "est_cost_inr", "pay_from", "funded", "why")}
                   for x in p["plan"][:5]]},
    }


def template_brief(f: dict) -> str:
    w, ctx, sc = f["ward"], f["context"], f["scorecard"]
    lines = [f"# Ward {w['ward_code']}: {w['ward_name']}", "",
             f"**Money.** Budget Rs {w['budget_inr']:,}, spent Rs {w['spend_inr']:,} ({w['spend_share']:.0%}). "
             f"Rs {w['failed_fix_spend_inr']:,} ({w['failed_fix_share']:.0%}) went on fixes that failed within 30 days.", "",
             f"**Context.** Low-lying index {ctx['low_lying_index']:.2f}, {ctx['flood_hotspots']} flood hotspots, "
             f"{ctx['heavy_rain_days']} heavy rain days and {ctx['big_tide_days']} big tide days this season. "
             "Scores below are compared with peers who faced the same method, weather and ward conditions.", "",
             f"**Scorecard.** {sc['verdict']}", "", "**Who did the work.**"]
    for c in f["money_trail"]["by_contractor"]:
        lines.append(f"- {c['contractor_name']}: {c['jobs']} jobs, Rs {c['spend_inr']:,}, of which Rs {c['failed_fix_spend_inr']:,} on failed fixes.")
    lines += ["", f"**Things to check ({sum(f['flag_counts'].values())} audit notes).**"]
    for fl in f["top_flags"][:8]:
        lines.append(f"- {fl['wo_id'] or ''} ({fl['rule']}): {fl['reason']}")
    nr = f["next_rupee"]
    lines += ["", f"**Next rupee.** Remaining budget Rs {nr['remaining_inr']:,}." + (f" {nr['note']}" if nr["note"] else "")]
    for x in nr["top"]:
        payer = "paid by the DLP contractor" if x["pay_from"] == "dlp_contractor" else f"Rs {x['est_cost_inr']:,}"
        lines.append(f"- {x['work_type']} on {x['road_name']} with {x['method']} ({payer}{'' if x['funded'] else ', not funded yet'}).")
    return "\n".join(lines)


def ward_summary(s, code: str) -> dict:
    mode = "claude" if os.getenv("ANTHROPIC_API_KEY") else "template"
    path = CACHE_DIR / f"{s.data_hash}_{mode}_{code.replace('/', '_')}.json"
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError):
        pass
    facts = ward_facts(s, code)
    text = _call(
        "You write a one-page brief for a Mumbai ward corporator about monsoon road repair money. " + RULES
        + " Use Markdown with short sections: where the money went, did the fixes last, contractors, things to check, "
          "where the next rupee should go.",
        json.dumps(facts, default=str))
    out = {"summary_markdown": text or template_brief(facts), "source": "claude" if text else "template"}
    out["wo_ids"] = sorted(set(WO_RX.findall(out["summary_markdown"])))
    if out["source"] == mode:  # don't cache a template that only stands in for a failed Claude call
        CACHE_DIR.mkdir(exist_ok=True)
        path.write_text(json.dumps(out, ensure_ascii=False))
    return out


# Citizen question --------------------------------------------------------------------------------------------

def detect_language(text: str) -> str:
    t = text or ""
    if DEVANAGARI.search(t):
        words = re.findall(r"[\u0900-\u097F]+", t)
        return "mr" if any(w.startswith(MARATHI_HINTS) for w in words) else "hi"
    words = set(re.findall(r"[a-z]+", t.lower()))
    return "hi-en" if words & set(HINGLISH_HINTS) else "en"


def find_complaint(s, question: str, complaint_id: str | None, ward_code: str | None) -> str | None:
    if complaint_id:
        return complaint_id
    m = CID_RX.search(question or "")
    if m:
        return m.group(0).upper()
    q = _norm(question)
    hits = [v[3] for k, v in locality_index(s.localities).items() if len(k) >= 4 and k in q]
    if not hits:
        return None
    c = s.complaints[s.complaints.locality_clean.isin(hits)]
    if ward_code:
        c = c[c.ward_code == ward_code]
    return None if c.empty else c.sort_values("received_at").complaint_id.iat[-1]


TEMPLATES = {
    "en": {
        "done": "Your complaint {cid} ({cat} at {loc}) was handled under work order {wo} by {contractor}. Cost: Rs {cost}. "
                "Target time {sla} h: {met} ({hours} h from your complaint). The repair {held}.",
        "met": "met", "missed": "missed", "held": "has held so far", "failed": "failed within 30 days and was reopened",
        "none": "Your complaint {cid} ({cat} at {loc}) has no work order linked yet. Current status: {status}.",
        "notfound": "I could not find a complaint in your message. Please share the complaint number, for example BMC25-001657.",
        "flags": " The audit has {n} note(s) on this job.",
    },
    "hi-en": {
        "done": "Aapki complaint {cid} ({loc}) ka kaam work order {wo} mein {contractor} ne kiya. Kharcha: Rs {cost}. "
                "{sla} ghante ki SLA: {met} ({hours} ghante lage). Repair {held}.",
        "met": "poori hui", "missed": "miss ho gayi", "held": "abhi tak tika hai", "failed": "30 din mein phir kharab ho gaya",
        "none": "Aapki complaint {cid} ({loc}) par abhi koi work order nahi juda hai. Status: {status}.",
        "notfound": "Aapke message mein complaint number nahi mila. Kripya number bhejein, jaise BMC25-001657.",
        "flags": " Is kaam par audit ke {n} note hain.",
    },
    "hi": {
        "done": "आपकी शिकायत {cid} ({loc}) पर काम आदेश {wo} के तहत {contractor} ने मरम्मत की. खर्च: ₹{cost}. "
                "{sla} घंटे की समय सीमा: {met} ({hours} घंटे लगे). मरम्मत {held}.",
        "met": "पूरी हुई", "missed": "पूरी नहीं हुई", "held": "अभी तक टिकी हुई है", "failed": "30 दिन में फिर खराब हो गई",
        "none": "आपकी शिकायत {cid} ({loc}) पर अभी कोई काम आदेश नहीं जुड़ा है. स्थिति: {status}.",
        "notfound": "आपके संदेश में शिकायत संख्या नहीं मिली. कृपया संख्या भेजें, जैसे BMC25-001657.",
        "flags": " इस काम पर ऑडिट की {n} टिप्पणी है.",
    },
    "mr": {
        "done": "तुमची तक्रार {cid} ({loc}) काम आदेश {wo} अंतर्गत {contractor} यांनी दुरुस्त केली. खर्च: ₹{cost}. "
                "{sla} तासांची मुदत: {met} ({hours} तास लागले). दुरुस्ती {held}.",
        "met": "पाळली गेली", "missed": "पाळली गेली नाही", "held": "अजून टिकून आहे", "failed": "30 दिवसांत पुन्हा खराब झाली",
        "none": "तुमच्या तक्रारी {cid} ({loc}) वर अजून कोणताही काम आदेश जोडलेला नाही. स्थिती: {status}.",
        "notfound": "तुमच्या संदेशात तक्रार क्रमांक सापडला नाही. कृपया क्रमांक पाठवा, उदा. BMC25-001657.",
        "flags": " या कामावर ऑडिटच्या {n} नोंदी आहेत.",
    },
}


def template_answer(t: dict | None, lang: str) -> str:
    T = TEMPLATES[lang]
    if t is None:
        return T["notfound"]
    c = t["complaint"]
    base = {"cid": c["complaint_id"], "cat": c["category_clean"].lower(), "loc": c["locality_text"], "status": c["status"]}
    if not t["work_orders"]:
        return T["none"].format(**base)
    w = t["work_orders"][-1]
    met = w["sla_met_actual"] if w["sla_met_actual"] is not None else w["sla_met_reported"]
    text = T["done"].format(**base, wo=w["wo_id"], contractor=w["contractor_name"], cost=f"{w['cost_inr']:,}",
                            sla=w["sla_hours"], met=T["met"] if met else T["missed"],
                            hours="?" if w["hours_taken"] is None else f"{w['hours_taken']:.0f}",
                            held=T["failed"] if w["reopened_within_30d"] else T["held"])
    return text + (T["flags"].format(n=len(w["flags"])) if w["flags"] else "")


def ask(s, question: str, complaint_id: str | None = None, ward_code: str | None = None) -> dict:
    lang = detect_language(question)
    cid = find_complaint(s, question, complaint_id, ward_code)
    t = views.complaint_trail(s, cid) if cid else None
    text = None
    if t is not None:
        text = _call(
            "You answer a Mumbai citizen asking what happened to their road complaint. " + RULES
            + f" Reply in the asker's language (code {lang}: en English, hi Hindi in Devanagari, mr Marathi in Devanagari, "
              "hi-en Hinglish in Latin script). Cover: the work order, contractor, cost, whether the SLA was met, and whether "
              "the fix held. At most 120 words.",
            json.dumps({"question": question, "trail": t}, default=str, ensure_ascii=False), max_tokens=2000)
    answer = text or template_answer(t, lang)
    return {"answer": answer, "language": lang, "source": "claude" if text else "template",
            "complaint_ids": [cid] if t else [], "wo_ids": [w["wo_id"] for w in t["work_orders"]] if t else []}
