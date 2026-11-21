import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Landmark } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import { auditApi } from '../pages/FollowTheRupee/auditApi';
import { formatINR, formatPct } from '../utils/format';

// Mumbai's 2025 monsoon repair budget per ward, from the hackathon dataset
// (wards.csv monsoon_repair_budget_inr_2025; spend is work_orders.csv cost_inr).
// Returns null while loading and [] if the audit data can't be read.
export function useWardBudgets() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let live = true;
    auditApi.wards()
      .then((w) => live && setRows([...w].sort((a, b) => b.budget_inr - a.budget_inr)))
      .catch(() => live && setRows([]));
    return () => { live = false; };
  }, []);
  return rows;
}

export const totalBudget = (rows) => rows.reduce((t, w) => t + w.budget_inr, 0);

export function WardBudgetModal({ isOpen, onClose, rows }) {
  const ref = useDialog(isOpen, onClose);
  if (!isOpen) return null;
  const list = rows || [];
  const budget = totalBudget(list);
  const spent = list.reduce((t, w) => t + w.spend_inr, 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="budget-heading" tabIndex={-1}
        className="w-full max-w-2xl max-h-[90vh] bg-dark-800 light:bg-white rounded-2xl border border-slate-700/80 light:border-slate-300 shadow-2xl flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 light:border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-500/15 light:bg-crimson-50 flex items-center justify-center text-crimson-400 light:text-crimson-700">
              <Landmark className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="budget-heading" className="text-base sm:text-lg font-semibold text-white light:text-slate-900">
                Mumbai monsoon repair budget, 2025
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600">
                What each of the {list.length || 24} BMC wards was given for monsoon road repairs, and what it has spent.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" title="Close"
            className="w-11 h-11 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-900/[0.05] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {rows === null && <p className="text-sm text-slate-400 light:text-slate-600">Loading the ward budgets.</p>}
          {rows && !rows.length && <p className="text-sm text-slate-400 light:text-slate-600">The ward budgets could not be loaded.</p>}
          {list.length > 0 && (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-slate-400 light:text-slate-500 text-xs border-b border-slate-700/60 light:border-slate-200">
                <tr>
                  <th className="py-2 pr-3 font-medium">Ward</th>
                  <th className="py-2 pr-3 font-medium hidden sm:table-cell">Zone</th>
                  <th className="py-2 pr-3 font-medium text-right">Budget</th>
                  <th className="py-2 font-medium text-right">Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 light:divide-slate-100">
                {list.map((w) => (
                  <tr key={w.ward_code}>
                    <td className="py-2 pr-3">
                      <span className="font-mono font-semibold text-slate-200 light:text-slate-900 mr-2">{w.ward_code}</span>
                      <span className="text-slate-400 light:text-slate-600">{w.ward_name}</span>
                    </td>
                    <td className="py-2 pr-3 text-slate-400 light:text-slate-600 hidden sm:table-cell whitespace-nowrap">{w.zone}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-slate-100 light:text-slate-900 tabular-nums whitespace-nowrap">{formatINR(w.budget_inr)}</td>
                    <td className={`py-2 text-right tabular-nums whitespace-nowrap ${w.spend_inr > w.budget_inr ? 'text-red-400 light:text-red-700 font-semibold' : 'text-slate-300 light:text-slate-700'}`}>
                      {formatINR(w.spend_inr)} <span className="text-xs opacity-70">({formatPct(w.spend_share)})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-4 text-xs text-slate-400 light:text-slate-600">
            Source: the hackathon dataset. Budgets are <code>monsoon_repair_budget_inr_2025</code> in <code>wards.csv</code>; spending adds up <code>cost_inr</code> in <code>work_orders.csv</code>. The data is synthetic.
          </p>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 light:border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 light:text-slate-500">
            Total: <strong className="text-slate-200 light:text-slate-800">{formatINR(budget)}</strong> budget, {formatINR(spent)} spent
          </span>
          <a href="/follow-the-rupee" className="min-h-[44px] inline-flex items-center px-4 rounded-full bg-crimson-600 hover:bg-crimson-700 text-white text-xs font-semibold transition-colors">
            Open the Mumbai audit
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
