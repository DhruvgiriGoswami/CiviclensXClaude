import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, Landmark, Play } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
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
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [isFollowRupeeOpen, setIsFollowRupeeOpen] = useState(false);
  const heroRef = useRef(null);

  // Hero lines rise in one after another. Reduced motion shows them as they are.
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.hero-reveal', { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 });
    }, heroRef);
    return () => mm.revert();
  }, []);

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
    <div className="financial-arch-page-container custom-scrollbar min-h-screen w-full bg-dark-900 light:bg-[#F8FAFC] text-slate-100 light:text-slate-900 font-sans flex flex-col selection:bg-crimson-500 selection:text-white">
      
      {/* ─── A. HEADER ─── */}
      <header className="sticky top-0 z-40 bg-dark-800/85 light:bg-white/85 backdrop-blur-xl border-b border-white/[0.06] light:border-slate-200/80">
        <p role="note" className="bg-amber-100 text-amber-950 text-xs font-medium text-center px-3 py-1.5">
          Illustrative data, not real records. Every body, person, number and ID on this page is made up.
        </p>

        <div className="max-w-7xl mx-auto w-full h-16 px-3 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onBackToMap && (
              <button onClick={onBackToMap} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[13px] font-medium text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-900/[0.05] active:scale-[0.97] transition-[background-color,color,transform] duration-150 pl-2.5" title="Return to CivicLens Main Map">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Main map</span>
              </button>
            )}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[10px] bg-crimson-600 flex items-center justify-center flex-shrink-0">
                <Landmark className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-slate-100 light:text-slate-900 truncate">
                CivicLens <span className="font-normal text-slate-400 light:text-slate-500">Finance</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <nav aria-label="Sections" className="hidden xl:flex items-center gap-0.5 mr-1">
              <button onClick={() => scrollToSection('architecture-canvas')} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[13px] font-medium text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-900/[0.05] active:scale-[0.97] transition-[background-color,color,transform] duration-150">Architecture</button>
              <button onClick={() => scrollToSection('financial-lineage')} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[13px] font-medium text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-900/[0.05] active:scale-[0.97] transition-[background-color,color,transform] duration-150">Lineage</button>
              <button onClick={() => scrollToSection('control-points')} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[13px] font-medium text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-900/[0.05] active:scale-[0.97] transition-[background-color,color,transform] duration-150">Controls</button>
              <button onClick={() => scrollToSection('risk-engine')} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[13px] font-medium text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-900/[0.05] active:scale-[0.97] transition-[background-color,color,transform] duration-150">Risk</button>
              <button onClick={() => scrollToSection('citizen-view')} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-[13px] font-medium text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-slate-900/[0.05] active:scale-[0.97] transition-[background-color,color,transform] duration-150">Citizen</button>
            </nav>
            <ThemeToggle />
            <button
              onClick={() => setIsFollowRupeeOpen(true)}
              className="group ml-1 inline-flex items-center gap-1.5 h-10 pl-3.5 pr-4 rounded-full bg-crimson-600 hover:bg-crimson-700 text-white text-[13px] font-semibold shadow-sm active:scale-[0.97] transition-[background-color,transform] duration-150 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-white transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
              <span>Follow ₹1</span>
            </button>
          </div>
        </div>
      </header>


      {/* ─── B. HERO ─── */}
      <section ref={heroRef} className="relative w-full flex-shrink-0 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(ellipse_at_center,rgba(184,71,95,0.22),transparent_65%)] light:bg-[radial-gradient(ellipse_at_center,rgba(140,36,69,0.10),transparent_65%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-20 md:pt-28 md:pb-28 flex flex-col items-center text-center">
          <p className="hero-reveal text-sm font-medium text-crimson-300 light:text-crimson-700 mb-5">
            Transparent Public Finance Architecture
          </p>
          <h1 className="hero-reveal max-w-5xl text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-100 light:text-slate-900 mb-6">
            From government allocation to the final rupee spent.
          </h1>
          <p className="hero-reveal max-w-2xl text-base sm:text-lg leading-relaxed text-slate-400 light:text-slate-600 mb-9">
            A proposal for tracing public money, shown with sample data. It connects funding, procurement, project execution, verification and digital payment records into a single traceable financial lineage using an authorised sovereign digital payment rail (Wholesale CBDC).
          </p>
          <div className="hero-reveal flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => scrollToSection('architecture-canvas')}
              className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-crimson-600 hover:bg-crimson-700 text-white text-sm font-semibold shadow-sm active:scale-[0.97] transition-[background-color,transform] duration-150"
            >
              Explore the architecture
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setIsFollowRupeeOpen(true)}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-white/15 light:border-slate-300 text-slate-100 light:text-slate-900 hover:bg-white/[0.06] light:hover:bg-slate-900/[0.04] text-sm font-semibold active:scale-[0.97] transition-[background-color,transform] duration-150"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              Follow ₹1
            </button>
          </div>
          <button
            onClick={() => scrollToSection('citizen-view')}
            className="hero-reveal mt-6 text-sm text-slate-400 light:text-slate-500 hover:text-slate-100 light:hover:text-slate-900 transition-colors"
          >
            View citizen perspective ↓
          </button>
          <p className="hero-reveal mt-10 max-w-xl text-xs leading-relaxed text-slate-500">
            Conceptual proposal for institutional stakeholders. CivicLens does not issue currency, operate banking services, or access active RBI settlement infrastructure.
          </p>
        </div>
      </section>


      {/* ─── C, D, E. MAIN INTERACTIVE ARCHITECTURE CANVAS & INSPECTOR ─── */}
      <section id="architecture-canvas" className="w-full flex-1 flex flex-col lg:flex-row min-h-[820px] border-y border-white/[0.06] light:border-slate-200 relative bg-dark-900 light:bg-slate-50 mb-4 sm:mb-8">
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


      {/* ─── M. CLOSING PRINCIPLE ─── */}
      <footer className="w-full border-t border-white/[0.06] light:border-slate-200 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-tight text-slate-100 light:text-slate-900 mb-5">
            Every allocation should have a traceable financial and documentary lineage from source of funds to final recipient.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 light:text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Don't only audit the amount spent. Preserve the complete financial lineage of how, why, and where the money was spent across government allocation, procurement, project execution, independent verification, and sovereign digital payment settlement.
          </p>
          <p className="mt-12 pt-6 border-t border-white/[0.06] light:border-slate-200 text-xs text-slate-500">
            CivicLens Proposed Public Finance Architecture &bull; Conceptual Stakeholder Demonstration Prototype
          </p>
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
