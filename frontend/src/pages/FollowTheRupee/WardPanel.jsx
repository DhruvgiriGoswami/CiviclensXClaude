import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { auditApi, isUsingMock } from './auditApi';
import { formatINR, formatPct, humanizeEnum } from '../../utils/format';
import { RULES, DotWhisker, RiskBar, RiskLegend, Markdown, WoId } from './parts';

const TABS = [
  ['money', 'Where the money went'],
  ['flags', 'What looks wrong'],
  ['delivered', 'Who delivered'],
  ['next', 'Where the next rupee goes'],
];

const muted = 'text-slate-400 light:text-slate-600';

function Bar({ value, max, className, children }) {
  return (
    <div className="h-3 rounded-sm bg-slate-800 light:bg-slate-100 overflow-hidden relative">
      <div className={`h-full ${className}`} style={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%` }} />
      {children}
    </div>
  );
}

function MoneyTab({ detail }) {
  const w = detail.ward;
  const over = w.spend_inr - w.budget_inr;
  const top = Math.max(w.budget_inr, w.spend_inr);
  const maxC = Math.max(...detail.money_trail.by_contractor.map((c) => c.spend_inr), 1);
  const maxM = Math.max(...detail.money_trail.by_method.map((c) => c.spend_inr), 1);
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold">Budget and spend</h3>
        <p className="mt-1 text-sm tabular-nums">
          Spent {formatINR(w.spend_inr)} of a {formatINR(w.budget_inr)} monsoon budget ({formatPct(w.spend_share)}).
          {over > 0 && <span className="font-semibold text-crimson-400 light:text-crimson-700"> Over budget by {formatINR(over)}.</span>}
        </p>
        <div className="mt-2 h-4 rounded-sm bg-slate-800 light:bg-slate-100 relative overflow-hidden" role="img"
          aria-label={`Spend is ${formatPct(w.spend_share)} of budget`}>
          <div className="absolute inset-y-0 left-0 bg-slate-400 light:bg-slate-500" style={{ width: `${(Math.min(w.spend_inr, w.budget_inr) / top) * 100}%` }} />
          {over > 0 && <div className="absolute inset-y-0 bg-crimson-500 light:bg-crimson-700" style={{ left: `calc(${(w.budget_inr / top) * 100}% + 2px)`, right: 0 }} />}
          <div className="absolute inset-y-0 w-0.5 bg-slate-100 light:bg-slate-900" style={{ left: `${(w.budget_inr / top) * 100}%` }} />
        </div>
        <div className={`mt-1 flex justify-between text-xs ${muted}`}><span>₹0</span><span>Budget line</span></div>
        <p className="mt-3 text-sm">
          <span className="font-semibold tabular-nums">{formatINR(w.failed_fix_spend_inr)}</span> ({formatPct(w.failed_fix_share)} of spend) paid for repairs that failed within 30 days.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold">By contractor</h3>
        <ul className={`mt-1 flex gap-4 text-xs ${muted}`}>
          <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-400 light:bg-slate-500" />All spend</li>
          <li className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-crimson-500 light:bg-crimson-700" />Spent on failed fixes</li>
        </ul>
        <ul className="mt-2 space-y-3">
          {detail.money_trail.by_contractor.map((c) => (
            <li key={c.contractor_id} className="text-sm">
              <div className="flex justify-between gap-3"><span className="truncate">{c.contractor_name}</span><span className="tabular-nums shrink-0">{formatINR(c.spend_inr)}, {c.jobs} jobs</span></div>
              <div className="mt-1 h-3 rounded-sm bg-slate-800 light:bg-slate-100 overflow-hidden flex">
                <div className="h-full bg-crimson-500 light:bg-crimson-700" style={{ width: `${(c.failed_fix_spend_inr / maxC) * 100}%` }} title={`Failed fixes ${formatINR(c.failed_fix_spend_inr)}`} />
                <div className="h-full bg-slate-400 light:bg-slate-500 border-l-2 border-[#12151E] light:border-white" style={{ width: `${((c.spend_inr - c.failed_fix_spend_inr) / maxC) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold">By repair method</h3>
        <ul className="mt-2 space-y-3">
          {detail.money_trail.by_method.map((m) => (
            <li key={m.repair_method} className="text-sm">
              <div className="flex justify-between gap-3"><span className="truncate">{m.repair_method}</span><span className="tabular-nums shrink-0">{formatINR(m.spend_inr)}, {formatPct(m.reopen_rate)} reopened</span></div>
              <div className="mt-1"><Bar value={m.spend_inr} max={maxM} className="bg-slate-400 light:bg-slate-500" /></div>
            </li>
          ))}
        </ul>
      </section>

      {detail.scorecard?.evidence_wo_ids?.length > 0 && (
        <p className={`text-sm ${muted}`}>
          Jobs behind these numbers include {detail.scorecard.evidence_wo_ids.map((id, i) => <React.Fragment key={id}>{i ? ', ' : ''}<WoId id={id} /></React.Fragment>)}.
        </p>
      )}
    </div>
  );
}

function evidenceRows(ev) {
  return Object.entries(ev || {}).filter(([k, v]) => k !== 'related_wo_ids' && v !== null && v !== undefined).map(([k, v]) => {
    const label = humanizeEnum(k.replace(/_inr$/, ''));
    const value = k.endsWith('_inr') ? formatINR(v) : k === 'ratio' ? `${v}x` : String(v);
    return [label, value];
  });
}

function csvHref(flags) {
  if (!isUsingMock()) return null;
  const cols = ['flag_id', 'rule', 'severity', 'wo_id', 'complaint_ids', 'ward_code', 'road_id', 'contractor_id', 'amount_at_risk_inr', 'reason'];
  const esc = (v) => `"${String(Array.isArray(v) ? v.join('|') : v ?? '').replace(/"/g, '""')}"`;
  return `data:text/csv;charset=utf-8,${encodeURIComponent([cols.join(','), ...flags.map((f) => cols.map((c) => esc(f[c])).join(','))].join('\n'))}`;
}

function FlagsTab({ detail, focusWo, onOpenTrail }) {
  const groups = useMemo(() => {
    const g = {};
    detail.flags.forEach((f) => { (g[f.rule] ||= []).push(f); });
    return Object.entries(g).sort((a, b) => b[1].reduce((s, f) => s + f.amount_at_risk_inr, 0) - a[1].reduce((s, f) => s + f.amount_at_risk_inr, 0));
  }, [detail]);
  const href = csvHref(detail.flags) || auditApi.flagsCsvUrl(detail.ward.ward_code);
  if (!detail.flags.length) return <p className="text-sm">No jobs in this ward broke any of the checks.</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className={`text-sm max-w-prose ${muted}`}>A flag is a question to ask, not proof of wrongdoing. Each one lists the numbers behind it so you can check.</p>
        <a href={href} download="flags.csv" className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-lg border border-slate-700 light:border-slate-300 text-sm font-medium hover:bg-white/5 light:hover:bg-slate-900/5">
          <Download className="w-4 h-4" aria-hidden="true" />Download flags (CSV)
        </a>
      </div>
      {groups.map(([rule, list]) => (
        <section key={rule}>
          <h3 className="text-sm font-semibold">{RULES[rule] || humanizeEnum(rule)}</h3>
          <p className={`text-sm tabular-nums ${muted}`}>{list.length} {list.length === 1 ? 'job' : 'jobs'}, {formatINR(list.reduce((s, f) => s + f.amount_at_risk_inr, 0))} at risk</p>
          <ul className="mt-2 space-y-2">
            {list.map((f) => (
              <li key={f.flag_id}>
                <details open={focusWo === f.wo_id} className="rounded-lg border border-slate-800 light:border-slate-200 group">
                  <summary className="cursor-pointer list-none min-h-[44px] px-3 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <WoId id={f.wo_id || f.flag_id} />
                    <span className="flex-1 min-w-[12rem] text-sm">{f.reason}</span>
                    <span className="text-sm font-semibold tabular-nums">{formatINR(f.amount_at_risk_inr)}</span>
                    <span className={`text-xs ${muted}`}>{humanizeEnum(f.severity)}</span>
                  </summary>
                  <div className="px-3 pb-3 text-sm space-y-2 border-t border-slate-800 light:border-slate-200 pt-2">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 tabular-nums">
                      {evidenceRows(f.evidence).map(([k, v]) => <React.Fragment key={k}><dt className={muted}>{k}</dt><dd>{v}</dd></React.Fragment>)}
                      <dt className={muted}>Road</dt><dd>{f.road_id || 'Not given'}</dd>
                      <dt className={muted}>Contractor</dt><dd>{detail.contractors.find((c) => c.id === f.contractor_id)?.name || f.contractor_id}</dd>
                    </dl>
                    {f.evidence?.related_wo_ids?.length > 0 && <p>Related jobs: {f.evidence.related_wo_ids.map((id, i) => <React.Fragment key={id}>{i ? ', ' : ''}<WoId id={id} /></React.Fragment>)}</p>}
                    {f.complaint_ids?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {f.complaint_ids.slice(0, 3).map((cid) => (
                          <button key={cid} type="button" onClick={() => onOpenTrail(cid)} className="min-h-[44px] px-3 rounded-lg bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-sm">
                            Follow complaint <span className="font-mono">{cid}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function DeliveredTab({ detail }) {
  return (
    <div className="space-y-4">
      <p className={`text-sm max-w-prose ${muted}`}>
        The dot is the contractor&apos;s rate in this ward. The line around it is the likely range, which is wide when they did few jobs. The tick is the city average.
      </p>
      {detail.contractors.map((c) => (
        <article key={c.id} className="rounded-lg border border-slate-800 light:border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold">{c.name}</h3>
            <p className={`text-sm tabular-nums ${muted}`}>{c.jobs} jobs, {formatINR(c.spend_inr)}{c.median_cost_ratio ? `, typical bill ${c.median_cost_ratio}x the rate card` : ''}</p>
          </div>
          <DotWhisker rate={c.reopened} label="Repairs that failed within 30 days" />
          <DotWhisker rate={c.sla_met} label="Finished on time, as reported" />
          <p className="text-sm">{c.verdict}</p>
          <p className={`text-sm ${muted}`}>
            {c.flags.total} flagged {c.flags.total === 1 ? 'job' : 'jobs'}, {formatINR(c.amount_at_risk_inr)} at risk.
            {c.evidence_wo_ids?.length > 0 && <> See {c.evidence_wo_ids.map((id, i) => <React.Fragment key={id}>{i ? ', ' : ''}<WoId id={id} /></React.Fragment>)}.</>}
          </p>
        </article>
      ))}
    </div>
  );
}

function NextTab({ plan, dark }) {
  if (!plan) return <p className="text-sm">Loading the plan.</p>;
  const max = Math.max(...plan.plan.map((p) => p.risk_score), 0.01);
  const bmc = plan.plan.filter((p) => p.pay_from !== 'dlp_contractor');
  const asked = bmc.reduce((s, p) => s + p.est_cost_inr, 0);
  const funded = bmc.filter((p) => p.funded).reduce((s, p) => s + p.est_cost_inr, 0);
  const left = Math.max(plan.remaining_inr, 0);
  const top = Math.max(asked, left, 1);
  return (
    <div className="space-y-4">
      <p className="text-sm tabular-nums">
        {plan.remaining_inr > 0 ? `${formatINR(plan.remaining_inr)} left` : `Over budget by ${formatINR(-plan.remaining_inr)}`} of {formatINR(plan.budget_inr)}.
        {' '}The {bmc.length} roads BMC would pay for cost {formatINR(asked)}; {formatINR(funded)} of that fits.
      </p>
      {plan.note && <p className="text-sm rounded-lg border border-slate-700 light:border-slate-300 p-3">{plan.note}</p>}
      <div>
        <div className="h-4 rounded-sm bg-slate-800 light:bg-slate-100 relative overflow-hidden" role="img"
          aria-label={`${formatINR(funded)} funded out of ${formatINR(asked)} asked, with ${formatINR(left)} left`}>
          <div className="absolute inset-y-0 left-0 bg-slate-400 light:bg-slate-500" style={{ width: `${(funded / top) * 100}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-crimson-500 light:bg-crimson-700" style={{ left: `min(calc(100% - 2px), ${(left / top) * 100}%)` }} />
        </div>
        <div className={`mt-1 flex justify-between gap-3 text-xs ${muted}`}>
          <span>Funded {formatINR(funded)}</span>
          <span className="text-crimson-400 light:text-crimson-700">Budget line {formatINR(left)}</span>
          <span>Asked {formatINR(asked)}</span>
        </div>
      </div>
      <p className={`text-sm max-w-prose ${muted}`}>
        Roads are ranked by risk from rain, flooding, traffic and accidents. The money goes first to the roads that cut the most risk per rupee, so a high-ranked road can stay unfunded when it costs too much.
      </p>
      <RiskLegend dark={dark} />
      <ol className="space-y-2">
        {plan.plan.map((p) => {
          const dlp = p.pay_from === 'dlp_contractor';
          return (
            <li key={`${p.rank}-${p.road_id}`} className="rounded-lg border border-slate-800 light:border-slate-200 p-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm font-semibold tabular-nums w-6">{p.rank}</span>
                <span className="flex-1 min-w-[10rem] font-medium">{p.road_name} <span className={`font-mono text-[0.8125rem] ${muted}`}>{p.road_id}</span></span>
                <span className="text-sm font-semibold tabular-nums">{dlp ? 'Contractor pays, ₹0 to BMC' : formatINR(p.est_cost_inr)}</span>
                <span className={`text-xs font-semibold rounded px-2 py-0.5 border ${p.funded ? 'border-slate-500 text-slate-200 light:text-slate-800' : 'border-dashed border-crimson-500 text-crimson-400 light:text-crimson-700'}`}>
                  {dlp ? 'Under warranty' : p.funded ? 'Funded' : 'Not funded'}
                </span>
              </div>
              <div className="mt-2 pl-9"><RiskBar parts={p.risk_parts} max={max} dark={dark} /></div>
              <p className="mt-2 pl-9 text-sm">
                {p.work_type}, fix with {p.method.toLowerCase()} ({formatPct(p.method_reopen_rate)} of these reopen). {p.why}
              </p>
              {p.issue_ids?.length > 0 && <p className={`mt-1 pl-9 text-xs ${muted}`}>Issues <span className="font-mono">{p.issue_ids.join(', ')}</span></p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WardPanel({ code, tab, onTab, focusWo, onOpenTrail, dark }) {
  const [detail, setDetail] = useState(null);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ state: 'idle' });
  const tabRefs = useRef({});

  useEffect(() => {
    let live = true;
    setDetail(null); setPlan(null); setError(null); setSummary({ state: 'idle' });
    auditApi.ward(code).then((d) => live && setDetail(d)).catch((e) => live && setError(e.message));
    auditApi.nextRupee(code).then((p) => live && setPlan(p)).catch(() => live && setPlan({ ward_code: code, plan: [], remaining_inr: 0, budget_inr: 0, unfunded_count: 0 }));
    return () => { live = false; };
  }, [code]);

  const writeSummary = () => {
    setSummary({ state: 'loading' });
    auditApi.summary(code).then((s) => setSummary({ state: 'done', ...s })).catch((e) => setSummary({ state: 'error', message: e.message }));
  };

  const onTabKey = (e) => {
    const i = TABS.findIndex(([k]) => k === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i + TABS.length - 1) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onTab(TABS[next][0]);
    tabRefs.current[TABS[next][0]]?.focus();
  };

  if (error) return <section className="ftr-card p-5"><p className="text-sm">We could not load ward {code}. {error}</p></section>;
  if (!detail) return <section className="ftr-card p-5" aria-busy="true"><p className="text-sm">Loading ward {code}.</p></section>;
  const w = detail.ward;

  return (
    <section aria-labelledby="ward-heading" className="ftr-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ward-heading" className="text-lg font-semibold">Ward {w.ward_code}, {w.ward_name}</h2>
          <p className={`text-sm ${muted}`}>{w.zone}, about {Number(w.population_est || 0).toLocaleString('en-IN')} people, {detail.context.flood_hotspots} flood hotspots, {w.open_issues} open issues</p>
        </div>
        <button type="button" onClick={writeSummary} disabled={summary.state === 'loading'}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-crimson-700 hover:bg-crimson-800 text-white text-sm font-medium disabled:opacity-60">
          {summary.state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileText className="w-4 h-4" aria-hidden="true" />}
          {summary.state === 'loading' ? 'Writing the summary' : 'Write a summary with Claude'}
        </button>
      </div>

      <div aria-live="polite">
        {summary.state === 'error' && (
          <p className="mt-3 text-sm rounded-lg border border-crimson-500/50 p-3">We could not write the summary. {summary.message} <button type="button" className="underline min-h-[44px]" onClick={writeSummary}>Try again</button></p>
        )}
        {summary.state === 'done' && (
          <div className="mt-3 rounded-lg bg-slate-800/60 light:bg-slate-100 p-4">
            <Markdown text={summary.summary_markdown} />
            <p className={`mt-2 text-xs ${muted}`}>{summary.source === 'claude' ? 'Written by Claude from the ward data' : 'Template summary'}</p>
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Ward details" className="mt-4 flex overflow-x-auto no-scrollbar border-b border-slate-800 light:border-slate-200 -mx-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            ref={(el) => { tabRefs.current[key] = el; }}
            role="tab"
            type="button"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => onTab(key)}
            onKeyDown={onTabKey}
            className={`shrink-0 min-h-[44px] px-3 mx-1 text-sm font-medium border-b-2 -mb-px ${tab === key ? 'border-crimson-500 light:border-crimson-700 text-slate-100 light:text-slate-900' : 'border-transparent text-slate-400 light:text-slate-600 hover:text-slate-100 light:hover:text-slate-900'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="pt-4">
        {tab === 'money' && <MoneyTab detail={detail} />}
        {tab === 'flags' && <FlagsTab detail={detail} focusWo={focusWo} onOpenTrail={onOpenTrail} />}
        {tab === 'delivered' && <DeliveredTab detail={detail} />}
        {tab === 'next' && <NextTab plan={plan} dark={dark} />}
      </div>
    </section>
  );
}
