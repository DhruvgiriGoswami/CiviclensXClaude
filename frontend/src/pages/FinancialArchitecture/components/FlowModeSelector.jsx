import React from 'react';
import { DollarSign, ShieldCheck, Database } from 'lucide-react';
import { FLOW_MODES } from '../data/architectureData';

export function FlowModeSelector({ activeMode, onSelectMode }) {
  const modes = [
    {
      id: FLOW_MODES.MONEY,
      label: "MONEY FLOW",
      icon: DollarSign,
      color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
      description: "Government → Municipal Fund → Project → Vendor → Supplier → Worker"
    },
    {
      id: FLOW_MODES.CONTROL,
      label: "CONTROL FLOW",
      icon: ShieldCheck,
      color: "text-cyan-400 border-cyan-500/50 bg-cyan-500/10",
      description: "Allocation → Eligibility → Tender → Award → Milestone → Inspection → Approval"
    },
    {
      id: FLOW_MODES.DATA,
      label: "DATA FLOW",
      icon: Database,
      color: "text-indigo-400 border-indigo-500/50 bg-indigo-500/10",
      description: "Funding ID → Project ID → Tender ID → Bid ID → Contract ID → Bill ID → CBDC Hash"
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:px-4 sm:py-2.5 shadow-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
        <span>Canvas View Mode:</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                isActive
                  ? `${mode.color} shadow-lg scale-[1.02]`
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
              title={mode.description}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
