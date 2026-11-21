import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { auditApi } from './auditApi';
import { formatINR } from '../../utils/format';

// Dot colours by issue state. Chosen to stand out on the red ward fill in both themes.
export const DOT = {
  open: { color: '#38BDF8', label: 'Still open' },
  never_fixed: { color: '#F59E0B', label: 'Closed with no work' },
  fixed_reopened: { color: '#A855F7', label: 'Fixed, then failed' },
  fixed: { color: '#22C55E', label: 'Fixed and holding' },
};
const muted = 'text-slate-400 light:text-slate-600';

export function ComplaintCard({ point, onClose, onOpenTrail }) {
  const [trail, setTrail] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    setTrail(null); setError(null);
    auditApi.complaint(point.id).then((t) => live && setTrail(t))
      .catch((e) => live && setError(e.status === 404 ? 'Full details need the audit server.' : e.message));
    return () => { live = false; };
  }, [point.id]);
  const c = trail?.complaint;
  const w = trail?.work_orders?.at(-1);
  const st = DOT[point.state];

  return (
    <article aria-live="polite" data-testid="complaint-card" className="absolute top-2 right-0 w-72 max-w-full rounded-lg border border-slate-700 light:border-slate-300 bg-[#12151E] light:bg-white shadow-lg p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold"><span className="font-mono">{point.id}</span>{point.ward && <span className={`font-normal ${muted}`}>, ward {point.ward}</span>}</h3>
          {st && <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: st.color }} aria-hidden="true" />{st.label}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close complaint card" className="w-11 h-11 -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg hover:bg-white/10 light:hover:bg-slate-900/5">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {!trail && !error && <p className={`mt-2 ${muted}`} aria-busy="true">Loading the complaint.</p>}
      {error && <p className={`mt-2 ${muted}`}>{error}</p>}
      {c && (
        <>
          <p className="mt-2">{c.category_clean} at {c.locality_text}. Received {c.received_at?.replace('T', ' ')} via {c.channel}. Status: {c.status}.</p>
          <p className={`mt-1 line-clamp-2 ${muted}`} lang={c.language === 'mr' ? 'mr' : c.language === 'hi' ? 'hi' : 'en'}>&ldquo;{c.description}&rdquo;</p>
          <p className="mt-1">
            {w
              ? <>{w.contractor_name}, <span className="font-mono">{w.wo_id}</span>, {formatINR(w.cost_inr)}. {w.reopened_within_30d ? 'Failed within 30 days.' : 'Holding so far.'}{w.flags.length ? ` ${w.flags.length} audit flag${w.flags.length > 1 ? 's' : ''}.` : ''}</>
              : 'No work order linked.'}
          </p>
        </>
      )}
      <button type="button" onClick={() => onOpenTrail(point.id)} className="mt-2 min-h-[44px] underline underline-offset-2">Follow the full trail</button>
    </article>
  );
}
