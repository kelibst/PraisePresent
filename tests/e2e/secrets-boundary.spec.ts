import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';

// Secrets live and die in main (CLAUDE.md §1.7): there must be NO way to reach
// them from the renderer. The bridge exposes only settings + present.
test('secrets are not reachable from the renderer', async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;

  const app = await electron.launch({
    args: [path.join(__dirname, '..', '..', '.vite', 'build', 'main.js'), '--no-sandbox'],
    env,
  });
  const w = await app.firstWindow();
  await w.waitForLoadState('domcontentloaded');

  const apiKeys = await w.evaluate(() => Object.keys(window.api).sort());
  // The bridge exposes domain surfaces (settings/present/songs/…) but NEVER secrets.
  expect(apiKeys).not.toContain('secrets');
  expect(apiKeys).toEqual(expect.arrayContaining(['present', 'settings']));
  expect(await w.evaluate(() => 'secrets' in window.api)).toBe(false);

  await app.close();
});
