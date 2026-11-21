import { useId, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useTheme } from '../context/ThemeContext';

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return [12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8, 12 + Math.cos(a) * 10.5, 12 + Math.sin(a) * 10.5];
});

// Sun that turns into a moon: the rays fold away, the disc grows and a masked circle
// slides in to bite it into a crescent. Dark plays the timeline forward, light reverses it.
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  const maskId = `moon-${useId().replace(/:/g, '')}`;
  const svg = useRef(null);
  const tl = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      tl.current = gsap.timeline({ paused: true, defaults: { duration: 0.5, ease: 'power3.inOut' } })
        .to('.rays', { scale: 0.3, autoAlpha: 0, rotation: 45, transformOrigin: '50% 50%' }, 0)
        .to('.disc', { attr: { r: 9 } }, 0)
        .to('.bite', { attr: { cx: 18, cy: 6 } }, 0)
        .to(svg.current, { rotation: -40, transformOrigin: '50% 50%' }, 0)
        .progress(dark ? 1 : 0); // first paint shows the current theme without animating
    }, svg);
    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) t.progress(dark ? 1 : 0).pause();
    else if (dark) t.play(); // no-op when already at the end
    else t.reverse();
  }, [dark]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-900/5 active:scale-[0.94] transition-[background-color,transform] duration-150 ${className}`}
    >
      <svg ref={svg} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <mask id={maskId}>
          <rect width="24" height="24" fill="#fff" />
          <circle className="bite" cx="32" cy="-4" r="8" fill="#000" />
        </mask>
        <circle className="disc" cx="12" cy="12" r="5" fill="currentColor" mask={`url(#${maskId})`} />
        <g className="rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {RAYS.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}
        </g>
      </svg>
    </button>
  );
}
