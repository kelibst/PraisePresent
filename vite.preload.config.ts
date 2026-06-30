import { defineConfig } from 'vite';
import path from 'node:path';

// https://vitejs.dev/config
// Pin the preload output to `preload.js` so main's
// `path.join(__dirname, 'preload.js')` keeps resolving after the entry
// moved to src/preload/index.ts in Phase 0 (T3). Without this, Vite would
// name the chunk after the entry basename ("index.js"). userConfig is
// merged last by @electron-forge/plugin-vite, so this override wins.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: { entryFileNames: 'preload.js' },
    },
  },
});
