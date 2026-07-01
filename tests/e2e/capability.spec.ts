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

// Capability tiering (B6a) through the real bridge: the resolved tier + signals are
// readable, and the operator override persists and round-trips. The audience honors
// the GPU-compositing signal (covered by presentation.spec.ts — it must stay green
// whether the env resolves to a software (cut) or hardware (cross-fade) path).
test('capability: tier + signals readable, override persists and round-trips', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-cap-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });
  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Auto detection returns a valid tier + the raw signals.
  const auto = await presenter.evaluate(() => window.api.capability.get());
  expect(auto.ok).toBe(true);
  if (!auto.ok) throw new Error('capability.get failed');
  expect(['low', 'standard', 'high']).toContain(auto.data.tier);
  expect(auto.data.override).toBe('auto');
  expect(auto.data.tier).toBe(auto.data.autoTier); // auto override → resolved == auto
  expect(typeof auto.data.signals.gpuCompositing).toBe('boolean');
  expect(auto.data.signals.cpuCores).toBeGreaterThan(0);

  // An explicit override wins over detection and persists across reads.
  const forced = await presenter.evaluate(() => window.api.capability.setOverride('low'));
  expect(forced.ok && forced.data.tier).toBe('low');
  const reread = await presenter.evaluate(() => window.api.capability.get());
  expect(reread.ok && reread.data.tier).toBe('low');
  expect(reread.ok && reread.data.override).toBe('low');

  // Back to auto → resolves to detection again.
  const back = await presenter.evaluate(() => window.api.capability.setOverride('auto'));
  expect(back.ok).toBe(true);
  if (!back.ok) throw new Error('setOverride(auto) failed');
  expect(back.data.override).toBe('auto');
  expect(back.data.tier).toBe(back.data.autoTier);

  // A garbage override is rejected at the main boundary (zod), never applied.
  const bad = await presenter.evaluate(() =>
    // @ts-expect-error — deliberately invalid payload to prove main rejects it
    window.api.capability.setOverride('turbo'),
  );
  expect(bad.ok).toBe(false);

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
