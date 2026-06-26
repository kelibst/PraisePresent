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

// Full scripture domain vertical slice: the bundled WEB dataset hydrates SQLite
// on first launch (offline), reference + keyword search return correct verses
// through the real bridge, the UI renders, and a verse projects to the audience.
test('hydrate WEB offline, search by reference + keyword, and present a verse', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-scripture-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Hydration runs on app start; poll until the dataset is loaded (offline).
  await expect
    .poll(
      async () => {
        const res = await presenter.evaluate(() =>
          window.api.scripture.lookupReference('John 3:16'),
        );
        return res.ok ? res.data.length : 0;
      },
      { timeout: 30_000 },
    )
    .toBe(1);

  // Reference lookup returns the exact verse.
  const john = await presenter.evaluate(() => window.api.scripture.lookupReference('John 3:16'));
  expect(john.ok).toBe(true);
  expect(john.data[0].text).toContain('For God so loved the world');

  // A range lookup returns multiple verses in order.
  const gen = await presenter.evaluate(() => window.api.scripture.lookupReference('Gen 1:1-3'));
  expect(gen.ok && gen.data).toHaveLength(3);
  expect(gen.data[0].verse).toBe(1);
  expect(gen.data[2].verse).toBe(3);

  // Keyword (FTS5) search returns ranked hits with references.
  const kw = await presenter.evaluate(() =>
    window.api.scripture.searchKeyword('love your enemies', 10),
  );
  expect(kw.ok).toBe(true);
  expect(kw.data.length).toBeGreaterThan(0);
  expect(kw.data[0].reference).toMatch(/\d+:\d+$/);

  // Benchmark search over the full 31k corpus (reported for the FTS5-vs-Rust gate).
  const bench = (await presenter.evaluate(async () => {
    const t0 = performance.now();
    await window.api.scripture.searchKeyword('faith hope love', 50);
    const t1 = performance.now();
    await window.api.scripture.lookupReference('Psalm 119');
    const t2 = performance.now();
    return { keywordMs: t1 - t0, referenceMs: t2 - t1 };
  })) as { keywordMs: number; referenceMs: number };
  console.log(
    `[scripture bench] keyword FTS5: ${bench.keywordMs.toFixed(1)}ms | reference (Psalm 119): ${bench.referenceMs.toFixed(1)}ms`,
  );

  // Present the verse; the audience window mirrors it.
  await presenter.evaluate(async () => {
    const res = await window.api.scripture.lookupReference('John 3:16');
    if (res.ok && res.data[0]) {
      await window.api.present.setState({
        mode: 'slide',
        slide: { text: res.data[0].text },
      });
    }
  });
  await expect(audience.getByText(/For God so loved the world/)).toBeVisible();

  // The ScripturePage UI renders and drives a reference search (observed running).
  await presenter.evaluate(() => {
    window.location.hash = '#/scripture';
  });
  await expect(presenter.getByRole('heading', { name: 'Scripture' })).toBeVisible();
  await presenter.getByLabel('Scripture reference').fill('Psalm 23');
  await presenter.getByRole('button', { name: 'Search', exact: true }).click();
  // WEB renders the divine name as "Yahweh" (Psalm 23:1).
  await expect(presenter.getByText(/Yahweh is my shepherd/)).toBeVisible();

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
