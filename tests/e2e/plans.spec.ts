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

// D5 acceptance: build a real multi-element service, save it, RELOAD (full app
// restart), and present an element — all from SQLite (the fixture is gone).
test('build, save, reload, and present a real service plan', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-plans-'));
  const args = [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`];

  // Launch 1: build a plan with a song item + a custom item.
  const app1 = await electron.launch({ args, env: launchEnv() });
  const w1 = await app1.firstWindow();
  await w1.waitForLoadState('domcontentloaded');
  const planId = (await w1.evaluate(async () => {
    const song = await window.api.songs.importText({
      title: 'Grace',
      author: '',
      text: 'Amazing grace',
    });
    const songId = song.ok ? song.data : 0;
    const created = await window.api.plans.create({
      name: 'Sunday AM',
      scheduledFor: null,
      notes: '',
      items: [],
    });
    const pid = created.ok ? created.data : 0;
    await window.api.plans.update({
      id: pid,
      name: 'Sunday AM',
      scheduledFor: null,
      notes: '',
      items: [
        { kind: 'song', refId: songId, title: 'Grace', content: '', sortOrder: 0 },
        {
          kind: 'custom',
          refId: null,
          title: 'Welcome',
          content: 'Welcome to church',
          sortOrder: 1,
        },
      ],
    });
    return pid;
  })) as number;
  await app1.close();

  // Launch 2: reload — the plan + its items persisted to SQLite.
  const app2 = await electron.launch({ args, env: launchEnv() });
  const pages: Page[] = [await app2.firstWindow()];
  while (pages.length < 2) pages.push(await app2.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const audience = pages.find((p) => p.url().includes('/audience'))!;
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  const plan = await presenter.evaluate((id) => window.api.plans.get(id), planId);
  expect(plan.ok).toBe(true);
  expect(plan.data.name).toBe('Sunday AM');
  expect(plan.data.items).toHaveLength(2);
  expect(plan.data.items[0].kind).toBe('song');

  // Present the custom element; the audience window mirrors it.
  await presenter.evaluate(async (id) => {
    const p = await window.api.plans.get(id);
    if (p.ok && p.data) {
      await window.api.present.setDeck(
        [{ id: 'plan-item-1', lines: p.data.items[1].content.split('\n') }],
        0,
      );
    }
  }, planId);
  await expect(audience.getByText('Welcome to church')).toBeVisible();

  // The planning UI renders the persisted plan (observed running).
  await presenter.evaluate((id) => {
    window.location.hash = `#/services/${id}`;
  }, planId);
  await expect(presenter.getByRole('heading', { name: 'Sunday AM' })).toBeVisible();

  await app2.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
