import { test, expect, _electron as electron, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { Jimp } from 'jimp';

const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');
function launchEnv() {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;
  return env;
}

// Load an app-media:// url in the audience window and report the decoded pixel size.
function servedSize(page: Page, id: number) {
  return page.evaluate(
    (mediaId) =>
      new Promise<{ w: number; h: number; err?: boolean }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0, err: true });
        img.src = `app-media://media/${mediaId}`;
      }),
    id,
  );
}

// B6b: an oversized image imported into the library is pre-scaled to a projector-fit
// rendition, and the app-media:// protocol serves THAT (the projector never decodes
// the 4000px original). A small image is left untouched (served at its original size).
test('media pre-scale: a huge image is downscaled to projector-fit; a small one is untouched', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-prescale-'));
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-fixtures-'));

  // A 4000x3000 source (well above any projector) and a 100x100 source.
  const bigPath = path.join(fixtureDir, 'big.png');
  const smallPath = path.join(fixtureDir, 'small.png');
  await new Jimp({ width: 4000, height: 3000, color: 0x336699ff }).write(bigPath as `${string}.png`);
  await new Jimp({ width: 100, height: 100, color: 0x9cbe82ff }).write(smallPath as `${string}.png`);

  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });
  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Import both (add awaits the pre-scale before returning).
  const lib = await presenter.evaluate(
    (paths) => window.api.media.add(paths),
    [bigPath, smallPath],
  );
  expect(lib.ok).toBe(true);
  if (!lib.ok) throw new Error('media.add failed');
  const bigItem = lib.data.find((m) => m.path === bigPath)!;
  const smallItem = lib.data.find((m) => m.path === smallPath)!;
  expect(bigItem && smallItem).toBeTruthy();

  // The big image is served downscaled (a rendition was produced) — never the 4000px original.
  const big = await servedSize(audience, bigItem.id);
  expect(big.err).toBeFalsy();
  expect(big.w).toBeGreaterThan(0);
  expect(big.w).toBeLessThan(4000); // downscaled
  expect(big.w).toBeLessThanOrEqual(1920); // within the projector/low-tier ceiling

  // The small image is below the projector ceiling → untouched, served at its size.
  const small = await servedSize(audience, smallItem.id);
  expect(small.err).toBeFalsy();
  expect(small).toMatchObject({ w: 100, h: 100 });

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});
