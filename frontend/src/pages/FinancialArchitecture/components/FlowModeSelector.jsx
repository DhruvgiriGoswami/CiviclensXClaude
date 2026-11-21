import React from 'react';
import { DollarSign, ShieldCheck, Database } from 'lucide-react';
import { FLOW_MODES } from '../data/architectureData';

export function FlowModeSelector({ activeMode, onSelectMode }) {
  const modes = [
    {
      id: FLOW_MODES.MONEY,
      label: "Money",
      icon: DollarSign,
      color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
      description: "Government → Municipal Fund → Project → Vendor → Supplier → Worker"
    },
    {
      id: FLOW_MODES.CONTROL,
      label: "Control",
      icon: ShieldCheck,
      color: "text-cyan-400 border-cyan-500/50 bg-cyan-500/10",
      description: "Allocation → Eligibility → Tender → Award → Milestone → Inspection → Approval"
    },
    {
      id: FLOW_MODES.DATA,
      label: "Data",
      icon: Database,
      color: "text-indigo-400 border-indigo-500/50 bg-indigo-500/10",
      description: "Funding ID → Project ID → Tender ID → Bid ID → Contract ID → Bill ID → CBDC Hash"
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-xl p-2 sm:px-4 sm:py-2.5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 light:text-slate-700">
        <span>Show the flow of</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 min-h-[44px] rounded-lg border text-sm font-semibold transition-colors ${
                isActive
                  ? mode.color
                  : "bg-slate-950/60 light:bg-slate-50 border-slate-800 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900"
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
