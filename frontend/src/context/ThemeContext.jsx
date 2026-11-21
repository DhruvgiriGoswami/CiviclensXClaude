import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext();

function applyThemeClass(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme !== 'light');
  root.classList.toggle('light', theme === 'light');
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('civiclens_theme_v2');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light'; // Default to light mode on all 3 pages
  });
  const [fontScale, setFontScale] = useState(100); // 100%, 110%, 125%
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem('civiclens_theme_v2', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    // Dynamically adjust root font size scale
    const root = document.documentElement;
    root.style.fontSize = `${(fontScale / 100) * 16}px`;
  }, [fontScale]);

  // One snapshot swap with a circular reveal from the button, instead of hundreds of
  // elements running their own colour transitions at once.
  const toggleTheme = (e) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const swap = () => {
      root.classList.add('theme-switching');
      flushSync(() => setTheme(next));
      applyThemeClass(next);
    };
    const done = () => requestAnimationFrame(() => root.classList.remove('theme-switching'));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) { swap(); done(); return; }

    const r = e?.currentTarget?.getBoundingClientRect?.();
    const x = r ? r.left + r.width / 2 : window.innerWidth - 32;
    const y = r ? r.top + r.height / 2 : 32;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = document.startViewTransition(swap);
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 450, easing: 'cubic-bezier(0.2, 0, 0, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
    vt.finished.finally(done);
  };

  const increaseFontSize = () => {
    setFontScale(prev => Math.min(prev + 10, 140));
  };

  const decreaseFontSize = () => {
    setFontScale(prev => Math.max(prev - 10, 90));
  };

  const resetFontSize = () => {
    setFontScale(100);
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      fontScale,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
      highContrast,
      toggleHighContrast
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

