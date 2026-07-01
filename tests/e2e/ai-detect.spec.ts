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

// Phase 4 text path: free text -> detected + resolved scripture references
// (offline, no network), reviewed by the operator and projected on click. Spoken
// numbers and digit references both resolve through the Phase 3 scripture domain.
test('detect references in text (digits + spoken), review, and project one', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-ai-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Detection resolves through the bundled Bible — wait for hydration.
  await expect
    .poll(
      async () => {
        const r = await presenter.evaluate(() => window.api.ai.submitText('John 3:16'));
        return r.ok ? r.data.length : 0;
      },
      { timeout: 30_000 },
    )
    .toBe(1);

  // Digit + spoken references both detect and resolve, in order.
  const multi = await presenter.evaluate(() =>
    window.api.ai.submitText('Turn to John three sixteen, then Romans 8:28 this morning.'),
  );
  expect(multi.ok).toBe(true);
  const refs = multi.data.map((c) => c.reference);
  expect(refs).toContain('John 3:16');
  expect(refs).toContain('Romans 8:28');
  const john = multi.data.find((c) => c.reference === 'John 3:16')!;
  expect(john.type).toBe('explicit');
  expect(john.verses[0].text).toContain('For God so loved the world');

  // A non-existent passage is NOT surfaced (resolution precision).
  const bogus = await presenter.evaluate(() => window.api.ai.submitText('see John 99:99'));
  expect(bogus.ok && bogus.data).toHaveLength(0);

  // Plain prose with no references yields nothing.
  const none = await presenter.evaluate(() =>
    window.api.ai.submitText('Good morning everyone, welcome to church.'),
  );
  expect(none.ok && none.data).toHaveLength(0);

  // The Live Detect UI now lives as a tab inside the unified Present screen (M2).
  // Open Present, switch to the Live Detect tab, type text, detect, and send the
  // candidate to the SAME shared deck via the tab's Send-to-Live (no second
  // present subscription).
  await presenter.evaluate(() => {
    window.location.hash = '#/present';
  });
  await presenter.getByRole('tab', { name: 'Live Detect' }).click();
  await presenter.getByLabel(/Paste or type/).fill('please turn to romans eight twenty eight');
  await presenter.getByRole('button', { name: 'Detect references' }).click();
  const sendLive = presenter.getByRole('button', { name: /Send Romans 8:28 live/ });
  await expect(sendLive).toBeVisible();
  await sendLive.click();
  await expect(audience.getByText(/all things work together for good/i)).toBeVisible();

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
