import React, { useState } from 'react';
import { ChevronRight, ShieldCheck, Cpu } from 'lucide-react';
import { PROJECT_DEMO } from '../data/projectDemoData';

export function CitizenView() {
  const [selectedCategory, setSelectedCategory] = useState("materials");
  const [selectedSubItem, setSelectedSubItem] = useState("Steel Reinforcement Bars (Fe550D)");

  const { project, citizenBreakdown } = PROJECT_DEMO;
  const activeCategoryObj = citizenBreakdown.categories.find(c => c.id === selectedCategory) || citizenBreakdown.categories[1];

  return (
    <div className="w-full bg-[#0D1117] light:bg-white border border-cyan-500/30 light:border-slate-300 rounded-2xl p-6 text-slate-100 light:text-slate-900 font-sans shadow-2xl relative overflow-hidden">
      {/* Accent Top Bar indicating 20% Citizen Section */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500"></div>

      {/* Section Header */}
      <div className="mb-6 pb-4 border-b border-slate-800 light:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-emerald-400 light:text-emerald-700 tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/30 light:border-emerald-200">
              CITIZEN TRANSPARENCY MODULE (20% VIEW)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 light:text-slate-900 mt-1">
            "Where Did The Money Go?"
          </h2>
          <p className="text-xs text-slate-400 light:text-slate-600">
            A clean, human-readable view tracing public tax rupees from government allocation to local ward execution.
          </p>
        </div>

        <div className="bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 px-3 py-1.5 rounded-xl text-xs text-slate-300 light:text-slate-800 shadow-sm">
          Project: <span className="font-bold text-white light:text-slate-900">Ward 150 Road Rehabilitation</span>
        </div>
      </div>

      {/* Overview Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-950/80 light:bg-slate-50 p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 light:text-slate-600 uppercase block font-bold">Govt Allocation</span>
          <span className="text-base font-extrabold text-cyan-300 light:text-cyan-800">{project.estimatedCost}</span>
        </div>
        <div className="bg-slate-950/80 light:bg-slate-50 p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 light:text-slate-600 uppercase block font-bold">Contract Awarded</span>
          <span className="text-base font-extrabold text-amber-300 light:text-amber-800">{project.contractAwardedCost}</span>
        </div>
        <div className="bg-slate-950/80 light:bg-slate-50 p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 light:text-slate-600 uppercase block font-bold">Current Approved</span>
          <span className="text-base font-extrabold text-blue-300 light:text-blue-800">{project.currentApprovedCost}</span>
        </div>
        <div className="bg-slate-950/80 light:bg-slate-50 p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 light:text-slate-600 uppercase block font-bold">Total Amount Paid</span>
          <span className="text-base font-extrabold text-emerald-400 light:text-emerald-700">{project.totalDisbursed}</span>
        </div>
      </div>

      {/* Main Interactive Drill-Down Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Categories List */}
        <div className="bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="text-xs font-bold text-slate-400 light:text-slate-600 uppercase mb-2 px-1">
            DISBURSEMENT BREAKDOWN ({citizenBreakdown.totalPaid})
          </div>

          {citizenBreakdown.categories.map((cat) => {
            const isSelected = cat.id === selectedCategory;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.subItems && cat.subItems.length > 0) {
                    setSelectedSubItem(cat.subItems[0].name);
                  }
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                  isSelected
                    ? "bg-cyan-950/50 light:bg-cyan-50 border-cyan-500/60 light:border-cyan-400 text-white light:text-slate-900 shadow-lg ring-1 ring-cyan-400"
                    : "bg-slate-900/60 light:bg-white border-slate-800 light:border-slate-200 text-slate-300 light:text-slate-700 hover:bg-slate-900 light:hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="text-xs font-bold font-sans text-slate-100 light:text-slate-900 group-hover:text-cyan-300 light:group-hover:text-cyan-700">
                    {cat.name}
                  </div>
                  <div className="text-xs text-slate-400 light:text-slate-600">{cat.percentage}% of total paid</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-emerald-400 light:text-emerald-700 text-xs">{cat.amount}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-cyan-400 light:text-cyan-600' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Middle Column: Selected Category Sub-Items */}
        <div className="bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-cyan-400 light:text-cyan-700 uppercase mb-2">
              ITEMIZED DETAILS — {activeCategoryObj.name} ({activeCategoryObj.amount})
            </div>

            <div className="space-y-2">
              {activeCategoryObj.subItems.map((sub, idx) => {
                const isSubSelected = sub.name === selectedSubItem;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSubItem(sub.name)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSubSelected
                        ? "bg-slate-900 light:bg-white border-cyan-400 light:border-cyan-500 text-white light:text-slate-900 shadow-md ring-1 ring-cyan-400"
                        : "bg-slate-900/60 light:bg-white border-slate-800/80 light:border-slate-200 text-slate-300 light:text-slate-700 hover:bg-slate-900 light:hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{sub.name}</span>
                      <span className="text-emerald-400 light:text-emerald-700">{sub.amount}</span>
                    </div>

                    {sub.supplier && (
                      <div className="text-xs text-slate-400 light:text-slate-600 mt-1">
                        Supplier: <span className="text-cyan-300 light:text-cyan-800 font-bold">{sub.supplier}</span>
                      </div>
                    )}

                    {sub.paymentRail && (
                      <div className="text-xs text-slate-400 light:text-slate-600 mt-1">
                        Rail: <span className="text-emerald-300 light:text-emerald-800 font-bold">{sub.paymentRail}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-500 light:text-slate-600 pt-3 border-t border-slate-900 light:border-slate-200">
            Click any sub-item to inspect payment verification proof.
          </div>
        </div>

        {/* Right Column: Progressive Drill-Down & Verification Receipt */}
        <div className="bg-slate-950/90 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4 text-xs shadow-sm">
          <div>
            <div className="text-xs font-bold text-emerald-400 light:text-emerald-700 uppercase mb-2 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>PAYMENT RECORD & LINEAGE</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-500 light:text-slate-600 block text-xs uppercase font-bold">Selected Sub-Item</span>
                <span className="font-bold text-slate-100 light:text-slate-900">{selectedSubItem}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-500 light:text-slate-600 block text-xs uppercase font-bold">Beneficiary Identity</span>
                <span className="font-bold text-cyan-300 light:text-cyan-800">JSW Steel Ltd / Authorized Supplier Wallet</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-500 light:text-slate-600 block text-xs uppercase font-bold">Disbursement Status</span>
                <span className="font-bold text-emerald-400 light:text-emerald-700">VERIFIED & SETTLED</span>
              </div>

              {/* CBDC Reference Bar */}
              <div className="p-3 rounded-xl bg-cyan-950/40 light:bg-cyan-50 border border-cyan-900/60 light:border-cyan-200 text-xs space-y-1 shadow-sm">
                <div className="text-cyan-400 light:text-cyan-700 font-bold uppercase flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Sovereign Settlement Proof</span>
                </div>
                <div className="text-slate-300 light:text-slate-800 font-bold truncate">
                  TxHash: 0x770a8291c944_cbdc_tx_90442
                </div>
                <div className="text-slate-400 light:text-slate-600 font-medium">
                  Settled via Wholesale CBDC Digital Payment Rail
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-xs text-slate-400 light:text-slate-600 leading-snug shadow-sm">
            Progressive drill path: Govt Allocation → Project → Tender → Contract → Work → Bill → Payment → Recipient.
          </div>
        </div>

      </div>
    </div>
  );
}
