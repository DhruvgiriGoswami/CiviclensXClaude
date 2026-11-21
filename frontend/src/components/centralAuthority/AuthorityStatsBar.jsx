import React, { useState } from 'react';
import { Ticket, AlertCircle, Clock, CheckCircle2, XCircle, PieChart, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export function AuthorityStatsBar({ stats, isLoading, error, onFilterByStatus, activeStatus, defaultOpen = true }) {
  const [isCollapsed, setIsCollapsed] = useState(!defaultOpen);

  if (isLoading) {
    return (
      <div className="bg-[#0F142A] light:bg-[#EEF2FF] border-b border-indigo-500/30 light:border-indigo-200 p-3 sm:px-6 flex items-center justify-center gap-2 text-indigo-300 light:text-indigo-800 text-xs py-4 transition-colors">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400 light:text-indigo-600" />
        <span>Loading ticket summary statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0F142A] light:bg-[#EEF2FF] border-b border-indigo-500/30 light:border-indigo-200 p-3 sm:px-6">
        <div className="p-2.5 rounded-lg bg-rose-950/40 light:bg-rose-50 border border-rose-800/60 light:border-rose-200 text-rose-300 light:text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 light:text-rose-600 flex-shrink-0" />
          <span>Unable to load live statistics: {error}</span>
        </div>
      </div>
    );
  }

  const total = stats?.total ?? 0;
  const openCount = stats?.open ?? 0;
  const inProgressCount = stats?.in_progress ?? 0;
  const resolvedCount = stats?.resolved ?? 0;
  const closedCount = stats?.closed ?? 0;

  const statCards = [
    {
      id: '',
      title: 'Total Tickets',
      value: total,
      icon: Ticket,
      borderColor: 'border-slate-700 light:border-slate-300',
      bgColor: 'bg-[#151C33] light:bg-white',
      textColor: 'text-slate-200 light:text-slate-900',
    },
    {
      id: 'OPEN',
      title: 'Open Complaints',
      value: openCount,
      icon: AlertCircle,
      borderColor: 'border-amber-500/40 light:border-amber-300',
      bgColor: 'bg-amber-500/10 light:bg-amber-50',
      textColor: 'text-amber-400 light:text-amber-800',
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      value: inProgressCount,
      icon: Clock,
      borderColor: 'border-blue-500/40 light:border-blue-300',
      bgColor: 'bg-blue-500/10 light:bg-blue-50',
      textColor: 'text-blue-400 light:text-blue-800',
    },
    {
      id: 'RESOLVED',
      title: 'Resolved',
      value: resolvedCount,
      icon: CheckCircle2,
      borderColor: 'border-emerald-500/40 light:border-emerald-300',
      bgColor: 'bg-emerald-500/10 light:bg-emerald-50',
      textColor: 'text-emerald-400 light:text-emerald-800',
    },
  ];

  if (closedCount > 0) {
    statCards.push({
      id: 'CLOSED',
      title: 'Closed',
      value: closedCount,
      icon: XCircle,
      borderColor: 'border-slate-600/40 light:border-slate-300',
      bgColor: 'bg-slate-700/10 light:bg-slate-100',
      textColor: 'text-slate-400 light:text-slate-700',
    });
  }

  return (
    <div className="bg-[#0F142A] light:bg-[#EEF2FF] border-b border-indigo-500/30 light:border-indigo-200 p-3 sm:px-6 transition-colors shadow-sm">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between cursor-pointer select-none group py-0.5"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 light:text-indigo-900 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-indigo-400 light:text-indigo-700" />
            Live Ticket Overview & Metrics
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Collapsed Summary Badges Preview */}
          {isCollapsed && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-300 light:text-slate-800">
                Total: <strong className="text-white light:text-slate-900">{total}</strong>
              </span>
              <span className="text-amber-400 light:text-amber-800">
                Open: <strong>{openCount}</strong>
              </span>
              <span className="text-blue-400 light:text-blue-800">
                In Progress: <strong>{inProgressCount}</strong>
              </span>
              <span className="text-emerald-400 light:text-emerald-800">
                Resolved: <strong>{resolvedCount}</strong>
              </span>
            </div>
          )}

          <button
            type="button"
            className="text-xs font-bold text-indigo-300 light:text-indigo-800 group-hover:text-white light:group-hover:text-indigo-900 flex items-center gap-1 transition-colors"
          >
            <span>{isCollapsed ? 'Expand Overview' : 'Collapse Overview'}</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Stat Cards Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-3 animate-fadeIn">
          {statCards.map((card) => {
            const Icon = card.icon;
            const isSelected = (activeStatus || '') === card.id;

            return (
              <button
                key={card.title}
                onClick={() => onFilterByStatus && onFilterByStatus(card.id)}
                className={`p-2.5 sm:p-3 rounded-xl border ${card.borderColor} ${card.bgColor} text-left transition-all hover:scale-[1.01] focus:outline-none cursor-pointer relative overflow-hidden shadow-sm ${
                  isSelected ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-400 light:text-slate-600 truncate">
                    {card.title}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${card.textColor}`} />
                </div>

                <div className="flex items-baseline justify-between">
                  <span className={`text-lg sm:text-xl font-bold ${card.textColor}`}>
                    {card.value.toLocaleString()}
                  </span>

                  {total > 0 && card.id !== '' && (
                    <span className="text-xs text-slate-400 light:text-slate-600 font-bold">
                      {Math.round((card.value / total) * 100)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
