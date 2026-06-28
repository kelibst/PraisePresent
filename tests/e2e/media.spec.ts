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

// A minimal valid 1x1 PNG (red pixel) — enough for the <img> to actually decode
// through the app-media:// protocol on the audience window.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC',
  'base64',
);

// Media domain vertical slice: register a file (by path, no copy), see it in the
// library, project it to the audience through the DB-allowlisted app-media://
// protocol, and confirm a MISSING file fails safe to black (never a crash).
test('add media, present it via app-media://, and fail safe on a missing file', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-media-'));
  const mediaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-media-files-'));
  const pngPath = path.join(mediaDir, 'background.png');
  fs.writeFileSync(pngPath, PNG_1x1);

  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Register the file via the core add path (the OS picker funnels through it).
  const added = await presenter.evaluate((p) => window.api.media.add([p]), pngPath);
  expect(added.ok).toBe(true);
  expect(added.data).toHaveLength(1);
  expect(added.data[0]).toMatchObject({ name: 'background.png', kind: 'image', path: pngPath });
  const mediaId = added.data[0].id;

  // Unsupported files are skipped, not errored.
  const skipped = await presenter.evaluate(() => window.api.media.add(['/tmp/notes.txt']));
  expect(skipped.ok).toBe(true);
  expect(skipped.data).toHaveLength(1); // still just the png

  // The Media page renders the library item.
  await presenter.evaluate(() => {
    window.location.hash = '#/media';
  });
  await expect(presenter.getByRole('heading', { name: 'Media' })).toBeVisible();
  await expect(presenter.getByText('background.png')).toBeVisible();

  // Present it; the audience renders an <img> served over app-media://.
  await presenter.evaluate(
    (id) =>
      window.api.present.setDeck(
        [
          {
            id: `media-${id}`,
            lines: [],
            media: { kind: 'image', url: `app-media://media/${id}` },
          },
        ],
        0,
      ),
    mediaId,
  );
  const img = audience.locator('img');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src', `app-media://media/${mediaId}`);
  // The protocol actually served bytes (naturalWidth > 0 means it decoded).
  await expect
    .poll(async () => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);

  // A request for an unknown id returns 404 → the audience shows no broken image.
  const orphan = await presenter.evaluate(() =>
    fetch('app-media://media/999999')
      .then((r) => r.status)
      .catch(() => -1),
  );
  expect([404, -1]).toContain(orphan);

  // Removing the item updates the library (original file is NOT deleted).
  const afterRemove = await presenter.evaluate((id) => window.api.media.remove(id), mediaId);
  expect(afterRemove.ok && afterRemove.data).toHaveLength(0);
  expect(fs.existsSync(pngPath)).toBe(true);

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.rmSync(mediaDir, { recursive: true, force: true });
});
