import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Layers, Tag } from 'lucide-react';

export function AnalyticsPanel({ stats, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!stats || (!stats.by_category && !stats.by_status)) return null;

  const categories = Object.entries(stats.by_category || {}).sort((a, b) => b[1] - a[1]);
  const statuses = Object.entries(stats.by_status || {}).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = categories.length > 0 ? Math.max(...categories.map(c => c[1])) : 1;
  const maxStatusCount = statuses.length > 0 ? Math.max(...statuses.map(s => s[1])) : 1;

  return (
    <div className="bg-[#12161F] light:bg-white border-b border-slate-800 light:border-slate-200 transition-colors">
      {/* Collapsible Header Toggle */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-4 py-2.5 sm:px-6 flex items-center justify-between text-left hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-blue-400 light:text-blue-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 light:text-slate-700">
            Live Operational Analytics Breakdown
          </h3>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 light:text-slate-600">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 sm:px-6 pt-1 pb-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Breakdown by Category */}
            <div className="bg-[#0B0D12] light:bg-slate-50 border border-slate-800/80 light:border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-3 text-slate-400 light:text-slate-600 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-200 light:text-slate-800">
                  <Tag className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                  Complaints by Category
                </span>
                <span>{categories.length} Categories</span>
              </div>

              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {categories.length === 0 ? (
                  <div className="text-xs text-slate-400 light:text-slate-500 py-4 text-center">No category data available</div>
                ) : (
                  categories.map(([cat, count]) => {
                    const percent = Math.round((count / maxCategoryCount) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-sans">
                          <span className="text-slate-300 light:text-slate-700 truncate max-w-[200px]">{cat}</span>
                          <span className=" text-slate-400 light:text-slate-600">{count.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 light:bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Breakdown by Status */}
            <div className="bg-[#0B0D12] light:bg-slate-50 border border-slate-800/80 light:border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-3 text-slate-400 light:text-slate-600 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-200 light:text-slate-800">
                  <Layers className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                  Distribution by Status
                </span>
                <span>{statuses.length} Status States</span>
              </div>

              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {statuses.length === 0 ? (
                  <div className="text-xs text-slate-400 light:text-slate-500 py-4 text-center">No status data available</div>
                ) : (
                  statuses.map(([st, count]) => {
                    const percent = Math.round((count / maxStatusCount) * 100);
                    let barColor = 'bg-slate-500 light:bg-slate-600';
                    if (st === 'OPEN') barColor = 'bg-amber-500 light:bg-amber-600';
                    else if (st === 'IN_PROGRESS' || st === 'IN PROGRESS') barColor = 'bg-blue-500 light:bg-blue-600';
                    else if (st === 'RESOLVED') barColor = 'bg-emerald-500 light:bg-emerald-600';

                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex justify-between text-xs font-sans">
                          <span className="text-slate-300 light:text-slate-700 text-xs uppercase">{st}</span>
                          <span className=" text-slate-400 light:text-slate-600">{count.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
