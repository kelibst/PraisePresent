import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';

// Smoke test (CLAUDE.md §5.8): the app launches, the main window appears, and
// the root renders. Runs against the built main entry (.vite/build/main.js), so
// `bun run package` (or the vite build) must run first.
test('app launches and renders the root window', async () => {
  // Some IDE/dev shells export ELECTRON_RUN_AS_NODE=1, which makes Electron run
  // as plain Node (require('electron') returns a path string, not the API) and
  // the app crashes on startup. Strip it for the launch; it's absent in clean
  // CI so this is a no-op there.
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;

  const app = await electron.launch({
    // Path first, then chromium flags (Electron rejects flags before the app
    // path). --no-sandbox keeps the dev electron launchable under headless CI.
    args: [path.join(__dirname, '..', '..', '.vite', 'build', 'main.js'), '--no-sandbox'],
    env,
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  await expect(window.locator('#root')).toBeVisible();

  await app.close();
});
