import { useEffect, useRef, useState } from "react";
import "./CivicLensIntro.css";

const INTRO_STORAGE_KEY = "civiclens_intro_seen";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function CivicLensIntro({ onComplete }) {
  const [isEnding, setIsEnding] = useState(false);
  const doneRef = useRef(false);
  const timerRef = useRef(null);

  // One exit path for video end, Skip and reduced motion, so onComplete runs exactly once.
  const finish = (delayMs) => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { localStorage.setItem(INTRO_STORAGE_KEY, "true"); } catch { /* storage blocked */ }
    setIsEnding(true);
    timerRef.current = setTimeout(onComplete, delayMs);
  };

  useEffect(() => {
    // No autoplaying video for people who asked for less motion. Call onComplete directly:
    // a timer here is cleared by StrictMode's effect re-run and the overlay never leaves.
    if (prefersReducedMotion() && !doneRef.current) {
      doneRef.current = true;
      try { localStorage.setItem(INTRO_STORAGE_KEY, "true"); } catch { /* storage blocked */ }
      onComplete();
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`civiclens-intro ${isEnding ? "is-ending" : ""}`}>
      <video
        className="civiclens-intro-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => finish(900)}
      >
        <source
          src="/intro/civiclens-intro-trimmed.mp4"
          type="video/mp4"
        />

        Your browser does not support video playback.
      </video>

      <button
        className="civiclens-intro-skip"
        onClick={() => finish(500)}
      >
        Skip
      </button>

      <div className="civiclens-intro-fog" />
    </div>
  );
}
