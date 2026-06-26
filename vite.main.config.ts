import { defineConfig } from 'vite';

// https://vitejs.dev/config
// Pin the main-process output to `main.js` so package.json "main"
// (".vite/build/main.js") keeps resolving after the entry moved to
// src/main/index.ts in Phase 0 (T3). Without this, Vite would name the
// chunk after the entry basename ("index.js"). userConfig is merged last
// by @electron-forge/plugin-vite, so this override wins.
export default defineConfig({
  build: {
    rollupOptions: {
      output: { entryFileNames: 'main.js' },
    },
  },
});
