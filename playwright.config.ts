import { defineConfig } from '@playwright/test';

// Electron end-to-end tests (CLAUDE.md §5.8). These launch the built app
// (.vite/build/main.js), so run `bun run package` (or the vite build) first.
// On headless CI, wrap the runner with xvfb (Linux).
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
});
