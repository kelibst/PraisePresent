import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Build-time app version for the renderer status strip. This is a public
  // version string (not a secret), so a compile-time constant keeps the
  // StatusStrip renderer-only (CLAUDE.md §1.3) with no new IPC channel.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  css: {
    postcss: './postcss.config.js',
  },
});
