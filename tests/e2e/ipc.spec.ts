import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';

// Verifies the typed IPC contract end-to-end through the real preload bridge:
// renderer window.api -> ipcRenderer -> main zod-validated handler -> Result.
test('settings IPC round-trips and rejects invalid payloads', async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;

  const app = await electron.launch({
    args: [path.join(__dirname, '..', '..', '.vite', 'build', 'main.js'), '--no-sandbox'],
    env,
  });
  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // set -> get round-trip, fully through the bridge.
  const setRes = await window.evaluate(() => window.api.settings.set('theme', 'dark'));
  expect(setRes).toMatchObject({ ok: true });

  const getRes = await window.evaluate(() => window.api.settings.get('theme'));
  expect(getRes).toMatchObject({ ok: true, data: 'dark' });

  // Invalid payload (empty key) is rejected by zod at the main boundary.
  const badRes = await window.evaluate(() => window.api.settings.get(''));
  expect(badRes).toMatchObject({ ok: false });

  await app.close();
});
