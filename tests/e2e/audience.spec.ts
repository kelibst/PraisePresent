import { test, expect, _electron as electron, type Page } from '@playwright/test';
import path from 'node:path';

const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');

function launchEnv() {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;
  return env;
}

// Verifies the present:* broadcast: main owns live state, the presenter sets it,
// and the audience window mirrors it — and fails safe to black. (Single-display
// here, so this exercises the mirror logic, not physical 2nd-monitor placement.)
test('audience window mirrors the presenter slide and fails safe to black', async () => {
  const app = await electron.launch({ args: [mainPath, '--no-sandbox'], env: launchEnv() });

  // Presenter + audience both open; identify them by route hash.
  const pages: Page[] = [];
  pages.push(await app.firstWindow());
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');

  const audience = pages.find((p) => p.url().includes('/audience'));
  const presenter = pages.find((p) => !p.url().includes('/audience'));
  expect(audience).toBeTruthy();
  expect(presenter).toBeTruthy();

  // Presenter pushes a deck; audience mirrors the current slide.
  await presenter!.evaluate(() =>
    window.api.present.setDeck([{ id: 's1', lines: ['MIRROR TEST'] }], 0),
  );
  await expect(audience!.getByText('MIRROR TEST')).toBeVisible();

  // Black out — audience fails safe; the slide is gone.
  await presenter!.evaluate(() => window.api.present.black());
  await expect(audience!.getByText('MIRROR TEST')).toBeHidden();

  await app.close();
});
