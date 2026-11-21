import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Locate, Loader2 } from 'lucide-react';

export function MapControls({
  onZoomIn,
  onZoomOut,
  onResetMap,
  onLocateUser,
  isLocating = false,
  userLocation = null,
  isIntroActive = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInitialBadge, setShowInitialBadge] = useState(false);
  const hasTriggeredInitialBadge = useRef(false);

  useEffect(() => {
    // Show badge for 5 seconds when intro ends (or on mount if intro isn't active), but only once and only if user has not already located
    if (!isIntroActive && !hasTriggeredInitialBadge.current && !userLocation) {
      hasTriggeredInitialBadge.current = true;
      setShowInitialBadge(true);
      const timer = setTimeout(() => {
        setShowInitialBadge(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isIntroActive, userLocation]);

  // When user is located, immediately dismiss the badge
  useEffect(() => {
    if (userLocation) {
      setShowInitialBadge(false);
      setIsHovered(false);
    }
  }, [userLocation]);

  const handleLocateClick = () => {
    setShowInitialBadge(false);
    setIsHovered(false);
    if (onLocateUser) onLocateUser();
  };

  // Badge only shows if user has not yet pinpointed their location
  const shouldShowBadge = (showInitialBadge || isHovered) && !userLocation;

  return (
    <>
      {/* Zoom In, Zoom Out, Reset Controls: Bottom-36 Right on Mobile (<1024px), Top Left on Desktop (>=1024px) */}
      <div className="absolute bottom-36 right-3 z-20 flex flex-col space-y-2">
        <div className="p-1.5 rounded-lg border border-slate-700 light:border-slate-300 flex flex-col space-y-1 shadow-2xl bg-slate-900/90 light:bg-white/95">
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="w-11 h-11 rounded-lg bg-slate-800 light:bg-slate-100 hover:bg-crimson-600/30 light:hover:bg-crimson-50 text-slate-300 light:text-slate-800 flex items-center justify-center transition-all border border-slate-700 light:border-slate-300 hover:border-crimson-500 light:hover:border-crimson-500"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="w-11 h-11 rounded-lg bg-slate-800 light:bg-slate-100 hover:bg-crimson-600/30 light:hover:bg-crimson-50 text-slate-300 light:text-slate-800 flex items-center justify-center transition-all border border-slate-700 light:border-slate-300 hover:border-crimson-500 light:hover:border-crimson-500"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetMap}
            title="Reset to Pan-India View"
            className="w-11 h-11 rounded-lg bg-slate-800 light:bg-slate-100 hover:bg-crimson-600/30 light:hover:bg-crimson-50 text-slate-300 light:text-slate-800 flex items-center justify-center transition-all border border-slate-700 light:border-slate-300 hover:border-crimson-500 light:hover:border-crimson-500"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Left Control: My Location Button + Horizontal Jumping Text Box */}
      <div id="my-location-step" className="absolute bottom-32 lg:bottom-6 left-3 sm:left-4 z-20 flex items-center">
        <div
          className="relative flex items-center"
          onMouseEnter={() => {
            if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
              setIsHovered(true);
            }
          }}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            onClick={handleLocateClick}
            disabled={isLocating}
            title="My Location"
            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all border shadow-2xl ${
              userLocation
                ? 'bg-emerald-600/40 light:bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border-emerald-500 light:border-emerald-500 hover:bg-emerald-600/60 light:hover:bg-emerald-500/30'
                : 'bg-slate-900/90 light:bg-white/95 text-slate-300 light:text-slate-800 border-slate-700 light:border-slate-300 hover:bg-crimson-600/30 light:hover:bg-crimson-50 hover:border-crimson-500 light:hover:border-crimson-500'
            }`}
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-400 light:text-red-600" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </button>

          {/* Horizontal jumping effect text box (same thickness h-8 as small button) */}
          {shouldShowBadge && (
            <div
              onClick={handleLocateClick}
              className="ml-2 h-11 px-3 rounded-lg bg-crimson-600 text-white text-xs font-semibold flex items-center justify-center shadow-xl border border-crimson-400/40 cursor-pointer whitespace-nowrap transition-all duration-300"
            >
              <span className="flex items-center gap-1.5">
                Show my location
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


