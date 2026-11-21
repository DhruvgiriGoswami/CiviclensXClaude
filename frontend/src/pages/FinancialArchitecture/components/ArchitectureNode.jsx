import React from 'react';
import { Landmark, Cpu, Building2, Lock, FileSpreadsheet, FileCheck, ShieldAlert, CreditCard, Users } from 'lucide-react';

const NODE_ICONS = {
  treasury: Landmark,
  settlement: Cpu,
  municipal: Building2,
  control: Lock,
  procurement: FileSpreadsheet,
  execution: FileCheck,
  verification: ShieldAlert,
  financial: CreditCard,
  recipients: Users
};

// One neutral card style; the type shows as a small coloured dot next to its group label.
const NODE_DOTS = {
  treasury: "bg-slate-400",
  settlement: "bg-crimson-400",
  municipal: "bg-blue-400",
  control: "bg-indigo-400",
  procurement: "bg-amber-400",
  execution: "bg-emerald-400",
  verification: "bg-rose-400",
  financial: "bg-sky-400",
  recipients: "bg-teal-400"
};

export function ArchitectureNode({ node, isSelected, onSelect }) {
  const Icon = NODE_ICONS[node.type] || Building2;
  const dot = NODE_DOTS[node.type] || NODE_DOTS.treasury;

  return (
    <div
      onClick={() => onSelect(node)}
      className={`w-64 min-h-[130px] rounded-2xl border p-4 cursor-pointer select-none relative group bg-dark-800 light:bg-white text-slate-100 light:text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-12px_rgba(0,0,0,0.4)] light:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.18)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 ${
        isSelected
          ? "ring-2 ring-crimson-400 border-crimson-400 z-20"
          : "border-white/[0.08] light:border-slate-200 hover:border-white/20 light:hover:border-slate-300"
      }`}
    >
      {/* Group label */}
      <div className="text-[11px] font-medium text-slate-400 light:text-slate-500 mb-2 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
        <span>{node.groupLabel}</span>
      </div>

      {/* Header title & icon */}
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white/[0.06] light:bg-slate-100 text-slate-300 light:text-slate-600 flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold font-sans text-slate-100 light:text-slate-900 leading-tight">
            {node.title}
          </h4>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">{node.subtitle}</p>
        </div>
      </div>

      {/* Amount & Status badge */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06] light:border-slate-100 mt-1">
        <div className="text-[13px] font-semibold tabular-nums whitespace-nowrap text-slate-100 light:text-slate-900">
          {node.amount}
        </div>
        <div className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
          node.status === 'DISCREPANCY'
            ? 'bg-rose-500/20 light:bg-rose-100 text-rose-300 light:text-rose-800 border-rose-500/40 light:border-rose-300'
            : node.status === 'LOCKED'
            ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-300 light:text-indigo-800 border-indigo-500/40 light:border-indigo-300'
            : node.status === 'ACTIVE'
            ? 'bg-crimson-500/20 light:bg-crimson-100 text-crimson-300 light:text-crimson-800 border-crimson-500/40 light:border-crimson-300'
            : 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border-emerald-500/40 light:border-emerald-300'
        }`}>
          {node.status}
        </div>
      </div>

    </div>
  );
}
