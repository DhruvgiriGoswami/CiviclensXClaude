import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldAlert, Cpu } from 'lucide-react';
import { PROJECT_DEMO } from '../data/projectDemoData';

export function FinancialLineage() {
  const [expandedNodes, setExpandedNodes] = useState({
    fund: true,
    project: true,
    tender: true,
    contract: true,
    bills: true,
    bill3: true
  });

  const toggleNode = (key) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { fund, project, tender, contract, bills } = PROJECT_DEMO;

  return (
    <div className="w-full bg-dark-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl p-6 text-slate-100 light:text-slate-900 font-sans shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800 light:border-slate-200">
        <div>
          <span className="text-xs uppercase font-bold text-cyan-400 light:text-cyan-700 tracking-wider">
            END-TO-END AUDIT TRAIL
          </span>
          <h2 className="text-xl font-bold text-slate-100 light:text-slate-900">Financial Lineage Tree</h2>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
            Drill down from top-level government allocation to individual milestone payments & CBDC transaction hashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandedNodes({ fund: true, project: true, tender: true, contract: true, bills: true, bill3: true })}
            className="px-3 py-1.5 rounded-lg bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-xs text-slate-300 light:text-slate-800 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedNodes({})}
            className="px-3 py-1.5 rounded-lg bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-xs text-slate-300 light:text-slate-800 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Lineage Tree Workspace */}
      <div className="space-y-3 text-xs">
        
        {/* LEVEL 1: Fund Allocation */}
        <div className="bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl overflow-hidden shadow-sm">
          <div
            onClick={() => toggleNode('fund')}
            className="p-3.5 bg-slate-900/90 light:bg-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-900 light:hover:bg-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {expandedNodes.fund ? <ChevronDown className="w-4 h-4 text-cyan-400 light:text-cyan-700" /> : <ChevronRight className="w-4 h-4 text-cyan-400 light:text-cyan-700" />}
              <span className="font-bold text-cyan-300 light:text-cyan-800">{fund.id}</span>
              <span className="text-slate-400 light:text-slate-400">|</span>
              <span className="text-slate-200 light:text-slate-900 font-sans font-semibold">{fund.name}</span>
            </div>
            <span className="font-extrabold text-emerald-400 light:text-emerald-700 text-sm">{fund.totalGrant}</span>
          </div>

          {expandedNodes.fund && (
            <div className="p-4 border-t border-slate-800/80 light:border-slate-200 space-y-3 pl-8 text-xs bg-slate-950/40 light:bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-400 light:text-slate-600 font-semibold">
                <div>Sanctioning: <span className="text-slate-200 light:text-slate-900 font-bold">{fund.sanctioningBody}</span></div>
                <div>Date: <span className="text-slate-200 light:text-slate-900 font-bold">{fund.sanctionDate}</span></div>
                <div>Account Head: <span className="text-slate-200 light:text-slate-900 font-bold">{fund.headOfAccount}</span></div>
              </div>

              {/* LEVEL 2: Project */}
              <div className="bg-slate-900/90 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-xl overflow-hidden mt-3 shadow-sm">
                <div
                  onClick={() => toggleNode('project')}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 light:hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {expandedNodes.project ? <ChevronDown className="w-4 h-4 text-blue-400 light:text-blue-700" /> : <ChevronRight className="w-4 h-4 text-blue-400 light:text-blue-700" />}
                    <span className="font-bold text-blue-300 light:text-blue-800">{project.id}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-200 light:text-slate-900 font-sans font-medium">{project.title}</span>
                  </div>
                  <span className="font-bold text-blue-300 light:text-blue-800">{project.estimatedCost}</span>
                </div>

                {expandedNodes.project && (
                  <div className="p-4 border-t border-slate-800/80 light:border-slate-200 space-y-3 pl-6 bg-slate-950/60 light:bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-400 light:text-slate-600 font-medium">
                      <div>Agency: <span className="text-slate-200 light:text-slate-900 font-bold">{project.implementingAgency}</span></div>
                      <div>Approved Value: <span className="text-amber-300 light:text-amber-800 font-bold">{project.currentApprovedCost}</span></div>
                      <div>Disbursed to Date: <span className="text-emerald-400 light:text-emerald-800 font-bold">{project.totalDisbursed}</span></div>
                    </div>

                    {/* LEVEL 3: Tender & Bids */}
                    <div className="bg-slate-950 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl overflow-hidden">
                      <div
                        onClick={() => toggleNode('tender')}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900 light:hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {expandedNodes.tender ? <ChevronDown className="w-4 h-4 text-amber-400 light:text-amber-700" /> : <ChevronRight className="w-4 h-4 text-amber-400 light:text-amber-700" />}
                          <span className="font-bold text-amber-300 light:text-amber-800">{tender.id}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-200 light:text-slate-900 font-sans">E-Tender Evaluation</span>
                        </div>
                        <span className="text-amber-400 light:text-amber-800 text-xs font-bold">3 Bidders Evaluated</span>
                      </div>

                      {expandedNodes.tender && (
                        <div className="p-3 border-t border-slate-800 light:border-slate-200 space-y-2 pl-4 text-xs">
                          {tender.bids.map((b) => (
                            <div key={b.bidCode} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 gap-1 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded font-bold ${b.bidCode === 'P1' ? 'bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800' : 'bg-slate-800 light:bg-slate-100 text-slate-400 light:text-slate-600'}`}>
                                  {b.bidCode}
                                </span>
                                <span className="text-slate-200 light:text-slate-900 font-semibold">{b.bidder}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 light:text-slate-600">Var: <span className="text-rose-400 light:text-rose-700 font-bold">{b.varianceFromEstimate}</span></span>
                                <span className="font-bold text-slate-100 light:text-slate-900">{b.financialBid}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* LEVEL 4: Contract & Variations */}
                    <div className="bg-slate-950 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl overflow-hidden">
                      <div
                        onClick={() => toggleNode('contract')}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900 light:hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {expandedNodes.contract ? <ChevronDown className="w-4 h-4 text-indigo-400 light:text-indigo-700" /> : <ChevronRight className="w-4 h-4 text-indigo-400 light:text-indigo-700" />}
                          <span className="font-bold text-indigo-300 light:text-indigo-800">{contract.id}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-200 light:text-slate-900 font-sans font-medium">{contract.contractor}</span>
                        </div>
                        <span className="text-indigo-300 light:text-indigo-800 font-bold">{contract.currentApprovedTotal}</span>
                      </div>

                      {expandedNodes.contract && (
                        <div className="p-3 border-t border-slate-800 light:border-slate-200 space-y-2 pl-4 text-xs">
                          <div className="text-slate-400 light:text-slate-600">Original Award: <span className="text-slate-200 light:text-slate-900 font-bold">{contract.originalAwardAmount}</span></div>
                          {contract.variations.map((v) => (
                            <div key={v.variationId} className="p-2 rounded bg-indigo-950/30 light:bg-indigo-50 border border-indigo-900/40 light:border-indigo-200 text-indigo-200 light:text-indigo-900 flex justify-between shadow-sm">
                              <span>{v.variationId}: {v.description}</span>
                              <span className="font-bold text-amber-300 light:text-amber-800">{v.amountAdded}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* LEVEL 5: Milestone Bills & CBDC Payment Hashes */}
                    <div className="bg-slate-950 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl overflow-hidden">
                      <div
                        onClick={() => toggleNode('bills')}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900 light:hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {expandedNodes.bills ? <ChevronDown className="w-4 h-4 text-emerald-400 light:text-emerald-700" /> : <ChevronRight className="w-4 h-4 text-emerald-400 light:text-emerald-700" />}
                          <span className="font-bold text-emerald-400 light:text-emerald-800">Milestone Payment Receipts</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-300 light:text-slate-700 font-sans">3 Cleared Bills</span>
                        </div>
                        <span className="text-emerald-400 light:text-emerald-800 font-bold">Total: {PROJECT_DEMO.citizenBreakdown.totalPaid}</span>
                      </div>

                      {expandedNodes.bills && (
                        <div className="p-3 border-t border-slate-800 light:border-slate-200 space-y-2 pl-4 text-xs">
                          {bills.map((bill) => (
                            <div key={bill.billId} className="p-3 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-cyan-300 light:text-cyan-800">{bill.billId}</span>
                                <span className="text-emerald-400 light:text-emerald-700 font-extrabold">{bill.netPaid}</span>
                              </div>
                              <p className="text-slate-300 light:text-slate-800 font-sans text-xs font-semibold">{bill.milestone}</p>
                              
                              <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400 light:text-slate-600">
                                <div>Date: <span className="text-slate-200 light:text-slate-900 font-bold">{bill.paymentDate}</span></div>
                                <div className="flex items-center gap-1 text-cyan-400 light:text-cyan-700 truncate font-bold">
                                  <Cpu className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{bill.cbdcTxHash}</span>
                                </div>
                              </div>

                              {bill.verificationStatus === 'DISCREPANCY_AUDITED' && (
                                <div className="p-2 rounded bg-rose-950/40 light:bg-rose-50 border border-rose-900/60 light:border-rose-200 text-rose-300 light:text-rose-900 text-xs font-sans flex items-center gap-1.5 shadow-sm font-medium">
                                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-400 light:text-rose-600" />
                                  <span>{bill.auditNote}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
