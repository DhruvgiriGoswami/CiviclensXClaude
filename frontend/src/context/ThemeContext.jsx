import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

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
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      localStorage.setItem('civiclens_theme_v2', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    // Dynamically adjust root font size scale
    const root = document.documentElement;
    root.style.fontSize = `${(fontScale / 100) * 16}px`;
  }, [fontScale]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
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

