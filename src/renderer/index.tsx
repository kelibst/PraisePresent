import React from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './app/router';
import ErrorBoundary from './app/ErrorBoundary';
import { ThemeProvider, isAudienceWindow } from './lib/theme';
import './styles/globals.css';

// Apply the persisted theme synchronously, before React renders, to avoid a
// flash of the wrong theme. ThemeProvider then manages it reactively. This
// lives in the bundle (not an inline <script> in index.html) so the production
// CSP can stay `script-src 'self'`.
(() => {
  // The audience/projector window is pinned to the fixed presentation theme so the
  // operator's light/dark choice never leaks onto the live output (§5.7).
  if (isAudienceWindow()) {
    document.documentElement.classList.add('dark');
    return;
  }
  const saved = localStorage.getItem('theme') ?? 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'dark' || (saved === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
})();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
