import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { CONTROL_POINTS_DEMO } from '../data/riskDemoData';

export function ControlPoints() {
  return (
    <div className="w-full bg-[#0B0E17] light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl p-6 text-slate-100 light:text-slate-900 font-sans shadow-xl">
      {/* Section Header */}
      <div className="mb-6 pb-4 border-b border-slate-800 light:border-slate-200">
        <span className="text-xs uppercase font-bold text-cyan-400 light:text-cyan-700 tracking-wider">
          INSTITUTIONAL GOVERNANCE
        </span>
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900">Financial Control Points</h2>
        <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
          Systematic scrutiny triggers across procurement, physical measurement, material pricing, and contract variations.
        </p>
      </div>

      {/* 5 Control Point Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONTROL_POINTS_DEMO.map((cp) => (
          <div
            key={cp.id}
            className="bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/50 light:hover:border-cyan-400 transition-all duration-200 shadow-lg group relative overflow-hidden"
          >
            {/* Top Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-400 light:text-cyan-700 uppercase">
                  {cp.code}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold border ${
                  cp.severity === 'HIGH_ATTENTION'
                    ? 'bg-rose-500/20 light:bg-rose-100 text-rose-300 light:text-rose-800 border-rose-500/40 light:border-rose-300'
                    : cp.severity === 'MEDIUM_ATTENTION'
                    ? 'bg-amber-500/20 light:bg-amber-100 text-amber-300 light:text-amber-800 border-amber-500/40 light:border-amber-300'
                    : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-800 border-slate-700 light:border-slate-300'
                }`}>
                  {cp.severity.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 light:text-slate-900 group-hover:text-cyan-300 light:group-hover:text-cyan-700 transition-colors">
                {cp.title}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 mb-4">{cp.subtitle}</p>

              {/* Card Metrics Breakdown */}
              <div className="bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 rounded-xl p-3 mb-4 space-y-2 text-xs shadow-sm">
                {cp.metrics.estimatedCost && (
                  <div className="flex justify-between border-b border-slate-800/80 light:border-slate-200 pb-1.5">
                    <span className="text-slate-400 light:text-slate-600">Estimate:</span>
                    <span className="font-bold text-slate-200 light:text-slate-900">{cp.metrics.estimatedCost}</span>
                  </div>
                )}

                {cp.metrics.bids && (
                  <div className="space-y-1 pt-1">
                    {cp.metrics.bids.map((b) => (
                      <div key={b.code} className="flex justify-between text-xs">
                        <span className="text-slate-300 light:text-slate-700">{b.code} ({b.bidder}):</span>
                        <span className={`font-bold ${b.code === 'P1' ? 'text-amber-300 light:text-amber-700' : 'text-slate-400 light:text-slate-600'}`}>
                          {b.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {cp.metrics.workItem && (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-300 light:text-slate-800 font-sans font-semibold">{cp.metrics.workItem}</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Contract Spec:</span>
                      <span className="text-slate-200 light:text-slate-900 font-bold">{cp.metrics.contractSpecification}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Municipal MB:</span>
                      <span className="text-rose-400 light:text-rose-700 font-bold">{cp.metrics.recordedMunicipalMB}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Independent Audit:</span>
                      <span className="text-emerald-400 light:text-emerald-700 font-bold">{cp.metrics.independentAuditMeasurement}</span>
                    </div>
                  </div>
                )}

                {cp.metrics.material && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Material:</span>
                      <span className="text-slate-200 light:text-slate-900 font-bold">{cp.metrics.material}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Market Range:</span>
                      <span className="text-emerald-400 light:text-emerald-700 font-bold">{cp.metrics.comparableMarketRange}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Project Invoice:</span>
                      <span className="text-rose-400 light:text-rose-700 font-bold">{cp.metrics.projectPurchasePrice}</span>
                    </div>
                  </div>
                )}

                {cp.metrics.originalAwardValue && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Original Award:</span>
                      <span className="text-slate-200 light:text-slate-900 font-bold">{cp.metrics.originalAwardValue}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Approved Variations:</span>
                      <span className="text-amber-300 light:text-amber-700 font-bold">+₹1.90 Cr</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Current Total:</span>
                      <span className="text-cyan-300 light:text-cyan-700 font-bold">{cp.metrics.currentApprovedValue}</span>
                    </div>
                  </div>
                )}

                {cp.metrics.vendorName && (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-200 light:text-slate-900 truncate">{cp.metrics.vendorName}</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Contracts Evaluated:</span>
                      <span className="text-slate-200 light:text-slate-900 font-bold">{cp.metrics.contractsEvaluated}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Avg Discount:</span>
                      <span className="text-amber-300 light:text-amber-700 font-bold">{cp.metrics.avgBidDiscount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 light:text-slate-600">Avg Variation Creep:</span>
                      <span className="text-rose-300 light:text-rose-700 font-bold">{cp.metrics.avgVariationCreep}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Signal text */}
              <div className="p-3 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-xs text-slate-300 light:text-slate-800 space-y-1.5 mb-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 light:text-amber-700 uppercase">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Analytical Observation</span>
                </div>
                <p className="leading-relaxed">{cp.signalText}</p>
              </div>

              {/* Action recommendation */}
              <div className="p-3 rounded-xl bg-cyan-950/30 light:bg-cyan-50 border border-cyan-900/40 light:border-cyan-200 text-xs text-cyan-200 light:text-cyan-900 space-y-1 shadow-sm">
                <div className=" text-xs font-bold text-cyan-400 light:text-cyan-700 uppercase">
                  Institutional Action Path
                </div>
                <p className="leading-relaxed">{cp.actionText}</p>
              </div>
            </div>

            {/* Disclaimer footer */}
            <div className="mt-4 pt-2 border-t border-slate-900 light:border-slate-200 text-xs text-slate-500 light:text-slate-600 italic">
              {cp.disclaimer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
