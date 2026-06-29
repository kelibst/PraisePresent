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

  // listBooks carries a chapter count for the browser's chapter picker.
  const books = await presenter.evaluate(() => window.api.scripture.listBooks());
  expect(books.ok).toBe(true);
  const psalms = books.data.find((b) => b.name === 'Psalms');
  expect(psalms?.chapterCount).toBe(150);

  // getChapter returns the whole chapter in verse order.
  const jn1 = await presenter.evaluate(() => window.api.scripture.getChapter(43, 1));
  expect(jn1.ok).toBe(true);
  expect(jn1.data[0].verse).toBe(1);
  expect(jn1.data.length).toBeGreaterThan(40);
  expect(jn1.data[0].text).toContain('In the beginning was the Word');

  // Present the verse; the audience window mirrors it.
  await presenter.evaluate(async () => {
    const res = await window.api.scripture.lookupReference('John 3:16');
    if (res.ok && res.data[0]) {
      await window.api.present.setDeck([{ id: 'jn3-16', lines: [res.data[0].text] }], 0);
    }
  });
  await expect(audience.getByText(/For God so loved the world/)).toBeVisible();

  // The unified Present screen renders. Its left Source panel defaults to the
  // Scripture tab, where Reference mode is the default and is NOT blank — its
  // field is prefilled with "John 3:16"; resolving it stages the verse and
  // sending it live mirrors it to the audience.
  await presenter.evaluate(() => {
    window.location.hash = '#/present';
  });
  await expect(presenter.getByText('Scripture').first()).toBeVisible();
  // Resolve the prefilled reference (Enter) → the staged verse appears in Pane 1.
  await presenter.getByLabel('Scripture reference').press('Enter');
  await expect(presenter.getByText(/For God so loved the world/).first()).toBeVisible();
  // Send the staged verse live; the audience window mirrors it. Use `.first()`:
  // the true double-buffer cross-fade (B2) briefly shows BOTH the outgoing and the
  // incoming slide layers, and here both happen to carry the same verse text (it was
  // already projected once above), so two transient copies are expected mid-fade.
  await presenter.getByRole('button', { name: 'Send to Live' }).click();
  await expect(audience.getByText(/For God so loved the world/).first()).toBeVisible();
  // Regression (§5.8): once the cross-fade settles, the outgoing layer must unmount,
  // leaving exactly ONE copy of the text — proving the layer cleanup timer fires and
  // layers never accumulate (the B2 double-buffer is bounded to a single live slide).
  await expect(async () => {
    expect(await audience.getByText(/For God so loved the world/).count()).toBe(1);
  }).toPass({ timeout: 3000 });

  // The live deck renders as a horizontal strip in the cockpit's right pane, with
  // a LIVE badge on the slide currently on the projector (design: deck moved under
  // ON SCREEN NOW, no separate vertical rail).
  const liveDeck = presenter.getByRole('group', { name: 'Live deck slides' });
  await expect(liveDeck).toBeVisible();
  await expect(liveDeck.getByText('Live')).toBeVisible();

  // A multi-slide deck: clicking a deck card jumps the audience to that slide
  // (goto), proving the relocated strip still drives transport.
  await presenter.evaluate(async () => {
    const res = await window.api.scripture.lookupReference('John 3:16-18');
    if (res.ok) {
      await window.api.present.setDeck(
        res.data.map((v, i) => ({ id: `jn-${i}`, lines: [v.text], reference: `John 3:${16 + i}` })),
        0,
      );
    }
  });
  const deckCards = liveDeck.getByRole('button');
  await expect(deckCards).toHaveCount(3);
  await deckCards.nth(2).click();
  await expect(audience.getByText('John 3:18')).toBeVisible();

  // The reference field still drives an arbitrary lookup (Psalm 23).
  await presenter.getByLabel('Scripture reference').fill('Psalm 23');
  await presenter.getByLabel('Scripture reference').press('Enter');
  // WEB renders the divine name as "Yahweh" (Psalm 23:1).
  await expect(presenter.getByText(/Yahweh is my shepherd/).first()).toBeVisible();

  // Keyword mode marks hits via FTS5 search.
  await presenter.getByRole('tab', { name: 'Keyword' }).click();
  await presenter.getByLabel('Keyword search').fill('love your enemies');
  await presenter.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(presenter.getByText(/containing/).first()).toBeVisible();

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
