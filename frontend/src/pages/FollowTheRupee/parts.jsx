import React from 'react';
import { formatPct } from '../../utils/format';
import { mdBlocks } from './markdown';

export const RULES = {
  overbilling: 'Billed above the rate card',
  area_outlier: 'Repaired area looks too large',
  double_billing: 'Same job billed twice',
  dlp_paid: 'Paid while under warranty',
  sla_misreported: 'Marked on time but was late',
  sla_missed: 'Finished after the deadline',
  timeline_impossible: 'Dates that cannot be right',
  repeat_failure: 'Same spot failed again',
  resolved_without_work: 'Closed with no repair on record',
};

// Categorical slots 1 to 6 of the dataviz reference palette, in fixed order.
export const RISK_PARTS = [
  ['severity', 'Severity', '#2a78d6', '#3987e5'],
  ['flood', 'Flooding', '#eb6834', '#d95926'],
  ['rain_tide', 'Rain and tide', '#1baf7a', '#199e70'],
  ['traffic', 'Traffic', '#eda100', '#c98500'],
  ['accidents', 'Accidents', '#e87ba4', '#d55181'],
  ['facilities', 'Hospitals and schools', '#008300', '#0ca30c'],
];

export function Stat({ label, value, note, wide }) {
  return (
    <div className={`ftr-card px-4 py-3 ${wide ? 'col-span-2 lg:col-span-1' : ''}`}>
      <p className="text-xs text-slate-400 light:text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs text-slate-400 light:text-slate-600">{note}</p>}
    </div>
  );
}

export function WoId({ id }) {
  return <span className="font-mono text-[0.8125rem] whitespace-nowrap">{id}</span>;
}

// Observed rate as a dot, its likely range as a whisker, the city rate as a tick.
export function DotWhisker({ rate, label }) {
  if (!rate) return null;
  if (!rate.judgeable) {
    return (
      <div className="text-sm">
        <p className="text-slate-300 light:text-slate-700">{label}</p>
        <p className="text-slate-400 light:text-slate-600">Not enough jobs to judge ({rate.n} so far, we need 15).</p>
      </div>
    );
  }
  const x = (v) => 4 + v * 292;
  return (
    <div className="text-sm">
      <p className="text-slate-300 light:text-slate-700">
        {label}: <span className="font-semibold tabular-nums text-slate-100 light:text-slate-900">{formatPct(rate.observed)}</span>
        <span className="text-slate-400 light:text-slate-600 tabular-nums"> (likely {formatPct(rate.ci_low)} to {formatPct(rate.ci_high)}, city {formatPct(rate.expected)}, {rate.n} jobs)</span>
      </p>
      <svg viewBox="0 0 300 20" className="w-full h-5 mt-1" aria-hidden="true">
        <line x1={x(0)} x2={x(1)} y1="10" y2="10" className="stroke-slate-700 light:stroke-slate-200" strokeWidth="2" />
        <line x1={x(rate.ci_low)} x2={x(rate.ci_high)} y1="10" y2="10" className="stroke-slate-300 light:stroke-slate-500" strokeWidth="2" strokeLinecap="round" />
        <line x1={x(rate.expected)} x2={x(rate.expected)} y1="3" y2="17" className="stroke-slate-400 light:stroke-slate-600" strokeWidth="2" />
        <circle cx={x(rate.observed)} cy="10" r="5" className="fill-crimson-500 light:fill-crimson-700 stroke-dark-800 light:stroke-white" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function RiskBar({ parts, max, dark }) {
  let x = 0;
  const total = RISK_PARTS.reduce((s, [k]) => s + (parts?.[k] || 0), 0);
  const scale = 100 / (max || total || 1);
  return (
    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="w-full h-2.5 block" role="img"
      aria-label={RISK_PARTS.filter(([k]) => parts?.[k]).map(([k, l]) => `${l} ${parts[k].toFixed(2)}`).join(', ')}>
      {RISK_PARTS.map(([k, l, light, darkC]) => {
        const w = (parts?.[k] || 0) * scale;
        if (!w) return null;
        const rect = <rect key={k} x={x} y="0" width={Math.max(w - 0.6, 0.4)} height="8" fill={dark ? darkC : light}><title>{`${l}: ${parts[k].toFixed(2)}`}</title></rect>;
        x += w;
        return rect;
      })}
    </svg>
  );
}

export function RiskLegend({ dark }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300 light:text-slate-700">
      {RISK_PARTS.map(([k, l, light, darkC]) => (
        <li key={k} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: dark ? darkC : light }} aria-hidden="true" />{l}
        </li>
      ))}
    </ul>
  );
}

// Tiny markdown: headings, bullets, bold and paragraphs. Builds elements, never raw HTML.
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
}

export function Markdown({ text }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {mdBlocks(text).map((b, i) => {
        if (b.type === 'h') {
          return <p key={i} className={`font-semibold ${b.level === 1 ? 'text-base' : 'text-sm pt-2'}`}>{inline(b.text)}</p>;
        }
        if (b.type === 'ul' || b.type === 'ol') {
          const items = b.items.map((t, j) => <li key={j}>{inline(t)}</li>);
          return b.type === 'ul'
            ? <ul key={i} className="list-disc pl-5 space-y-1">{items}</ul>
            : <ol key={i} className="list-decimal pl-5 space-y-1">{items}</ol>;
        }
        return <p key={i}>{inline(b.text)}</p>;
      })}
    </div>
  );
}
