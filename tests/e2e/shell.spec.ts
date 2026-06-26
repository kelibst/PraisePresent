import { test, expect, _electron as electron, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');

function launchEnv() {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;
  return env;
}

// Drive the presenter window to a hash route and wait for the SPA to settle.
async function goto(page: Page, hash: string) {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
}

// Shell/navigation coherence (CAMS 2026-06-26_p3-shell-coherence): every sidebar
// route renders meaningful content (no blank pages), Home has no template fake
// data, and a bad service id shows "not found" rather than hanging on "Loading…".
test('shell routes render and bad service ids fail gracefully', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-shell-'));
  const args = [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`];

  const app = await electron.launch({ args, env: launchEnv() });
  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Every sidebar destination renders known, non-blank content.
  const routes: Array<{ hash: string; expect: RegExp }> = [
    { hash: '#/', expect: /PraisePresent/ },
    { hash: '#/scripture', expect: /Scripture/ },
    { hash: '#/songs', expect: /Songs/ },
    { hash: '#/media', expect: /Media library/ },
    { hash: '#/present', expect: /./ },
    { hash: '#/services', expect: /Services/ },
    { hash: '#/settings', expect: /Settings/ },
  ];
  for (const r of routes) {
    await goto(presenter, r.hash);
    await expect(presenter.locator('body')).toContainText(r.expect);
  }

  // Home shows real data only — no leftover template fixtures.
  await goto(presenter, '#/');
  await expect(presenter.getByRole('heading', { name: 'PraisePresent' })).toBeVisible();
  await expect(presenter.locator('body')).not.toContainText('Pastor John');
  await expect(presenter.locator('body')).not.toContainText('Sunday Worship');

  // A non-existent service id must show "not found" + a back link, never hang.
  await goto(presenter, '#/services/999999');
  await expect(presenter.getByText('Service not found.')).toBeVisible();
  await expect(presenter.getByRole('link', { name: /Back to services/ })).toBeVisible();
  await expect(presenter.locator('body')).not.toContainText('Loading…');

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
