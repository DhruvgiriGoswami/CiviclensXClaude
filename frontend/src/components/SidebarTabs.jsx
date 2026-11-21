import React from 'react';

// The crimson pill tab bar used at the top of the sidebar. tabs: [{ id, label }].
export function SidebarTabs({ tabs, active, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex items-center space-x-1 bg-slate-950 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300 text-xs ${className}`}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-1.5 rounded-lg transition-all text-center ${active === t.id ? 'bg-crimson-600 text-white font-bold' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
            }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
