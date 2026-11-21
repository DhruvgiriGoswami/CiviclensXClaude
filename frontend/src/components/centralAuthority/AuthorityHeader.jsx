import React from 'react';
import { Building2, RefreshCw, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function AuthorityHeader({ onRefresh, isRefreshing, onBackToMap }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-[#12161F] light:bg-white border-b border-slate-800 light:border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md transition-colors">
      {/* Left: Back to Citizen Map Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToMap}
          className="p-2 rounded-lg bg-slate-800/80 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-colors border border-slate-700/60 light:border-slate-300 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          title="Return to Citizen Map"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Citizen Map</span>
        </button>
      </div>

      {/* Center: Title "CivicLens Central Authority Console" */}
      <div className="flex items-center justify-center gap-2.5 text-center">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 light:bg-blue-100 border border-blue-500/40 light:border-blue-300 flex items-center justify-center text-blue-400 light:text-blue-600 shadow-inner flex-shrink-0">
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <h1 className="font-extrabold text-sm sm:text-base md:text-lg text-slate-100 light:text-slate-900 tracking-tight flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span>CivicLens</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 light:bg-amber-100 text-amber-300 light:text-amber-800 border border-amber-500/30 light:border-amber-300 uppercase tracking-wider font-semibold">
            Central Authority Console
          </span>
        </h1>
      </div>

      {/* Right: Theme Toggle & Refresh Data Button */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-slate-800/80 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-700/60 light:border-slate-300 transition-colors cursor-pointer flex items-center gap-1 text-xs"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-mono">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden md:inline font-mono">Dark</span>
            </>
          )}
        </button>

        {/* Refresh Data Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-lg bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 text-xs font-medium border border-slate-700 light:border-slate-300 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          title="Reload Live API Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400 light:text-blue-600' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>
    </header>
  );
}
