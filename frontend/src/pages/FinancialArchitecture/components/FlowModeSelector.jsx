import React from 'react';
import { DollarSign, ShieldCheck, Database } from 'lucide-react';
import { FLOW_MODES } from '../data/architectureData';

export function FlowModeSelector({ activeMode, onSelectMode }) {
  const modes = [
    {
      id: FLOW_MODES.MONEY,
      label: "Money",
      icon: DollarSign,
      color: "text-emerald-300 light:text-emerald-700",
      description: "Government → Municipal Fund → Project → Vendor → Supplier → Worker"
    },
    {
      id: FLOW_MODES.CONTROL,
      label: "Control",
      icon: ShieldCheck,
      color: "text-crimson-300 light:text-crimson-700",
      description: "Allocation → Eligibility → Tender → Award → Milestone → Inspection → Approval"
    },
    {
      id: FLOW_MODES.DATA,
      label: "Data",
      icon: Database,
      color: "text-indigo-300 light:text-indigo-700",
      description: "Funding ID → Project ID → Tender ID → Bid ID → Contract ID → Bill ID → CBDC Hash"
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-400 light:text-slate-500">
        <span>Show the flow of</span>
      </div>

      <div role="group" aria-label="Flow type" className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.06] light:bg-slate-100 w-full sm:w-auto">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              aria-pressed={isActive}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 h-10 rounded-full text-sm font-medium active:scale-[0.97] transition-[background-color,color,transform] duration-150 ${
                isActive
                  ? `bg-white/[0.12] light:bg-white shadow-sm ${mode.color}`
                  : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
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
