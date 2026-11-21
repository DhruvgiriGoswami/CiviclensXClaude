import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Info, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { auditApi, isUsingMock, onSourceChange } from './auditApi';
import { formatINR } from '../../utils/format';
import { Stat } from './parts';
import { WardMap } from './WardMap';
import { WardPanel } from './WardPanel';
import { TrailDialog } from './TrailDialog';
import './followTheRupee.css';

const TYPE = { complaint: 'Complaint', work_order: 'Work order', road: 'Road', ward: 'Ward' };
const muted = 'text-slate-400 light:text-slate-600';
const input = 'w-full min-h-[44px] rounded-lg border border-slate-700 light:border-slate-300 bg-dark-900 light:bg-white px-3 text-sm placeholder:text-slate-500';

function SearchBox({ onPick }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  const [results, setResults] = useState(null);
  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return undefined; }
    let live = true;
    const t = setTimeout(() => {
      auditApi.search(q.trim()).then((r) => live && setResults(r.results || [])).catch(() => live && setResults([]));
    }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [q]);
  return (
    <div className="relative">
      <label htmlFor="ftr-search" className="text-sm font-medium">Find a complaint, work order, road or area</label>
      <div className="relative mt-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input ref={inputRef} id="ftr-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setQ('')}
          placeholder="BMC25-002653, WO25-00123, Lalbaug" className={`${input} pl-9`} autoComplete="off" aria-describedby="ftr-search-status" />
      </div>
      <p id="ftr-search-status" className="sr-only" aria-live="polite">{results ? `${results.length} results` : ''}</p>
      {results && (
        <ul className="absolute z-30 left-0 right-0 mt-1 ftr-card p-1 max-h-80 overflow-y-auto" aria-label="Search results">
          {!results.length && <li className="px-3 py-2.5 text-sm">Nothing matches &ldquo;{q}&rdquo;. Try a complaint number like BMC25-002653.</li>}
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <button type="button" onClick={() => { inputRef.current?.focus(); setQ(''); onPick(r); }} className="w-full min-h-[44px] text-left px-3 rounded-md flex items-baseline gap-3 hover:bg-white/5 light:hover:bg-slate-900/5 text-sm">
                <span className={`w-24 shrink-0 text-xs ${muted}`}>{TYPE[r.type] || r.type}</span>
                <span className="flex-1 truncate">{r.label}</span>
                {r.ward_code && <span className={`text-xs ${muted}`}>Ward {r.ward_code}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AskBox({ onOpenTrail }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState({ status: 'idle' });
  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setState({ status: 'loading' });
    auditApi.ask(q.trim()).then((a) => setState({ status: 'done', ...a })).catch((err) => setState({ status: 'error', message: err.message }));
  };
  return (
    <form onSubmit={submit}>
      <label htmlFor="ftr-ask" className="text-sm font-medium">Ask about a complaint in your language</label>
      <div className="mt-1 flex gap-2">
        <input id="ftr-ask" value={q} onChange={(e) => setQ(e.target.value)} className={input} placeholder="माझ्या तक्रारीचं काय झालं? BMC25-002653" />
        <button type="submit" disabled={state.status === 'loading'} className="shrink-0 min-h-[44px] px-4 rounded-lg bg-slate-100 text-slate-900 light:bg-slate-900 light:text-white text-sm font-medium disabled:opacity-60">
          {state.status === 'loading' ? 'Asking' : 'Ask'}
        </button>
      </div>
      <div aria-live="polite">
        {state.status === 'error' && <p className="mt-2 text-sm">We could not get an answer. {state.message}</p>}
        {state.status === 'done' && (
          <div className="mt-2 rounded-lg bg-slate-800/60 light:bg-slate-100 p-3 text-sm" data-testid="ask-answer">
            <p lang={state.language || undefined}>{state.answer}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {state.complaint_ids?.slice(0, 2).map((id) => (
                <button key={id} type="button" onClick={() => onOpenTrail(id)} className="min-h-[44px] underline underline-offset-2">Follow <span className="font-mono">{id}</span></button>
              ))}
              <span className={`text-xs ${muted}`}>{state.source === 'claude' ? 'Answered by Claude' : 'Template answer'}</span>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default function FollowTheRupee({ onBackToMap }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [overview, setOverview] = useState(null);
  const [wards, setWards] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [points, setPoints] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [measure, setMeasure] = useState('failed_fix_share');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('money');
  const [focusWo, setFocusWo] = useState(null);
  const [trailId, setTrailId] = useState(null);
  const [offline, setOffline] = useState(isUsingMock());
  const panelRef = useRef(null);

  useEffect(() => onSourceChange(setOffline), []);
  useEffect(() => {
    document.title = 'Follow the Rupee | CivicLens';
    Promise.all([auditApi.overview(), auditApi.wards(), auditApi.geojson()])
      .then(([o, w, g]) => { setOverview(o); setWards(w); setGeojson(g); })
      .catch((e) => setLoadError(e.message));
    auditApi.complaintPoints().then(setPoints).catch(() => {}); // the map works without the dots
  }, []);

  const selectWard = (code, nextTab) => {
    setSelected(code);
    if (nextTab) setTab(nextTab);
    if (window.innerWidth < 1024) requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const onPick = (r) => {
    if (r.type === 'complaint') setTrailId(r.id);
    else if (r.type === 'work_order') { setFocusWo(r.id); selectWard(r.ward_code, 'flags'); }
    else if (r.type === 'road') selectWard(r.ward_code, 'next');
    else selectWard(r.ward_code || r.id);
  };

  const flagTotal = overview ? Object.values(overview.flags_by_rule || {}).reduce((s, n) => s + n, 0) : 0;
  const worst = wards ? [...wards].sort((a, b) => b.amount_at_risk_inr - a.amount_at_risk_inr)[0] : null;

  return (
    <div className="ftr h-screen overflow-y-auto overflow-x-hidden bg-dark-900 light:bg-slate-50 text-slate-100 light:text-slate-900">
      <header className="border-b border-slate-800 light:border-slate-200 bg-dark-800 light:bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onBackToMap} className="inline-flex items-center gap-2 min-h-[44px] px-2 -ml-2 rounded-lg text-sm hover:bg-white/5 light:hover:bg-slate-900/5">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />CivicLens map
          </button>
          <h1 className="text-xl font-semibold mr-auto">Follow the Rupee <span className={`font-normal text-sm ${muted}`}>Mumbai monsoon road repairs, June to September 2025</span></h1>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-700 light:border-slate-300 px-3 py-2 text-sm">
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />Synthetic data: not BMC records
          </p>
          <ThemeToggle />
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-4 grid gap-4 md:grid-cols-2">
          <SearchBox onPick={onPick} />
          <AskBox onOpenTrail={setTrailId} />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        {offline && <p className={`text-sm ${muted}`}>The audit server is not reachable, so this page shows the saved offline copy.</p>}
        {loadError && <p className="text-sm">We could not load the city totals. {loadError}</p>}
        {overview && (
          <section aria-label="City totals" className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Monsoon budget" value={formatINR(overview.budget_inr)} note="24 wards" />
            <Stat label="Spent" value={formatINR(overview.spend_inr)} note={`${overview.work_orders.toLocaleString('en-IN')} work orders`} />
            <Stat label="Spent on fixes that failed" value={formatINR(overview.failed_fix_spend_inr)} note="Reopened within 30 days" />
            <Stat label="Amount at risk" value={formatINR(overview.amount_at_risk_inr)} note="In bills worth checking" />
            <Stat wide label="Flags raised" value={flagTotal.toLocaleString('en-IN')} note={`From ${overview.complaints.toLocaleString('en-IN')} complaints`} />
          </section>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start [&>*]:min-w-0">
          <div className="lg:sticky lg:top-5">
            {wards && geojson
              ? <WardMap geojson={geojson} wards={wards} measure={measure} onMeasure={setMeasure} selected={selected} onSelect={(c) => selectWard(c)} dark={dark} points={points} onOpenTrail={setTrailId} />
              : !loadError && <div className="ftr-card p-5 text-sm" aria-busy="true">Loading the ward map.</div>}
          </div>
          <div ref={panelRef} className="scroll-mt-4">
            {selected
              ? <WardPanel code={selected} tab={tab} onTab={setTab} focusWo={focusWo} onOpenTrail={setTrailId} dark={dark} />
              : (
                <section className="ftr-card p-5 space-y-3">
                  <h2 className="text-lg font-semibold">Pick a ward</h2>
                  <p className={`text-sm max-w-prose ${muted}`}>Click a ward on the map or choose one from the list. You will see where its repair money went, which bills look wrong, how each contractor did and where the money left should go next.</p>
                  {worst && (
                    <button type="button" onClick={() => selectWard(worst.ward_code)} className="min-h-[44px] px-4 rounded-lg bg-crimson-700 hover:bg-crimson-800 text-white text-sm font-medium">
                      Start with ward {worst.ward_code}, the most money at risk
                    </button>
                  )}
                </section>
              )}
          </div>
        </div>
      </main>

      <TrailDialog complaintId={trailId} onClose={() => setTrailId(null)} />
    </div>
  );
}
