import React, { useState } from 'react';
import { ArrowLeft, Landmark, Play, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ArchitectureCanvas } from './components/ArchitectureCanvas';
import { NodeInspector } from './components/NodeInspector';
import { FollowRupee } from './components/FollowRupee';
import { FinancialLineage } from './components/FinancialLineage';
import { ControlPoints } from './components/ControlPoints';
import { RiskEngine } from './components/RiskEngine';
import { PriceAnomaly } from './components/PriceAnomaly';
import { VendorGraph } from './components/VendorGraph';
import { CitizenView } from './components/CitizenView';
import './styles/financialArchitecture.css';

export default function FinancialArchitecture({ onBackToMap }) {
  const { theme, toggleTheme } = useTheme();
  const [selectedNode, setSelectedNode] = useState(null);
  const [isFollowRupeeOpen, setIsFollowRupeeOpen] = useState(false);

  const scrollToSection = (id) => {
    const container = document.querySelector('.financial-arch-page-container');
    const el = document.getElementById(id);
    if (el && container) {
      const targetPos = el.offsetTop - 80;
      container.scrollTo({ top: targetPos, behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="financial-arch-page-container custom-scrollbar min-h-screen w-full bg-[#0B0E17] light:bg-[#F8FAFC] text-slate-100 light:text-slate-900 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors">
      
      {/* ─── A. INSTITUTIONAL HEADER ─── */}
      <header className="sticky top-0 z-40 bg-[#090C14]/95 light:bg-white/95 backdrop-blur-md border-b border-slate-800/80 light:border-slate-200 px-3 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Main Map & Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {onBackToMap && (
              <button
                onClick={onBackToMap}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-700 hover:text-white light:hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold shadow-sm"
                title="Return to CivicLens Main Map"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Main Map</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
                <Landmark className="w-4.5 h-4.5 text-slate-950" />
              </div>
              <div className="hidden xs:block">
                <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-400 light:from-slate-900 light:to-slate-700 bg-clip-text text-transparent">
                  CivicLens
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Title */}
          <div className="text-center min-w-0 px-1 flex-1 max-w-[320px] sm:max-w-md lg:max-w-lg">
            <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-wide text-slate-100 light:text-slate-900 truncate font-sans">
              Transparent Public Finance Architecture
            </h1>
            <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400 light:text-cyan-700 font-bold truncate hidden sm:block">
              Proposed Sovereign Digital Settlement Rail Framework
            </p>
          </div>

          {/* Right: Section Buttons (xl:flex), Theme Toggle & Follow ₹1 Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <nav className="hidden xl:flex items-center space-x-2 text-xs font-mono font-bold text-slate-300 light:text-slate-700 border-r border-slate-800 light:border-slate-200 pr-2">
              <button
                onClick={() => scrollToSection('architecture-canvas')}
                className="px-2 py-1 rounded hover:text-cyan-400 light:hover:text-cyan-700 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
              >
                Architecture
              </button>
              <button
                onClick={() => scrollToSection('financial-lineage')}
                className="px-2 py-1 rounded hover:text-cyan-400 light:hover:text-cyan-700 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
              >
                Lineage
              </button>
              <button
                onClick={() => scrollToSection('control-points')}
                className="px-2 py-1 rounded hover:text-cyan-400 light:hover:text-cyan-700 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
              >
                Controls
              </button>
              <button
                onClick={() => scrollToSection('risk-engine')}
                className="px-2 py-1 rounded hover:text-cyan-400 light:hover:text-cyan-700 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
              >
                Risk
              </button>
              <button
                onClick={() => scrollToSection('citizen-view')}
                className="px-2 py-1 rounded hover:text-cyan-400 light:hover:text-cyan-700 hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
              >
                Citizen
              </button>
            </nav>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 light:bg-slate-100 text-slate-300 light:text-slate-800 border border-slate-700 light:border-slate-300 hover:border-cyan-400 transition-colors flex items-center gap-1 text-xs font-mono shadow-sm"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Follow 1 Rupee Button */}
            <button
              onClick={() => setIsFollowRupeeOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-mono text-xs font-extrabold shadow-md shadow-cyan-500/20 hover:scale-105 transition-all whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Follow ₹1</span>
            </button>
          </div>

        </div>
      </header>


      {/* ─── B. HERO / PURPOSE ─── */}
      <section className="px-4 py-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 light:bg-cyan-50 border border-cyan-500/30 text-cyan-300 light:text-cyan-800 font-mono text-[10px] font-bold uppercase tracking-widest mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>CONCEPTUAL ARCHITECTURE — INSTITUTIONAL PROPOSAL</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-100 light:text-slate-900 max-w-4xl leading-tight tracking-tight mb-3">
          Transparent Public Finance Architecture
        </h1>

        <p className="text-base sm:text-lg font-medium text-cyan-300 light:text-cyan-700 mb-3">
          "From government allocation to the final rupee spent."
        </p>

        <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-2xl leading-relaxed mb-6">
          A proposed framework connecting funding, procurement, project execution, verification and digital payment records into a single traceable financial lineage using an authorised sovereign digital payment rail (Wholesale CBDC).
        </p>

        {/* Hero CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <button
            onClick={() => scrollToSection('architecture-canvas')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            Explore Architecture
          </button>

          <button
            onClick={() => setIsFollowRupeeOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 light:bg-white hover:bg-slate-800 light:hover:bg-slate-100 border border-slate-800 light:border-slate-300 text-slate-200 light:text-slate-800 font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span>Follow ₹1</span>
          </button>
        </div>

        <button
          onClick={() => scrollToSection('citizen-view')}
          className="text-xs text-slate-500 light:text-slate-600 hover:text-cyan-400 transition-colors font-mono"
        >
          View citizen perspective ↓
        </button>

        {/* Subdued Institutional Context Notice */}
        <div className="mt-6 p-2.5 rounded-xl bg-slate-950/60 light:bg-white border border-slate-800/80 light:border-slate-200 max-w-xl text-[10px] font-mono text-slate-500 light:text-slate-600 leading-normal shadow-sm">
          DISCLAIMER: Conceptual proposal for institutional stakeholders. CivicLens does not issue currency, operate banking services, or access active RBI settlement infrastructure.
        </div>
      </section>


      {/* ─── C, D, E. MAIN INTERACTIVE ARCHITECTURE CANVAS & INSPECTOR ─── */}
      <section id="architecture-canvas" className="w-full flex-1 flex flex-col lg:flex-row min-h-[620px] border-y border-slate-800 light:border-slate-300 relative bg-[#0B0E17] light:bg-slate-50 mb-4 sm:mb-8">
        <div className="flex-1 flex flex-col">
          <ArchitectureCanvas
            selectedNode={selectedNode}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </section>


      {/* ─── G. FINANCIAL CONTROL POINTS ─── */}
      <section id="control-points" className="max-w-7xl mx-auto w-full px-4 pt-10 sm:pt-14 pb-12">
        <ControlPoints />
      </section>


      {/* ─── H, I. FINANCIAL LINEAGE & AUDIT TRAIL ─── */}
      <section id="financial-lineage" className="max-w-7xl mx-auto w-full px-4 py-8">
        <FinancialLineage />
      </section>


      {/* ─── J. MATERIAL PRICE ANOMALY INTELLIGENCE ─── */}
      <section id="price-anomaly" className="max-w-7xl mx-auto w-full px-4 py-8">
        <PriceAnomaly />
      </section>


      {/* ─── K. VENDOR RELATIONSHIP & LINEAGE GRAPH ─── */}
      <section id="vendor-graph" className="max-w-7xl mx-auto w-full px-4 py-8">
        <VendorGraph />
      </section>


      {/* ─── R. RISK ENGINE PIPELINE ─── */}
      <section id="risk-engine" className="max-w-7xl mx-auto w-full px-4 py-8">
        <RiskEngine />
      </section>


      {/* ─── L. CITIZEN TRANSPARENCY VIEW (20%) ─── */}
      <section id="citizen-view" className="max-w-7xl mx-auto w-full px-4 py-12">
        <CitizenView />
      </section>


      {/* ─── M. CLOSING PRINCIPLE / SUMMARY ─── */}
      <footer className="w-full bg-slate-950 light:bg-white border-t border-slate-800/80 light:border-slate-200 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-cyan-950/40 light:bg-cyan-50 border border-cyan-900/60 light:border-cyan-200 text-cyan-300 light:text-cyan-800 font-mono text-xs font-bold uppercase">
            <ShieldCheck className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
            <span>THE CORE TRANSPARENCY PRINCIPLE</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 light:text-slate-900">
            "Every allocation should have a traceable financial and documentary lineage from source of funds to final recipient."
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Don't only audit the amount spent. Preserve the complete financial lineage of how, why, and where the money was spent across government allocation, procurement, project execution, independent verification, and sovereign digital payment settlement.
          </p>

          <div className="pt-6 font-mono text-[11px] text-slate-500 light:text-slate-600 border-t border-slate-900 light:border-slate-200 space-y-2">
            <div>CivicLens Proposed Public Finance Architecture &bull; Conceptual Stakeholder Demonstration Prototype</div>
            <div className="text-xs text-slate-400 light:text-slate-600">
              Made with ❤️ by{' '}
              <a
                href="https://www.linkedin.com/in/dhruvgiri-goswami-745b01159/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 light:text-cyan-600 hover:text-cyan-300 font-bold hover:underline"
              >
                Dhruvgiri Goswami
              </a>
            </div>
          </div>
        </div>
      </footer>


      {/* Interactive "Follow ₹1" Modal */}
      <FollowRupee
        isOpen={isFollowRupeeOpen}
        onClose={() => setIsFollowRupeeOpen(false)}
      />

    </div>
  );
}
