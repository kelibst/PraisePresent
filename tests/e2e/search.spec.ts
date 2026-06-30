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

// Global-search aggregator over the real bridge: one query fans across the
// scripture (FTS5), song, and media services and comes back grouped + capped.
// Plumbing only — the ⌘K palette UI lands in Stage B2.
test('search:query fans over scripture/songs/media, grouped and capped', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-search-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Wait for scripture hydration so the scripture group has data.
  await expect
    .poll(
      async () => {
        const r = await presenter.evaluate(() => window.api.scripture.searchKeyword('love', 1));
        return r.ok ? r.data.length : 0;
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);

  // Seed a song + a media item so the other two groups can match a shared term.
  await presenter.evaluate(async () => {
    await window.api.songs.importText({
      title: 'Love Divine All Loves Excelling',
      author: 'Charles Wesley',
      text: 'Verse 1\nLove divine, all loves excelling',
    });
  });

  // A query that all three domains can match on.
  const res = await presenter.evaluate(() => window.api.search.query('love', 5));
  expect(res.ok).toBe(true);
  expect(res.data.scripture.length).toBeGreaterThan(0);
  expect(res.data.scripture.length).toBeLessThanOrEqual(5); // capped
  expect(res.data.songs.map((s) => s.title)).toContain('Love Divine All Loves Excelling');
  expect(Array.isArray(res.data.media)).toBe(true);

  // The per-group cap is honored independently.
  const capped = await presenter.evaluate(() => window.api.search.query('the', 2));
  expect(capped.ok && capped.data.scripture.length).toBeLessThanOrEqual(2);

  // A blank query is rejected at the boundary (min length 1).
  const blank = await presenter.evaluate(() => window.api.search.query('', 5));
  expect(blank.ok).toBe(false);

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});

// Display-safety settings round-trip through the real settings IPC, and the
// audience view honors the safe-area inset. The black-on-disconnect default is
// ON (fail safe — §5.7).
test('display safety: safe-area + black-on-disconnect persist via settings', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-safearea-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Defaults: no safe-area stored yet (null), and the audience renders.
  const initial = await presenter.evaluate(() => window.api.settings.get('display.safeAreaPct'));
  expect(initial.ok && initial.data).toBeNull();

  // Persist a safe-area + black-on-disconnect choice through the settings IPC.
  await presenter.evaluate(async () => {
    await window.api.settings.set('display.safeAreaPct', '8');
    await window.api.settings.set('display.blackOnDisconnect', 'false');
  });
  const saved = await presenter.evaluate(() => window.api.settings.get('display.safeAreaPct'));
  expect(saved.ok && saved.data).toBe('8');
  const bod = await presenter.evaluate(() => window.api.settings.get('display.blackOnDisconnect'));
  expect(bod.ok && bod.data).toBe('false');

  // Project a verse; the audience shows it within the inset content layer. The
  // safe-area is read on mount, so reload the audience to pick up the new value.
  await presenter.evaluate(() =>
    window.api.present.setDeck([{ id: 's1', lines: ['Safe Area Test Line'] }], 0),
  );
  await audience.reload();
  await audience.waitForLoadState('domcontentloaded');
  await expect(audience.getByText('Safe Area Test Line')).toBeVisible();

  // The content layer carries an 8% padding inset (the safe area).
  const padding = await audience.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.will-change-\\[opacity\\]');
    return el ? getComputedStyle(el).paddingTop : '';
  });
  // 8% of the viewport height/width resolves to a non-zero pixel value.
  expect(padding).not.toBe('');
  expect(parseFloat(padding)).toBeGreaterThan(0);

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
