import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// The fixed theme the live projector is pinned to: the approved dark "stage" look.
const PRESENTATION_THEME: Theme = 'dark';

// True when THIS renderer instance is the audience/projector window (the
// `#/audience` hash route). The projector must look identical regardless of the
// operator's light/dark choice (CLAUDE.md §5.7), so it is pinned to the fixed
// presentation theme and never reads, writes, or reacts to the operator's saved
// theme. (The slide surface itself is already theme-independent via the
// `--pp-stage-*` tokens; this guarantees nothing else on the projector can leak.)
export function isAudienceWindow(): boolean {
  return typeof window !== 'undefined' && window.location.hash.startsWith('#/audience');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const audience = isAudienceWindow();
  const [theme, setTheme] = useState<Theme>(() => {
    if (audience) return PRESENTATION_THEME;
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      return 'system';
    }
    return 'system';
  });

  // Function to apply theme
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    }
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    // The projector is pinned to the presentation theme and never persisted — the
    // operator's UI theme must never reach the audience output (§5.7).
    if (audience) {
      applyTheme(PRESENTATION_THEME);
      return;
    }
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme, audience]);

  // Listen for system theme changes
  useEffect(() => {
    if (audience) return; // the projector ignores system theme changes too.
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, audience]);

  // The projector has no theme UI and must stay pinned, so it exposes a no-op
  // setter; only operator windows get the real one.
  const value: ThemeContextType = audience
    ? { theme: PRESENTATION_THEME, setTheme: () => {} }
    : { theme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
