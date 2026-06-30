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

// Proves truth lives in SQLite (§1.5): a setting written in one run survives a
// full app restart. An isolated --user-data-dir keeps the test repeatable.
test('settings persist across an app restart (SQLite)', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-e2e-'));
  const args = [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`];

  const app1 = await electron.launch({ args, env: launchEnv() });
  const w1 = await app1.firstWindow();
  await w1.waitForLoadState('domcontentloaded');
  expect(await w1.evaluate(() => window.api.settings.set('lang', 'twi'))).toMatchObject({
    ok: true,
  });
  await app1.close();

  const app2 = await electron.launch({ args, env: launchEnv() });
  const w2 = await app2.firstWindow();
  await w2.waitForLoadState('domcontentloaded');
  expect(await w2.evaluate(() => window.api.settings.get('lang'))).toMatchObject({
    ok: true,
    data: 'twi',
  });
  await app2.close();

  fs.rmSync(userDataDir, { recursive: true, force: true });
});
