import { useEffect, useRef } from "react";
import gsap from "gsap";
import { INDIA_PATH } from "../map/IndiaMapLoader";
import "./CivicLensIntro.css";

const INTRO_STORAGE_KEY = "civiclens_intro_seen";

// A short reveal: the India outline draws in, the wordmark rises, the overlay fades out.
export default function CivicLensIntro({ onComplete }) {
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  // One exit path for the end of the timeline, Skip and reduced motion, so onComplete runs once.
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    try { localStorage.setItem(INTRO_STORAGE_KEY, "true"); } catch { /* storage blocked */ }
    completeRef.current?.();
  };

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
      (ctx) => {
        if (ctx.conditions.reduce) {
          finish();
          return;
        }
        const path = rootRef.current.querySelector("path");
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: finish })
          .to(path, { strokeDashoffset: 0, duration: 2.2, ease: "power1.inOut" })
          .from(".civiclens-intro-word", { autoAlpha: 0, y: 16, duration: 0.9 }, "-=0.6")
          .to(rootRef.current, { autoAlpha: 0, duration: 0.5 }, "+=0.5");
      },
      rootRef
    );
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="civiclens-intro">
      <svg className="civiclens-intro-map" viewBox="0 0 900 1000" aria-hidden="true" focusable="false">
        <path d={INDIA_PATH} />
      </svg>
      <p className="civiclens-intro-word">CivicLens</p>
      <button type="button" className="civiclens-intro-skip" onClick={finish}>
        Skip
      </button>
    </div>
  );
}
