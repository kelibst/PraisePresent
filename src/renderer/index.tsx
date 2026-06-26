import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import AppRouter from './app/router';
import { store } from './store';
import { ThemeProvider } from './lib/theme';
import './styles/globals.css';

// Apply the persisted theme synchronously, before React renders, to avoid a
// flash of the wrong theme. ThemeProvider then manages it reactively. This
// lives in the bundle (not an inline <script> in index.html) so the production
// CSP can stay `script-src 'self'`.
(() => {
  const saved = localStorage.getItem('theme') ?? 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved === 'dark' || (saved === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
})();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
