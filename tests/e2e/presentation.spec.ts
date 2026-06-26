import { test, expect, _electron as electron, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');

function launchEnv() {
  const env = { ...process.env };
  // Electron must NOT run as plain Node, or app launch crashes (context.md §2).
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;
  return env;
}

type Slide = { id: string; lines: string[]; reference?: string };
const deck: Slide[] = [
  { id: 's1', lines: ['First slide line one', 'line two'], reference: 'Ref 1:1' },
  { id: 's2', lines: ['Second slide'], reference: 'Ref 2:2' },
  { id: 's3', lines: ['Third slide'], reference: 'Ref 3:3' },
];

// Full presentation-engine slice through the real bridge: set a multi-slide deck,
// walk it with next/prev/goto, exercise black/blank/clear, and verify the
// audience window mirrors main's live state and fails safe to black (§5.7).
test('present a deck: navigate, transition modes, and fail safe to black', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-present-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Load the deck via the real preload bridge.
  const set = await presenter.evaluate((d) => window.api.present.setDeck(d, 0), deck);
  expect(set.ok).toBe(true);

  // Audience shows slide 1.
  await expect(audience.getByText('First slide line one')).toBeVisible();
  await expect(audience.getByText('Ref 1:1')).toBeVisible();

  // Evidence screenshot of a presented slide.
  await audience.screenshot({
    path: path.join(os.tmpdir(), 'pp-present-slide1.png'),
  });

  // next advances to slide 2.
  await presenter.evaluate(() => window.api.present.next());
  await expect(audience.getByText('Second slide')).toBeVisible();

  // next then prev returns to slide 2 from slide 3.
  await presenter.evaluate(() => window.api.present.next());
  await expect(audience.getByText('Third slide')).toBeVisible();
  await presenter.evaluate(() => window.api.present.prev());
  await expect(audience.getByText('Second slide')).toBeVisible();

  // next at the end stays on the last slide (clamped — never out of range).
  await presenter.evaluate(() => window.api.present.goto(2));
  await presenter.evaluate(() => window.api.present.next());
  await expect(audience.getByText('Third slide')).toBeVisible();

  // goto jumps directly.
  await presenter.evaluate(() => window.api.present.goto(0));
  await expect(audience.getByText('First slide line one')).toBeVisible();

  // blank dims (keeps deck); clear/black blank the slide entirely.
  await presenter.evaluate(() => window.api.present.blank());
  await expect(audience.getByText('First slide line one')).toBeHidden();

  await presenter.evaluate(() => window.api.present.goto(0)); // resume slide mode
  await expect(audience.getByText('First slide line one')).toBeVisible();
  await presenter.evaluate(() => window.api.present.clear());
  await expect(audience.getByText('First slide line one')).toBeHidden();

  await presenter.evaluate(() => window.api.present.goto(0));
  await presenter.evaluate(() => window.api.present.black());
  await expect(audience.getByText('First slide line one')).toBeHidden();

  // Empty deck -> black, never a crash (fail-safe).
  const empty = await presenter.evaluate(() => window.api.present.setDeck([], 0));
  expect(empty.ok).toBe(true);
  await expect(audience.getByText('First slide line one')).toBeHidden();

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});

// The presenter UI renders, mirrors live state, and drives controls by keyboard
// (operated under pressure — §5.4).
test('presenter UI: preview, thumbnails, and keyboard live controls', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-present-ui-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  await presenter.evaluate((d) => window.api.present.setDeck(d, 0), deck);

  // Navigate to the presenter UI.
  await presenter.evaluate(() => {
    window.location.hash = '#/present';
  });
  await expect(presenter.getByRole('heading', { name: 'Presentation' })).toBeVisible();
  await expect(presenter.getByText(/Slide 1 \/ 3/)).toBeVisible();

  // Keyboard: ArrowRight advances; the audience and the live counter follow.
  await presenter.locator('body').click();
  await presenter.keyboard.press('ArrowRight');
  await expect(presenter.getByText(/Slide 2 \/ 3/)).toBeVisible();
  await expect(audience.getByText('Second slide')).toBeVisible();

  // ArrowLeft goes back.
  await presenter.keyboard.press('ArrowLeft');
  await expect(presenter.getByText(/Slide 1 \/ 3/)).toBeVisible();

  // 'b' blacks out.
  await presenter.keyboard.press('b');
  await expect(audience.getByText('First slide line one')).toBeHidden();

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
