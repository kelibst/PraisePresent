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

// Full songs domain vertical slice: import a song through the bridge -> SQLite,
// list it, then project a section to the audience window.
test('import a song, persist it, and present a section to the audience', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-songs-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  const created = await presenter.evaluate(() =>
    window.api.songs.importText({
      title: 'Amazing Grace',
      author: 'Newton',
      text: '[Verse 1]\nAmazing grace how sweet\n\n[Chorus]\nWas blind but now I see',
    }),
  );
  expect(created).toMatchObject({ ok: true });

  const list = await presenter.evaluate(() => window.api.songs.list());
  expect(list.ok).toBe(true);
  expect(list.data.some((s: { title: string }) => s.title === 'Amazing Grace')).toBe(true);

  // Project the first section; the audience window mirrors it.
  await presenter.evaluate(async () => {
    const got = await window.api.songs.get(1);
    if (got.ok && got.data) {
      await window.api.present.setState({
        mode: 'slide',
        slide: { text: got.data.sections[0].content },
      });
    }
  });
  await expect(audience.getByText('Amazing grace how sweet')).toBeVisible();

  // The SongsPage UI actually renders the library (observed, not just compiled).
  await presenter.evaluate(() => {
    window.location.hash = '#/songs';
  });
  await expect(presenter.getByRole('heading', { name: 'Songs' })).toBeVisible();
  await expect(presenter.getByRole('button', { name: 'Amazing Grace' })).toBeVisible();

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
