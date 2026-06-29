import { defineConfig } from 'vite';
import path from 'node:path';

// https://vitejs.dev/config
// Pin the main-process output to `main.js` so package.json "main"
// (".vite/build/main.js") keeps resolving after the entry moved to
// src/main/index.ts in Phase 0 (T3). Without this, Vite would name the
// chunk after the entry basename ("index.js"). userConfig is merged last
// by @electron-forge/plugin-vite, so this override wins.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      // better-sqlite3 is a native module (.node) — rollup cannot bundle it, so
      // keep it external and require()'d at runtime. Forge's rebuild builds it
      // for Electron's ABI and auto-unpack-natives ships it outside the asar.
      // ffmpeg-static exports a path computed from its own __dirname; bundling would
      // break that resolution, so keep it external too. The binary itself is copied
      // to resources/ via forge extraResource and resolved at runtime (B6c).
      external: ['better-sqlite3', 'ffmpeg-static'],
      output: { entryFileNames: 'main.js' },
    },
  },
});
