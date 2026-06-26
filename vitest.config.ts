import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Unit/integration tests (CLAUDE.md §5.8). Colocated as *.test.ts under src/.
// e2e (Playwright-Electron) lives under tests/e2e and is excluded here.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
