import React, { useState, useEffect } from 'react';
import { useDialog } from '../hooks/useDialog';
import {
  Search, MapPin, Layers, ChevronRight, ChevronLeft, Check, Sparkles, X,
  HelpCircle, Mail, ShieldAlert, AlertTriangle, FileText, CheckCircle2,
  ShieldCheck, HeartHandshake, Info, ExternalLink, Flag, ArrowRight
} from 'lucide-react';

export function AppTour({ isOpen, onClose, onExpandPanel, onNavigate }) {
  // Step 0: Welcome & Responsible Use Disclaimer
  // Step 1: Search Leaders, Corporations & Wards
  // Step 2: Search Around Your Location
  // Step 3: Expand Governance Panel
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const handlePortalNavigation = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.location.href = path;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step === 0) {
      setTargetRect(null);
      return;
    }

    const updateTargetPosition = () => {
      let targetEl = null;

      if (step === 1) {
        targetEl = document.getElementById('search-bar-step');
      } else if (step === 2) {
        targetEl = document.getElementById('my-location-step');
      } else if (step === 3) {
        const mobileEl = document.getElementById('governance-panel-step-mobile');
        const desktopEl = document.getElementById('governance-panel-step');
        
        // On mobile or narrow screens, prioritize the mobile bottom handle
        if (window.innerWidth < 1024) {
          targetEl = mobileEl || desktopEl;
        } else {
          targetEl = desktopEl || mobileEl;
        }

        // Validate that chosen element is actually visible and rendered
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            });
            return;
          }
        }

        // Fallback to whichever alternative is visible
        const alternateEl = (targetEl === mobileEl) ? desktopEl : mobileEl;
        if (alternateEl) {
          const altRect = alternateEl.getBoundingClientRect();
          if (altRect.width > 0 && altRect.height > 0) {
            setTargetRect({
              top: altRect.top,
              left: altRect.left,
              width: altRect.width,
              height: altRect.height,
            });
            return;
          }
        }
        setTargetRect(null);
        return;
      }

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        // Ensure element has actual dimensions and is not hidden
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
          return;
        }
      }
      setTargetRect(null);
    };

    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    const timer = setTimeout(updateTargetPosition, 100);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
      clearTimeout(timer);
    };
  }, [isOpen, step]);

  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 3) {
      if (onExpandPanel) onExpandPanel();
      onClose();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(0, prev - 1));
  };

  const stepsData = [
    {
      step: 1,
      title: '1. Search Leaders, Corporations & Wards',
      description: 'Use the global search bar to quickly find any Elected Representative (Corporator / Mayor / MP), Municipal Commissioner (IAS), Corporation (BMC / NMMC / PMC), or Ward.',
      icon: Search,
      badge: 'Global GIS Search',
      highlightColor: 'crimson',
    },
    {
      step: 2,
      title: '2. Search Around Your Location',
      description: 'Click the "My Location" button at the bottom-left of the map to automatically pinpoint your ward, inspect your local boundaries, and view geo-tagged civic tickets near you.',
      icon: MapPin,
      badge: 'GPS & Ward Pinpoint',
      highlightColor: 'emerald',
    },
    {
      step: 3,
      title: '3. Expand Governance Panel',
      description: 'Click "Expand Panel" on the right (or bottom on mobile) to inspect who is responsible for your area, review CBDC CapEx budgets, rate representatives, and raise citizen grievances.',
      icon: Layers,
      badge: 'Accountability Index',
      highlightColor: 'amber',
    },
  ];

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="tour-heading" className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      {/* Fullscreen Spotlight Overlay with SVG Mask Cutout */}
      {targetRect && step > 0 ? (
        <svg
          className="fixed inset-0 w-full h-full z-0 pointer-events-auto cursor-pointer transition-all duration-300"
          onClick={onClose}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="16"
                ry="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div
          className="absolute inset-0 bg-black/80 transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Target Highlight Box Glow overlay for Steps 1-3 */}
      {targetRect && step > 0 && (
        <div
          className="absolute rounded-2xl border-2 border-crimson-500 transition-all duration-300 pointer-events-none z-10"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* STEP 0: WELCOME & DISCLAIMER MODAL */}
      {step === 0 ? (
        <div className="relative z-10 glass-panel-crimson light:bg-white light:border-slate-300 w-full max-w-3xl rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-700/80 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200">
          
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800 light:border-slate-200 flex-shrink-0 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-crimson-500/20 text-crimson-400 light:text-crimson-700 border border-crimson-500/40 flex items-center justify-center font-bold flex-shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div className="min-w-0">
                <span className="text-xs sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 light:text-crimson-700 border border-crimson-500/40 inline-block leading-tight">
                  Civic-Tech Platform Overview & Disclaimer
                </span>
                <h2 id="tour-heading" className="text-lg sm:text-2xl font-black text-white light:text-slate-900 font-sans tracking-tight mt-0.5 truncate">
                  Welcome to CivicLens
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 py-3 sm:py-4 space-y-4 sm:space-y-6 text-slate-200 light:text-slate-800 text-xs leading-relaxed font-sans select-text">
            
            {/* Tagline Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 light:bg-slate-100 border border-slate-800 light:border-slate-200">
              <p className="text-sm font-bold text-crimson-400 light:text-crimson-600 font-sans">
                Making civic issues visible. Encouraging transparency. Supporting accountable governance.
              </p>
              <p className="mt-2 text-slate-300 light:text-slate-700">
                CivicLens is an independent civic-tech initiative designed to help citizens explore public expenditure, understand local civic issues, and raise complaints about problems affecting their communities. It aims to make publicly available information easier to access and help citizens and authorities engage with civic issues more effectively.
              </p>
            </div>

            {/* What can you do */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                What can you do on CivicLens?
              </h3>
              <ul className="space-y-2 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Explore public expenditure:</strong> Understand available information about government spending and civic projects in your area.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Raise civic complaints:</strong> Report issues such as damaged roads, potholes, garbage accumulation, drainage problems, water supply disruptions, streetlight failures, and other public infrastructure concerns.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Make issues visible:</strong> Help bring attention to local problems so they can be better understood, discussed, and potentially addressed by the relevant authorities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Support informed governance:</strong> Make public information more accessible and encourage constructive, evidence-based civic participation.</span>
                </li>
              </ul>
            </div>

            {/* How does CivicLens help authorities */}
            <div className="p-3.5 rounded-2xl bg-slate-900/50 light:bg-slate-50 border border-slate-800 light:border-slate-200 space-y-1.5">
              <h3 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                How does CivicLens help authorities?
              </h3>
              <p className="text-slate-300 light:text-slate-700">
                CivicLens aims to help authorities identify recurring civic concerns, understand issues reported by citizens, and gain better visibility into local problems. Publicly visible complaints can encourage constructive engagement, help highlight areas requiring attention, and support more informed decision-making.
              </p>
              <p className="text-slate-400 light:text-slate-600 text-xs italic">
                CivicLens is intended to complement existing government grievance-redressal systems, not replace them.
              </p>
            </div>

            {/* Important information and limitations */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-amber-400 light:text-amber-700 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                Important information and limitations
              </h3>
              <ul className="space-y-2 pl-1 text-slate-300 light:text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Independent initiative:</strong> CivicLens is an independent civic-tech platform and is not an official government website. Unless explicitly stated, it is not affiliated with, endorsed by, or operated by any government department or public authority.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Map coverage:</strong> The map currently covers only selected geographical areas. Some states, districts, cities, wards, or boundaries may be missing or incomplete because authoritative government boundary data is not consistently available to us in a usable format. Coverage will improve as reliable data becomes available. A missing area does not mean that civic issues do not exist there.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Data accuracy:</strong> Information is compiled from available public sources and platform submissions. Data may be incomplete, outdated, delayed, or subject to verification. Expenditure figures, boundaries, representatives, and other information should not be treated as independently audited or officially certified unless explicitly identified as such.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Complaints are not guaranteed resolutions:</strong> Submitting a complaint on CivicLens does not automatically register it with a government department, guarantee official acknowledgement, or ensure resolution. Where urgent action or formal tracking is required, please use the relevant official grievance portal or authority directly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>No replacement for official records:</strong> CivicLens is intended to improve accessibility and public understanding. Official government records, notifications, and departmental communications remain authoritative.</span>
                </li>
              </ul>
            </div>

            {/* Use CivicLens responsibly */}
            <div className="p-3.5 rounded-2xl bg-rose-500/10 light:bg-rose-50/70 border border-rose-500/30 space-y-2">
              <h3 className="text-sm font-bold text-rose-400 light:text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Use CivicLens responsibly
              </h3>
              <p className="text-slate-300 light:text-slate-700 font-medium">
                Please help keep CivicLens useful, fair, and credible for everyone:
              </p>
              <ul className="space-y-1.5 pl-1 text-slate-300 light:text-slate-700 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Submit genuine complaints concerning public or civic issues.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Provide accurate descriptions, relevant locations, dates, and supporting evidence where available.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Do not submit false, misleading, duplicate, malicious, or deliberately exaggerated complaints.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Do not post personal information, private contact details, identity documents, or sensitive information about yourself or others.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Avoid abusive language, threats, harassment, hate speech, and unsupported allegations against individuals, officials, contractors, or organisations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Distinguish verified facts from personal opinions or suspicions. Do not present allegations of corruption, misconduct, or wrongdoing as established facts without credible evidence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Respect the privacy, dignity, and safety of other citizens and public servants.</span>
                </li>
              </ul>
              <p className="text-xs text-slate-400 light:text-slate-600 italic">
                Content that is unlawful, abusive, misleading, or otherwise inappropriate may be restricted or removed where applicable.
              </p>
            </div>

            {/* Your voice matters */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-crimson-900/30 via-slate-900 to-crimson-900/30 border border-crimson-500/30 space-y-1.5">
              <h4 className="text-xs font-bold text-white light:text-slate-900 font-sans">
                Your voice matters
              </h4>
              <p className="text-slate-300 light:text-slate-700 italic">
                "A pothole, overflowing drain, broken streetlight, or neglected public space may seem like a small problem until it affects an entire community."
              </p>
              <p className="text-slate-300 light:text-slate-700">
                If you notice a genuine civic issue, we encourage you to report it on CivicLens. Clear, factual complaints help make local problems more visible and support a culture of constructive civic participation. Every meaningful report can contribute to a better-informed community. Explore the map, understand the available information, and help make civic issues harder to overlook.
              </p>
              <p className="text-crimson-400 light:text-crimson-600 font-bold text-xs pt-1">
                CivicLens — Your city. Your voice. Your right to be informed.
              </p>
            </div>

            {/* Support Contact Box */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-500/10 light:bg-blue-50 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/20 text-blue-400 light:text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white light:text-slate-900 font-sans">
                    Need Help or Have Questions?
                  </h4>
                  <p className="text-xs text-slate-400 light:text-slate-600">
                    For any issues, feedback, or inquiries regarding the website:
                  </p>
                </div>
              </div>
              <a
                href="mailto:support@myciviclens.in"
                className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
              >
                <span className="truncate">support@myciviclens.in</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>

            {/* Disclaimer Acceptance Note */}
            <p className="text-xs sm:text-xs text-slate-400 light:text-slate-600 text-center pt-1">
              By continuing, you acknowledge that you understand the purpose, limitations, and responsible-use guidelines of CivicLens.
            </p>

          </div>

          {/* Bottom Action Footer */}
          <div className="pt-3.5 sm:pt-4 border-t border-slate-800 light:border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0 gap-2.5 sm:gap-3">
            {/* Primary & Portal Actions Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              {/* 1. FIRST: Explore Interactive Guide */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-500 hover:to-crimson-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Interactive Guide (Step 1)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 2. SECOND: Other Portal Options (kept smaller than primary button) */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handlePortalNavigation('/financial-architecture')}
                  className="px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-cyan-500/10 light:bg-cyan-50 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 light:text-cyan-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  title="Explore CivicLens Public Financial Architecture"
                >
                  <span className="truncate">Financial Arch.</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 light:text-cyan-600 flex-shrink-0" />
                </button>


              </div>
            </div>

            {/* 3. LAST: Close Button */}
            <div className="flex items-center justify-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-800 text-xs font-bold transition-all cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* STEPS 1 TO 3: INTERACTIVE GUIDED TOUR */
        (() => {
          const currentStepData = stepsData[step - 1];
          const StepIcon = currentStepData.icon;

          return (
            <div className="relative z-10 glass-panel-crimson light:bg-white light:border-slate-300 w-full max-w-md rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              
              {/* Top Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 light:text-crimson-700 border border-crimson-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Step {step} of 3</span>
                  </span>
                  <span className="text-xs text-slate-400 light:text-slate-600 font-bold">
                    {currentStepData.badge}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-700 flex items-center justify-center transition-colors"
                  title="Skip Tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step Icon & Title */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-crimson-600 to-crimson-700 text-white flex items-center justify-center flex-shrink-0 shadow-lg border border-crimson-400/40">
                  <StepIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white light:text-slate-900 font-sans leading-snug">
                    {currentStepData.title}
                  </h3>
                  <p className="text-xs text-slate-300 light:text-slate-700 mt-1.5 leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>
              </div>

              {/* Progress Step Indicator Dots */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 light:border-slate-200">
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      aria-hidden="true"
                      onClick={() => setStep(s)}
                      className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                        s === step
                          ? 'w-6 bg-crimson-500'
                          : s < step
                          ? 'w-2 bg-emerald-500'
                          : 'w-2 bg-slate-700 light:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrev}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-300 light:text-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{step === 1 ? 'Disclaimer' : 'Back'}</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-500 hover:to-crimson-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>{step === 3 ? 'Expand & Start' : 'Next Step'}</span>
                    {step === 3 ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>
          );
        })()
      )}
    </div>
  );
}
