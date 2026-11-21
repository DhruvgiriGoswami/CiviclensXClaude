import React from 'react';
import { AlertCircle, CheckCircle2, Sliders } from 'lucide-react';
import { BITUMEN_PRICE_BENCHMARKS } from '../data/riskDemoData';

export function PriceAnomaly() {
  const { materialName, regionalBenchmarkMin, regionalBenchmarkMax, percentageDeviation, observations, analysisFactors, methodologyNote } = BITUMEN_PRICE_BENCHMARKS;

  const maxPrice = 100;

  return (
    <div className="w-full bg-[#0B0E17] light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl p-6 text-slate-100 light:text-slate-900 font-sans shadow-xl">
      {/* Section Header */}
      <div className="mb-6 pb-4 border-b border-slate-800 light:border-slate-200">
        <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 light:text-cyan-700 tracking-wider">
          PRICE INTELLIGENCE & BENCHMARKING
        </span>
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900">Material Price Anomaly Intelligence</h2>
        <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
          Cross-project market benchmark analysis detecting raw material rate spikes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Bar Chart Visualization */}
        <div className="lg:col-span-2 bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4 font-mono text-xs">
              <div>
                <span className="text-slate-400 light:text-slate-600 block text-[10px] uppercase font-bold">Tracked Commodity</span>
                <span className="font-bold text-slate-100 light:text-slate-900">{materialName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 light:text-slate-600 block text-[10px] uppercase font-bold">Regional Benchmark Range</span>
                <span className="font-bold text-emerald-400 light:text-emerald-700">₹{regionalBenchmarkMin} – ₹{regionalBenchmarkMax} / kg</span>
              </div>
            </div>

            {/* Price Bar Visualization Canvas */}
            <div className="h-48 w-full bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-300 rounded-xl p-4 flex items-end justify-between gap-2 relative shadow-inner">
              {/* Benchmark band overlay */}
              <div
                className="absolute left-0 right-0 bg-emerald-500/10 light:bg-emerald-100/60 border-y border-emerald-500/30 light:border-emerald-300 pointer-events-none"
                style={{
                  bottom: `${(regionalBenchmarkMin / maxPrice) * 100}%`,
                  height: `${((regionalBenchmarkMax - regionalBenchmarkMin) / maxPrice) * 100}%`
                }}
              >
                <span className="absolute right-2 top-0 text-[9px] font-mono text-emerald-400 light:text-emerald-800 font-bold uppercase">
                  Normal Range (₹52–₹56)
                </span>
              </div>

              {/* Bars */}
              {observations.map((obs) => {
                const heightPercent = (obs.price / maxPrice) * 100;

                return (
                  <div key={obs.id} className="flex-1 flex flex-col items-center gap-1 z-10 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 light:bg-slate-900 border border-slate-700 px-2 py-1 rounded font-mono text-[9px] text-slate-200 whitespace-nowrap z-30 pointer-events-none shadow-xl">
                      {obs.label}: ₹{obs.price}/kg ({obs.date})
                    </div>

                    <span className={`text-[10px] font-mono font-bold ${obs.highlighted ? 'text-rose-400 light:text-rose-700' : 'text-slate-400 light:text-slate-600'}`}>
                      ₹{obs.price}
                    </span>

                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        obs.highlighted
                          ? 'bg-rose-500 light:bg-rose-600 shadow-lg shadow-rose-500/30 ring-2 ring-rose-300'
                          : 'bg-slate-700 light:bg-slate-300 group-hover:bg-cyan-500 light:group-hover:bg-cyan-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>

                    <span className="text-[9px] font-mono text-slate-500 light:text-slate-600 font-bold truncate w-full text-center">
                      #{obs.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anomaly Callout Footer */}
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 light:bg-rose-50 border border-rose-900/60 light:border-rose-200 flex items-center justify-between font-mono text-xs shadow-sm">
            <div className="flex items-center gap-2 text-rose-300 light:text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-400 light:text-rose-600 flex-shrink-0" />
              <span>Project PRJ-2026-0042 Purchase: <strong className="text-white light:text-slate-900">₹91 / kg</strong></span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 light:bg-rose-100 text-rose-300 light:text-rose-800 border border-rose-500/40 light:border-rose-300 font-bold">
              {percentageDeviation} Deviation
            </span>
          </div>
        </div>

        {/* Right Column: Analytical Factors & Methodology */}
        <div className="bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400 light:text-cyan-700 mb-3 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              <span>Normalizing Analysis Factors</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300 light:text-slate-700 font-medium">
              {analysisFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-900/60 light:bg-white p-2 rounded-lg border border-slate-800/80 light:border-slate-200 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug">{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Statistical Method Note */}
          <div className="p-3 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-[10px] font-mono text-slate-400 light:text-slate-600 leading-relaxed shadow-sm">
            <div className="font-bold text-slate-300 light:text-slate-900 uppercase mb-1">Analytical Methodology</div>
            {methodologyNote}
          </div>
        </div>

      </div>
    </div>
  );
}
