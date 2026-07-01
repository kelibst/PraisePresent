import { test, expect, _electron as electron, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');
function launchEnv() {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;
  return env;
}

// Decode the served video's pixel width in the audience window (cache-busted so a
// later poll sees the rendition once the background transcode swaps it in).
function servedVideoWidth(page: Page, id: number, bust: number) {
  return page.evaluate(
    ({ mediaId, t }) =>
      new Promise<number>((resolve) => {
        const v = document.createElement('video');
        v.muted = true;
        v.onloadedmetadata = () => resolve(v.videoWidth);
        v.onerror = () => resolve(-1);
        v.src = `app-media://media/${mediaId}?t=${t}`;
      }),
    { mediaId: id, t: bust },
  );
}

// B6c: an oversized (4K) video imported into the library is transcoded OUT-OF-PROCESS
// (ffmpeg child) to a projector-fit H.264 rendition in the BACKGROUND; the original is
// served until the rendition is ready, after which the app-media:// protocol serves the
// downscaled rendition (the projector never decodes 4K live).
test('media transcode: a 4K video is background-transcoded to a projector-fit rendition', async () => {
  test.setTimeout(120_000); // a one-shot 4K transcode + app launch
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-transcode-'));
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-vfix-'));

  // Generate a 1s 4K test clip with the bundled ffmpeg (well above any projector).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpeg = require('ffmpeg-static') as string;
  const srcPath = path.join(fixtureDir, 'big4k.mp4');
  execFileSync(ffmpeg, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=3840x2160:rate=10:duration=1',
    '-pix_fmt',
    'yuv420p',
    srcPath,
  ]);

  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });
  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Import the video (returns immediately — transcode is queued in the background).
  const lib = await presenter.evaluate((src) => window.api.media.add([src]), srcPath);
  expect(lib.ok).toBe(true);
  if (!lib.ok) throw new Error('media.add failed');
  const item = lib.data.find((m) => m.path === srcPath)!;
  expect(item).toBeTruthy();

  // The original (4K) loads through the protocol straight away.
  expect(await servedVideoWidth(audience, item.id, 0)).toBe(3840);

  // The background transcode eventually swaps in a downscaled rendition (< 4K).
  let bust = 1;
  await expect
    .poll(async () => servedVideoWidth(audience, item.id, bust++), { timeout: 90_000 })
    .toBeLessThan(3840);

  // ...and it's a valid, positive size (a real rendition, not a load error).
  const finalWidth = await servedVideoWidth(audience, item.id, bust++);
  expect(finalWidth).toBeGreaterThan(0);
  expect(finalWidth).toBeLessThan(3840);

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});
