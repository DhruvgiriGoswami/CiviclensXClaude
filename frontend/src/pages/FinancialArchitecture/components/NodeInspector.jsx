import React from 'react';
import { X, ShieldAlert, CheckCircle2, Lock, Cpu } from 'lucide-react';

export function NodeInspector({ node, onClose }) {
  if (!node) return null;

  const details = node.details || {};

  return (
    <div className="w-full lg:w-96 bg-slate-900/95 light:bg-white/95 border-l border-slate-800 light:border-slate-300 text-slate-100 light:text-slate-900 flex flex-col h-full shadow-2xl z-30 transition-all duration-300">
      {/* Inspector Header */}
      <div className="p-4 border-b border-slate-800 light:border-slate-200 flex items-center justify-between bg-slate-950/80 light:bg-slate-50">
        <div>
          <span className="text-xs uppercase font-bold text-crimson-400 light:text-crimson-700 tracking-wider">
            Details
          </span>
          <h3 className="text-sm font-bold text-slate-100 light:text-slate-900 uppercase tracking-wide">
            {node.title}
          </h3>
          <p className="text-xs text-slate-400 light:text-slate-600">{node.code}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-400 light:text-slate-700 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Content */}
      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
        <p role="note" className="rounded-lg bg-amber-100 text-amber-950 text-xs font-medium px-3 py-2">
          Illustrative data, not real records.
        </p>
        {/* Core summary metrics */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 light:bg-slate-100 p-3 rounded-xl border border-slate-800 light:border-slate-300 shadow-sm">
          <div>
            <div className="text-xs text-slate-500 light:text-slate-600 uppercase">Financial Volume</div>
            <div className="text-sm font-bold text-crimson-300 light:text-crimson-700">{node.amount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 light:text-slate-600 uppercase">Operational Status</div>
            <div className="text-xs font-bold text-emerald-400 light:text-emerald-700">{node.status}</div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-slate-950/40 light:bg-slate-50 p-3 rounded-xl border border-slate-800/80 light:border-slate-200 text-slate-300 light:text-slate-700 leading-relaxed shadow-sm">
          <div className="text-xs uppercase text-slate-500 light:text-slate-600 font-bold mb-1">Entity Function</div>
          {node.description}
        </div>

        {/* Dynamic Details Key-Values */}
        <div className="space-y-2">
          <div className="text-xs uppercase font-bold text-slate-400 light:text-slate-600 border-b border-slate-800 light:border-slate-200 pb-1">
            Institutional Control Specs
          </div>

          {Object.entries(details).map(([key, val]) => {
            if (key === 'rules' || key === 'permittedCategories' || key === 'unpermittedCategories' || key === 'bidsReceived') {
              return null;
            }

            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());

            return (
              <div key={key} className="flex flex-col bg-slate-950/40 light:bg-slate-50 p-2 rounded-lg border border-slate-800/50 light:border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 light:text-slate-600">{formattedKey}</span>
                <span className=" text-slate-200 light:text-slate-900 font-bold break-words">{String(val)}</span>
              </div>
            );
          })}
        </div>

        {/* Render Rules */}
        {details.rules && (
          <div className="space-y-1.5">
            <div className="text-xs uppercase font-bold text-indigo-400 light:text-indigo-700 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Smart Programmability Rules</span>
            </div>
            <ul className="space-y-1 text-xs">
              {details.rules.map((rule, idx) => (
                <li key={idx} className="bg-indigo-950/30 light:bg-indigo-50 text-indigo-200 light:text-indigo-900 border border-indigo-900/40 light:border-indigo-200 p-2 rounded-lg flex items-start gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 light:text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Permitted Categories */}
        {details.permittedCategories && (
          <div>
            <div className="text-xs uppercase font-bold text-emerald-400 light:text-emerald-700 mb-1">
              Permitted Expenditure Categories
            </div>
            <div className="flex flex-wrap gap-1">
              {details.permittedCategories.map((cat, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 light:bg-emerald-50 text-emerald-300 light:text-emerald-800 border border-emerald-500/30 light:border-emerald-300 text-xs font-bold">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bids received list */}
        {details.bidsReceived && (
          <div className="space-y-1.5">
            <div className="text-xs uppercase font-bold text-amber-400 light:text-amber-700">
              Submitted Financial Bids
            </div>
            {details.bidsReceived.map((b, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-950/70 light:bg-slate-50 border border-slate-800 light:border-slate-200 flex justify-between text-xs shadow-sm">
                <span className="text-slate-300 light:text-slate-800">{b.bidder}</span>
                <span className="font-bold text-amber-300 light:text-amber-700">{b.amount}</span>
              </div>
            ))}
          </div>
        )}

        {/* Discrepancy Signal Warning Alert if present */}
        {(details.anomalySignal || details.signal) && (
          <div className="p-3 rounded-xl bg-rose-950/40 light:bg-rose-50 border border-rose-900/60 light:border-rose-200 text-rose-200 light:text-rose-900 space-y-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 light:text-rose-700 uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Institutional Signal Triggered</span>
            </div>
            <p className="text-xs leading-relaxed font-sans font-medium">
              {details.anomalySignal || details.signal}
            </p>
          </div>
        )}

        {/* CBDC Proof Verification Bar */}
        <div className="p-3 rounded-xl bg-crimson-900/30 light:bg-crimson-50 border border-crimson-900/40 light:border-crimson-200 text-crimson-200 light:text-crimson-900 space-y-1 text-xs shadow-sm">
          <div className="flex items-center gap-1 text-crimson-400 light:text-crimson-700 font-bold uppercase">
            <Cpu className="w-3.5 h-3.5" />
            <span>CBDC Ledger Cryptographic Trace</span>
          </div>
          <div className="text-slate-400 light:text-slate-700 truncate font-bold">
            Ref: {details.transactionReference || details.cbdcAccount || details.cbdcTxHash || "SAMPLE-HASH-98f4a102c842b109e4401a9"}
          </div>
        </div>
      </div>
    </div>
  );
}
