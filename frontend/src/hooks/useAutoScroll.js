import { useEffect, useRef, useState } from 'react';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

// True when the OS asks for less motion. Follows the setting live.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(REDUCE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(REDUCE_QUERY);
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Drifts a scroll container downward at `speed` px/s while not paused, ticker style.
 * Calls `onNearEnd` whenever less than `nearEndPx` of scroll room is left (also when the content
 * doesn't overflow yet), paused or not, so manual scrolling loads more too. No drift under reduced motion.
 */
export function useAutoScroll(ref, { paused, speed = 25, onNearEnd, nearEndPx = 400 }) {
  const reduced = usePrefersReducedMotion();
  const onNearEndRef = useRef(onNearEnd);
  useEffect(() => {
    onNearEndRef.current = onNearEnd;
  }, [onNearEnd]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    let last = null;
    let carry = 0; // sub-pixel distance owed, so slow speeds still move on high refresh screens
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = last === null ? 0 : Math.min(now - last, 100) / 1000; // clamp: a background tab must not jump
      last = now;
      if (el.scrollHeight - el.clientHeight - el.scrollTop < nearEndPx) onNearEndRef.current?.();
      if (paused || reduced) return;
      carry += speed * dt;
      const step = Math.floor(carry);
      if (step > 0) {
        el.scrollTop += step;
        carry -= step;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, paused, reduced, speed, nearEndPx]);

  return { reduced };
}
