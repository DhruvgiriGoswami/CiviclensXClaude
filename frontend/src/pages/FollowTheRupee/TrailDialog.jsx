import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';
import { auditApi } from './auditApi';
import { formatINR, humanizeEnum } from '../../utils/format';
import { WoId } from './parts';

const STATE = { fixed: 'Fixed and holding', fixed_reopened: 'Fixed, then failed again', never_fixed: 'Never fixed', open: 'Still open' };
const LANG = { en: 'English', 'hi-en': 'Hinglish', mr: 'Marathi', hi: 'Hindi' };
const muted = 'text-slate-400 light:text-slate-600';
const when = (s) => (s ? s.replace('T', ' ') : 'Not yet');
const yes = (b) => (b ? 'yes' : 'no');

function Step({ title, children }) {
  return (
    <li className="relative pl-6 pb-5 last:pb-0 border-l-2 border-slate-700 light:border-slate-300 last:border-transparent">
      <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-slate-100 light:bg-slate-900" aria-hidden="true" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-1 text-sm space-y-1">{children}</div>
    </li>
  );
}

export function TrailDialog({ complaintId, onClose }) {
  const ref = useDialog(!!complaintId, onClose);
  const [trail, setTrail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!complaintId) return undefined;
    let live = true;
    setTrail(null); setError(null);
    auditApi.complaint(complaintId).then((t) => live && setTrail(t)).catch((e) => live && setError(e.status === 404 ? `We have no complaint ${complaintId}.` : e.message));
    return () => { live = false; };
  }, [complaintId]);

  if (!complaintId) return null;
  const c = trail?.complaint;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="trail-heading" tabIndex={-1}
        className="ftr ftr-card w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id="trail-heading" className="text-lg font-semibold">Complaint <span className="font-mono">{complaintId}</span></h2>
          <button type="button" data-autofocus onClick={onClose} aria-label="Close" className="w-11 h-11 -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg hover:bg-white/10 light:hover:bg-slate-900/5">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {error && <p className="mt-3 text-sm">{error}</p>}
        {!trail && !error && <p className="mt-3 text-sm" aria-busy="true">Loading the trail.</p>}
        {trail && (
          <>
            <p className="mt-2 text-sm rounded-lg bg-slate-800/60 light:bg-slate-100 p-3">{trail.summary}</p>
            <ol className="mt-4">
              <Step title="Complaint">
                <p lang={c.language === 'mr' ? 'mr' : c.language === 'hi' ? 'hi' : 'en'}>&ldquo;{c.description}&rdquo;</p>
                <p className={muted}>
                  {when(c.received_at)}, {c.channel}, {LANG[c.language] || c.language}. {c.locality_text}, ward {c.ward_code || 'unknown'}{c.ward_code_inferred ? ' (worked out from the locality)' : ''}.
                </p>
                <p className={muted}>
                  Filed as {c.category_reported}{c.category_clean && c.category_clean !== c.category_reported ? `, which looks like ${c.category_clean}` : ''}. Status: {c.status}.
                </p>
              </Step>
              <Step title={`Issue ${trail.issue.issue_id}`}>
                <p>
                  {trail.issue.duplicates > 0 ? `Grouped with ${trail.issue.duplicates} other ${trail.issue.duplicates === 1 ? 'complaint' : 'complaints'} about the same spot.` : 'No other complaints about this spot.'} {STATE[trail.issue.state] || humanizeEnum(trail.issue.state)}.
                </p>
              </Step>
              <Step title={trail.work_orders.length ? `Work orders (${trail.work_orders.length})` : 'Work orders'}>
                {!trail.work_orders.length && <p>No work order is linked to this complaint.</p>}
                <ul className="space-y-3">
                  {trail.work_orders.map((w) => {
                    const mismatch = w.sla_met_reported && !w.sla_met_actual;
                    return (
                      <li key={w.wo_id} className="rounded-lg border border-slate-800 light:border-slate-200 p-3 space-y-1">
                        <p className="flex flex-wrap justify-between gap-2"><WoId id={w.wo_id} /><span className="font-semibold tabular-nums">{formatINR(w.cost_inr)}</span></p>
                        <p>{w.contractor_name}, {w.repair_method}.</p>
                        <p className={muted}>Assigned {when(w.assigned_at)}, finished {when(w.completed_at)}.</p>
                        <p className={mismatch ? 'font-semibold text-crimson-400 light:text-crimson-700' : ''}>
                          Target {w.sla_hours} hours, took {w.hours_taken ?? 'unknown'} hours. Reported on time: {yes(w.sla_met_reported)}. Actually on time: {yes(w.sla_met_actual)}.
                        </p>
                        <p>{w.reopened_within_30d ? 'The repair failed within 30 days.' : 'The repair held for 30 days.'}{w.under_dlp ? ' The road was under warranty, so the contractor should have paid.' : ''}</p>
                        {w.flags?.map((f) => <p key={f.flag_id} className={muted}>Flag: {f.reason}</p>)}
                      </li>
                    );
                  })}
                </ul>
              </Step>
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
