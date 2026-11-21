import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, X, Cpu } from 'lucide-react';

const RUPEE_STAGES = [
  {
    step: 1,
    stage: "Government Allocation",
    entity: "Sample Finance Department / Govt Treasury",
    amount: "₹1.00",
    id: "GOV-TRSY-2026-9042",
    timestamp: "12-Jan-2026 10:00 AM IST",
    purpose: "Urban Infrastructure Development Fund Sanction",
    linkedRecord: "Sanction Order SO/2026/URBAN-INFRA/9042",
    cbdcRef: "SAMPLE-HASH-71a98421_whs_cbdc_mint",
    description: "₹1 originates in the Sovereign Treasury as part of a ₹10.00 Cr capital allocation for public urban infrastructure."
  },
  {
    step: 2,
    stage: "Wholesale CBDC Minting",
    entity: "Reserve Bank Payment Infrastructure (Simulated Rail)",
    amount: "₹1.00",
    id: "CBDC-WHS-BLK-984210",
    timestamp: "12-Jan-2026 10:01 AM IST",
    purpose: "Conversion to Programmable Sovereign Digital Tokens (INR-w)",
    linkedRecord: "RBI Settlement Ledger #984210",
    cbdcRef: "SAMPLE-HASH-8849102c_cbdc_mint_hash",
    description: "The allocation is tokenized into programmable wholesale CBDC units with embedded project-binding smart contracts."
  },
  {
    step: 3,
    stage: "Municipal Treasury Credit",
    entity: "Sample Municipal Corporation (SMC)",
    amount: "₹1.00",
    id: "SMC-TRSY-2026-004",
    timestamp: "15-Jan-2026 02:30 PM IST",
    purpose: "Grant Receipt & Ward Budget Assignment",
    linkedRecord: "Council Resolution No. SMC/TC/2026/884",
    cbdcRef: "SAMPLE-HASH-3341092a_tmc_treasury_credit",
    description: "₹1 enters the Municipal Treasury account earmarked specifically for Ward 150 road rehabilitation."
  },
  {
    step: 4,
    stage: "Controlled Project Fund Lock",
    entity: "Programmable Escrow Pool",
    amount: "₹1.00",
    id: "FND-2026-0017",
    timestamp: "18-Jan-2026 11:15 AM IST",
    purpose: "Project-Bound Lock & Multi-Sig Rule Capping",
    linkedRecord: "Escrow Rule ID #ESC-PRJ-0042",
    cbdcRef: "SAMPLE-HASH-98f4a102_escrow_contract_lock",
    description: "₹1 is locked into an automated escrow. It cannot be redirected to administrative expenses or unapproved projects."
  },
  {
    step: 5,
    stage: "Public E-Tender Notice",
    entity: "SMC E-Procurement Portal",
    amount: "₹1.00",
    id: "TND-2026-0142",
    timestamp: "20-Jan-2026 09:00 AM IST",
    purpose: "Competitive Tender Issue (Est. ₹10.00 Cr)",
    linkedRecord: "Tender Spec Doc #TS-2026-0142",
    cbdcRef: "SAMPLE-HASH-1102941b_tender_notice_hash",
    description: "Tender is published. Bidders submit financial and technical packages electronically."
  },
  {
    step: 6,
    stage: "Contract Award & Work Order",
    entity: "Apex Infrastructure Projects Ltd (VND-001)",
    amount: "₹1.00",
    id: "CNT-2026-0088",
    timestamp: "25-Feb-2026 04:45 PM IST",
    purpose: "Lowest Bidder Award (P1 @ ₹6.20 Cr)",
    linkedRecord: "Work Order WO-2026-0042",
    cbdcRef: "SAMPLE-HASH-5509124a_contract_award_hash",
    description: "Contract awarded to P1 bidder. Smart contract links ₹1 disbursement obligation to milestone fulfillment."
  },
  {
    step: 7,
    stage: "Site Work Execution",
    entity: "Ward 150 Construction Site",
    amount: "₹1.00",
    id: "WRK-2026-W150",
    timestamp: "15-Mar-2026 08:00 AM IST",
    purpose: "Physical Construction of 50mm Bituminous Layer",
    linkedRecord: "Site Log & DPR #SL-2026-042",
    cbdcRef: "SAMPLE-HASH-2294102c_site_execution_log",
    description: "Physical work proceeds. Raw materials, equipment, and labor are deployed on-site."
  },
  {
    step: 8,
    stage: "MB Measurement & Audit",
    entity: "Municipal Engineer & 3rd Party Auditor",
    amount: "₹1.00",
    id: "MB-2026-0199",
    timestamp: "10-Aug-2026 05:20 PM IST",
    purpose: "Measurement Book Entry & Core Density Audit",
    linkedRecord: "MB Page #142 / VJTI Audit Certificate",
    cbdcRef: "SAMPLE-HASH-770a8291_mb_audit_verification",
    description: "Work is measured. Independent core-drill testing verifies 52mm asphalt thickness."
  },
  {
    step: 9,
    stage: "Bill Clearance & Tax Deduction",
    entity: "SMC Accounts & Finance Dept",
    amount: "₹1.00",
    id: "BILL-2026-0442",
    timestamp: "14-Aug-2026 01:10 PM IST",
    purpose: "Invoice Validation & Statutory Tax Withholding",
    linkedRecord: "Invoice APEX/SMC/2026/INV-09",
    cbdcRef: "SAMPLE-HASH-88102941_bill_clearance_hash",
    description: "Bill approved. Net disbursement authorized after TDS and GST compliance checks."
  },
  {
    step: 10,
    stage: "Digital CBDC Settlement",
    entity: "Authorised Sovereign Payment Rail",
    amount: "₹1.00",
    id: "CBDC-TX-770A8291",
    timestamp: "15-Aug-2026 11:30 AM IST",
    purpose: "Instant Gross Digital Settlement",
    linkedRecord: "Bank Clearance Ref #CLR-2026-8801",
    cbdcRef: "SAMPLE-HASH-770a8291c944_cbdc_tx_90442",
    description: "Automated CBDC transfer clears instantaneously with immutable cryptographic settlement proof."
  },
  {
    step: 11,
    stage: "Final Recipient Disbursement",
    entity: "Vendor / Raw Material Supplier / Construction Worker",
    amount: "₹1.00",
    id: "RCP-2026-FINAL",
    timestamp: "15-Aug-2026 11:30 AM IST",
    purpose: "Split Credit: Vendor (₹0.54) | Material (₹0.25) | Wage (₹0.12) | Fleet (₹0.09)",
    linkedRecord: "Beneficiary CBDC Wallets",
    cbdcRef: "SAMPLE-HASH-99042811_final_recipient_credit",
    description: "₹1 reaches final recipient. Complete financial lineage from Sample Finance Department to local worker account is preserved."
  }
];

export function FollowRupee({ isOpen, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentStage = RUPEE_STAGES[currentStepIndex];

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= RUPEE_STAGES.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-dark-900 light:bg-white border border-crimson-500/50 light:border-slate-300 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100 light:text-slate-900 transition-colors">
        
        {/* Header */}
        <div className="p-4 bg-slate-950/90 light:bg-slate-50 border-b border-slate-800 light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-600 text-white font-extrabold flex items-center justify-center text-lg shadow-lg">
              ₹1
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-crimson-400 light:text-crimson-700 tracking-wider">
                INTERACTIVE DEMONSTRATION
              </div>
              <h2 className="text-base font-bold text-slate-100 light:text-slate-900">
                Follow the Rupee — Complete Financial Lineage
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 light:bg-slate-200 hover:bg-slate-800 light:hover:bg-slate-300 text-slate-400 light:text-slate-700 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Progress Bar */}
        <div className="px-6 py-3 bg-slate-900/60 light:bg-slate-100 border-b border-slate-800/80 light:border-slate-200 overflow-x-auto custom-scrollbar flex items-center gap-2">
          {RUPEE_STAGES.map((s, idx) => (
            <React.Fragment key={s.step}>
              <button
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  idx === currentStepIndex
                    ? "bg-crimson-600 text-white ring-2 ring-crimson-300 shadow-md scale-105"
                    : idx < currentStepIndex
                    ? "bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 border border-emerald-500/40 light:border-emerald-300"
                    : "bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 text-slate-500 light:text-slate-600 hover:text-slate-300"
                }`}
              >
                <span>{s.step}.</span>
                <span className="truncate max-w-[100px]">{s.stage}</span>
              </button>

              {idx < RUPEE_STAGES.length - 1 && (
                <div className="w-3 h-px bg-slate-800 light:bg-slate-300 flex-shrink-0"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Stage Card Visual */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          <div className="bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-crimson-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800 light:border-slate-200">
              <div>
                <span className="text-xs font-bold uppercase text-crimson-400 light:text-crimson-700">
                  STAGE {currentStage.step} OF 11
                </span>
                <h3 className="text-xl font-bold text-slate-100 light:text-slate-900">{currentStage.stage}</h3>
                <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">{currentStage.entity}</p>
              </div>

              <div className="bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 px-4 py-2 rounded-xl text-right shadow-sm">
                <span className="text-xs text-slate-500 light:text-slate-600 uppercase block">Monetary Value</span>
                <span className="text-lg font-extrabold text-emerald-400 light:text-emerald-700">{currentStage.amount}</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 light:text-slate-700 leading-relaxed mb-6">
              {currentStage.description}
            </p>

            {/* Grid of metadata attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 light:bg-white p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 light:text-slate-600 uppercase block mb-0.5">Stage ID</span>
                <span className="text-crimson-300 light:text-crimson-700 font-bold">{currentStage.id}</span>
              </div>

              <div className="bg-slate-900/80 light:bg-white p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 light:text-slate-600 uppercase block mb-0.5">Timestamp</span>
                <span className="text-slate-200 light:text-slate-800 font-bold">{currentStage.timestamp}</span>
              </div>

              <div className="bg-slate-900/80 light:bg-white p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 light:text-slate-600 uppercase block mb-0.5">Purpose</span>
                <span className="text-slate-200 light:text-slate-800">{currentStage.purpose}</span>
              </div>

              <div className="bg-slate-900/80 light:bg-white p-3 rounded-xl border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 light:text-slate-600 uppercase block mb-0.5">Linked Document</span>
                <span className="text-indigo-300 light:text-indigo-700 font-bold">{currentStage.linkedRecord}</span>
              </div>
            </div>

            {/* CBDC Reference Bar */}
            <div className="mt-4 p-3 rounded-xl bg-crimson-900/30 light:bg-crimson-50 border border-crimson-900/40 light:border-crimson-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-crimson-400 light:text-crimson-700">
                <Cpu className="w-4 h-4" />
                <span className="font-bold uppercase text-xs">CBDC Settlement Proof</span>
              </div>
              <span className="text-slate-300 light:text-slate-800 truncate max-w-xs font-bold">{currentStage.cbdcRef}</span>
            </div>
          </div>
        </div>

        {/* Playback Controls Footer */}
        <div className="p-4 bg-slate-950/90 light:bg-slate-50 border-t border-slate-800 light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isPlaying
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-crimson-600 text-white hover:bg-crimson-500 shadow-lg"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Pause Flow" : "Auto-Play Rupee"}</span>
            </button>

            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className="p-2 rounded-xl bg-slate-900 light:bg-white hover:bg-slate-800 border border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-700 transition-colors shadow-sm"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => {
                setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
                setIsPlaying(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-800 disabled:opacity-40 flex items-center gap-1 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <span className="text-slate-400 light:text-slate-600 px-2 font-bold">
              {currentStepIndex + 1} / {RUPEE_STAGES.length}
            </span>

            <button
              disabled={currentStepIndex === RUPEE_STAGES.length - 1}
              onClick={() => {
                setCurrentStepIndex((prev) => Math.min(prev + 1, RUPEE_STAGES.length - 1));
                setIsPlaying(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-crimson-500/20 light:bg-crimson-100 border border-crimson-500/40 light:border-crimson-300 text-crimson-300 light:text-crimson-800 disabled:opacity-40 flex items-center gap-1 font-bold shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
