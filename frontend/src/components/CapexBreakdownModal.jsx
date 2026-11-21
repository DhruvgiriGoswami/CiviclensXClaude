import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, ExternalLink, TrendingUp, Landmark, ShieldCheck } from 'lucide-react';

export const TOP_MUNICIPAL_BUDGETS = [
  {
    rank: 1,
    name: 'Brihanmumbai Municipal Corporation (BMC)',
    cityRegion: 'Mumbai, Maharashtra',
    outlay: '₹74,427 – ₹80,952 Cr',
    url: 'https://www.google.com/search?q=Brihanmumbai+Municipal+Corporation+BMC+official+website'
  },
  {
    rank: 2,
    name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    cityRegion: 'Bengaluru, Karnataka',
    outlay: '₹19,930 Cr',
    url: 'https://www.google.com/search?q=Bruhat+Bengaluru+Mahanagara+Palike+BBMP+official+website'
  },
  {
    rank: 3,
    name: 'Municipal Corporation of Delhi (MCD)',
    cityRegion: 'Delhi',
    outlay: '₹16,530 Cr',
    url: 'https://www.google.com/search?q=Municipal+Corporation+of+Delhi+MCD+official+website'
  },
  {
    rank: 4,
    name: 'Ahmedabad Municipal Corporation (AMC)',
    cityRegion: 'Ahmedabad, Gujarat',
    outlay: '₹15,502 Cr',
    url: 'https://www.google.com/search?q=Ahmedabad+Municipal+Corporation+AMC+official+website'
  },
  {
    rank: 5,
    name: 'Pune Municipal Corporation (PMC)',
    cityRegion: 'Pune, Maharashtra',
    outlay: '₹12,618 Cr',
    url: 'https://www.google.com/search?q=Pune+Municipal+Corporation+PMC+official+website'
  },
  {
    rank: 6,
    name: 'Greater Hyderabad Municipal Corporation (GHMC)',
    cityRegion: 'Hyderabad, Telangana',
    outlay: '₹11,460 Cr',
    url: 'https://www.google.com/search?q=Greater+Hyderabad+Municipal+Corporation+GHMC+official+website'
  },
  {
    rank: 7,
    name: 'Surat Municipal Corporation (SMC)',
    cityRegion: 'Surat, Gujarat',
    outlay: '₹10,000 Cr',
    url: 'https://www.google.com/search?q=Surat+Municipal+Corporation+SMC+official+website'
  },
  {
    rank: 8,
    name: 'Pimpri Chinchwad Municipal Corporation (PCMC)',
    cityRegion: 'Pune Metro, Maharashtra',
    outlay: '₹9,675 Cr',
    url: 'https://www.google.com/search?q=Pimpri+Chinchwad+Municipal+Corporation+PCMC+official+website'
  },
  {
    rank: 9,
    name: 'Greater Chennai Corporation (GCC)',
    cityRegion: 'Chennai, Tamil Nadu',
    outlay: '₹8,400 Cr',
    url: 'https://www.google.com/search?q=Greater+Chennai+Corporation+GCC+official+website'
  },
  {
    rank: 10,
    name: 'Navi Mumbai Municipal Corporation (NMMC)',
    cityRegion: 'Navi Mumbai, Maharashtra',
    outlay: '₹6,904 Cr',
    url: 'https://www.google.com/search?q=Navi+Mumbai+Municipal+Corporation+NMMC+official+website'
  },
  {
    rank: 11,
    name: 'Thane Municipal Corporation (TMC)',
    cityRegion: 'Thane, Maharashtra',
    outlay: '₹5,645 Cr',
    url: 'https://www.google.com/search?q=Thane+Municipal+Corporation+TMC+official+website'
  },
  {
    rank: 12,
    name: 'Kolkata Municipal Corporation (KMC)',
    cityRegion: 'Kolkata, West Bengal',
    outlay: '₹5,166 Cr',
    url: 'https://www.google.com/search?q=Kolkata+Municipal+Corporation+KMC+official+website'
  }
];

export function CapexBreakdownModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="CapEx breakdown" className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-[#0E1118] light:bg-white rounded-2xl border border-slate-700/80 light:border-slate-300 shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 light:border-slate-200 flex items-center justify-between bg-slate-900/90 light:bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 light:text-amber-700">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white light:text-slate-900 font-sans">
                  CapEx Tracked Breakdown
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-800 border border-emerald-500/40 light:border-emerald-300">
                  ₹2,02,782 Crore
                </span>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-600 font-mono">
                Top Municipal Corporations by Annual Budget Outlay (India)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white light:text-slate-500 light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="rounded-xl border border-slate-800 light:border-slate-200 overflow-hidden bg-slate-900/40 light:bg-slate-50/50">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800/80 light:bg-slate-200/80 text-slate-300 light:text-slate-700 font-mono uppercase text-[11px] border-b border-slate-700/60 light:border-slate-300">
                <tr>
                  <th className="py-2.5 px-3 sm:px-4 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3 sm:px-4">Municipal Corporation</th>
                  <th className="py-2.5 px-3 sm:px-4 hidden md:table-cell">City / Region</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Latest Budget Outlay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 light:divide-slate-200">
                {TOP_MUNICIPAL_BUDGETS.map((item) => (
                  <tr 
                    key={item.rank}
                    className="hover:bg-slate-800/50 light:hover:bg-slate-100/70 transition-colors group"
                  >
                    <td className="py-2.5 px-3 sm:px-4 text-center font-mono font-bold text-slate-400 light:text-slate-600">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        item.rank === 1
                          ? 'bg-amber-500/20 text-amber-300 light:bg-amber-100 light:text-amber-800 border border-amber-500/40'
                          : item.rank === 2
                          ? 'bg-slate-700/50 text-slate-200 light:bg-slate-200 light:text-slate-800'
                          : item.rank === 3
                          ? 'bg-amber-700/20 text-amber-400 light:bg-amber-50 light:text-amber-900'
                          : 'text-slate-400 light:text-slate-600'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 sm:px-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-100 light:text-slate-900 group-hover:text-amber-400 light:group-hover:text-amber-700 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>{item.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 light:text-slate-400 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                      <div className="text-[11px] text-slate-400 light:text-slate-600 md:hidden font-mono mt-0.5">
                        {item.cityRegion}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-slate-400 light:text-slate-600 font-mono text-xs hidden md:table-cell">
                      {item.cityRegion}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-amber-400 light:text-amber-700 whitespace-nowrap">
                      {item.outlay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 light:bg-slate-100/70 border border-slate-800 light:border-slate-200 text-xs text-slate-400 light:text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 light:text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Outlay figures represent total approved municipal budget allocations across India's premier Tier-1/Tier-2 urban local bodies (ULBs) currently indexed under CivicLens national monitoring.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 light:border-slate-200 bg-slate-900/50 light:bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500 light:text-slate-400">
            Total Monitored CapEx: <strong className="text-slate-200 light:text-slate-800">₹2,02,782 Crore</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-xs font-semibold text-white light:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
