import { test, expect, _electron as electron } from '@playwright/test';
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

// Display/output settings: monitors enumerate from main, the audience-screen
// choice persists in SQLite (§1.5) and survives a restart, and the Settings →
// Display UI renders + drives the choice. Single-display CI: at least the
// primary is always present.
test('enumerate displays, choose the audience screen, persist across restart', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-display-'));
  const args = [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`];

  const app1 = await electron.launch({ args, env: launchEnv() });
  const w1 = await app1.firstWindow();
  await w1.waitForLoadState('domcontentloaded');

  // Enumeration returns at least the primary display, with a label + resolution.
  const list = await w1.evaluate(() => window.api.display.list());
  expect(list.ok).toBe(true);
  expect(list.data.length).toBeGreaterThan(0);
  const primary = list.data.find((d) => d.isPrimary)!;
  expect(primary).toBeTruthy();
  expect(primary.width).toBeGreaterThan(0);

  // Default selection is auto (null) until the operator chooses.
  const before = await w1.evaluate(() => window.api.display.getAudience());
  expect(before).toMatchObject({ ok: true, data: { displayId: null } });

  // Choosing a display persists it and is read back.
  const set = await w1.evaluate((id) => window.api.display.setAudience(id), primary.id);
  expect(set).toMatchObject({ ok: true, data: { displayId: primary.id } });
  const after = await w1.evaluate(() => window.api.display.getAudience());
  expect(after).toMatchObject({ ok: true, data: { displayId: primary.id } });
  await app1.close();

  // The choice survives a full restart (truth in SQLite).
  const app2 = await electron.launch({ args, env: launchEnv() });
  const w2 = await app2.firstWindow();
  await w2.waitForLoadState('domcontentloaded');
  const persisted = await w2.evaluate(() => window.api.display.getAudience());
  expect(persisted).toMatchObject({ ok: true, data: { displayId: primary.id } });

  // The Settings → Display UI renders and lets the operator switch back to Auto.
  await w2.evaluate(() => {
    window.location.hash = '#/settings';
  });
  await expect(w2.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await w2.getByRole('button', { name: 'Display' }).click();
  await expect(w2.getByRole('heading', { name: 'Audience display' })).toBeVisible();
  await w2.getByRole('radio', { name: /Auto/ }).click();
  await expect(w2.getByRole('status')).toHaveText(/Saved/);
  const reset = await w2.evaluate(() => window.api.display.getAudience());
  expect(reset).toMatchObject({ ok: true, data: { displayId: null } });

  await app2.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
