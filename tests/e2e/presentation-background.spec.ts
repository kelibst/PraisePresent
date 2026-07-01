import { test, expect, _electron as electron, type Page } from '@playwright/test';
import path from 'node:path';

// Settings → Presentation: the service-wide DEFAULT background. The operator stages
// a choice (preview only) and commits it with an explicit Save; only then is it
// persisted AND applied to the live presentation. Verifies the full seam:
// Settings UI → present:set-default-background → live state → audience render.
const mainPath = path.join(__dirname, '..', '..', '.vite', 'build', 'main.js');

function launchEnv() {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;
  return env;
}

// The "Sage" swatch is hsl(99, 25%, 47%), which the browser computes to this rgb.
const SAGE_RGB = 'rgb(111, 150, 90)';

async function windows(app: Awaited<ReturnType<typeof electron.launch>>) {
  const pages: Page[] = [];
  pages.push(await app.firstWindow());
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;
  return { audience, presenter };
}

function audienceHasColor(audience: Page, rgb: string) {
  return audience.evaluate(
    (target) =>
      Array.from(document.querySelectorAll('div')).some(
        (d) => (d as HTMLElement).style.backgroundColor === target,
      ),
    rgb,
  );
}

test('Settings default background: staged on pick, applied to live only on Save', async () => {
  const app = await electron.launch({ args: [mainPath, '--no-sandbox'], env: launchEnv() });
  const { audience, presenter } = await windows(app);

  // Known clean baseline (a prior run may have persisted a default in SQLite).
  await presenter.evaluate(() => window.api.present.setDefaultBackground(null));
  // A passage is already live.
  await presenter.evaluate(() => window.api.present.setDeck([{ id: 's1', lines: ['LIVE'] }], 0));
  await expect(audience.getByText('LIVE')).toBeVisible();
  expect(await audienceHasColor(audience, SAGE_RGB)).toBe(false);

  // Open Settings → Presentation and STAGE the Sage swatch (no Save yet).
  await presenter.evaluate(() => {
    window.location.hash = '#/settings';
  });
  await presenter.getByRole('button', { name: 'Presentation' }).click();
  await expect(presenter.getByText('Service background')).toBeVisible();
  await presenter.getByRole('button', { name: 'Background Sage' }).click();

  // Staged, not committed: "Unsaved changes" shows and the LIVE audience is unchanged.
  await expect(presenter.getByText('Unsaved changes')).toBeVisible();
  await presenter.waitForTimeout(200);
  expect(await audienceHasColor(audience, SAGE_RGB)).toBe(false);

  // Commit with the explicit Save button → persisted AND applied live.
  await presenter.getByRole('button', { name: /Save background/ }).click();
  await expect(presenter.getByText('Saved — now live')).toBeVisible();
  await expect.poll(() => audienceHasColor(audience, SAGE_RGB)).toBe(true);

  // The persisted default round-trips through getState (what the page reloads on mount).
  const persisted = await presenter.evaluate(async () => {
    const res = await window.api.present.getState();
    return res.ok ? res.data.defaultBackground : null;
  });
  expect(persisted).toEqual({ type: 'color', color: 'hsl(99, 25%, 47%)' });

  // Leave the persisted default clean (gradient) so the suite doesn't inject a
  // background into the real settings DB.
  await presenter.evaluate(() => window.api.present.setDefaultBackground(null));
  await app.close();
});
