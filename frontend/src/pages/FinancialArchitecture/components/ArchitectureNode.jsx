import React from 'react';
import { Landmark, Cpu, Building2, Lock, FileSpreadsheet, FileCheck, ShieldAlert, CreditCard, Users, ChevronRight } from 'lucide-react';

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

const NODE_THEMES = {
  treasury: "border-slate-700 light:border-slate-300 bg-slate-900/95 light:bg-white text-slate-100 light:text-slate-900",
  settlement: "border-cyan-500/60 light:border-cyan-400 bg-slate-900/95 light:bg-white text-cyan-300 light:text-cyan-900",
  municipal: "border-blue-500/50 light:border-blue-400 bg-slate-900/95 light:bg-white text-blue-200 light:text-blue-900",
  control: "border-indigo-500/60 light:border-indigo-400 bg-slate-900/95 light:bg-white text-indigo-200 light:text-indigo-900",
  procurement: "border-amber-500/50 light:border-amber-400 bg-slate-900/95 light:bg-white text-amber-200 light:text-amber-900",
  execution: "border-emerald-500/50 light:border-emerald-400 bg-slate-900/95 light:bg-white text-emerald-200 light:text-emerald-900",
  verification: "border-rose-500/60 light:border-rose-400 bg-slate-900/95 light:bg-white text-rose-200 light:text-rose-900",
  financial: "border-sky-500/50 light:border-sky-400 bg-slate-900/95 light:bg-white text-sky-200 light:text-sky-900",
  recipients: "border-teal-500/50 light:border-teal-400 bg-slate-900/95 light:bg-white text-teal-200 light:text-teal-900"
};

export function ArchitectureNode({ node, isSelected, onSelect }) {
  const Icon = NODE_ICONS[node.type] || Building2;
  const themeClasses = NODE_THEMES[node.type] || NODE_THEMES.treasury;

  return (
    <div
      onClick={() => onSelect(node)}
      className={`w-60 sm:w-64 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 select-none shadow-xl relative group ${themeClasses} ${
        isSelected
          ? "ring-2 ring-cyan-400 border-cyan-400 scale-[1.03] z-20"
          : "hover:border-cyan-500/60 light:hover:border-cyan-400 hover:scale-[1.01]"
      }`}
    >
      {/* Group label */}
      <div className="text-xs uppercase font-bold text-slate-400 light:text-slate-600 tracking-wider mb-1 flex items-center justify-between">
        <span>{node.groupLabel}</span>
        <span className="text-slate-500 light:text-slate-600 font-bold">{node.code}</span>
      </div>

      {/* Header title & icon */}
      <div className="flex items-start gap-2.5 mb-2">
        <div className="p-1.5 rounded-lg bg-slate-950/80 light:bg-slate-100 border border-slate-700/60 light:border-slate-300 text-cyan-400 light:text-cyan-700 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold font-sans text-slate-100 light:text-slate-900 truncate leading-tight">
            {node.title}
          </h4>
          <p className="text-xs text-slate-400 light:text-slate-600 truncate">{node.subtitle}</p>
        </div>
      </div>

      {/* Amount & Status badge */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 light:border-slate-200 mt-1">
        <div className=" text-xs font-extrabold text-cyan-300 light:text-cyan-800">
          {node.amount}
        </div>
        <div className={`text-xs px-1.5 py-0.5 rounded font-bold border ${
          node.status === 'DISCREPANCY'
            ? 'bg-rose-500/20 light:bg-rose-100 text-rose-300 light:text-rose-800 border-rose-500/40 light:border-rose-300'
            : node.status === 'LOCKED'
            ? 'bg-indigo-500/20 light:bg-indigo-100 text-indigo-300 light:text-indigo-800 border-indigo-500/40 light:border-indigo-300'
            : node.status === 'ACTIVE'
            ? 'bg-cyan-500/20 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border-cyan-500/40 light:border-cyan-300'
            : 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border-emerald-500/40 light:border-emerald-300'
        }`}>
          {node.status}
        </div>
      </div>

      {/* Click indicator hint */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 light:text-cyan-600">
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
