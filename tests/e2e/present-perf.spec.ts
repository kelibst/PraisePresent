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

// B0 profiling harness: measures the user-facing metric the brief names —
// slide-advance latency (next() → the new cursor reflected in the renderer) — over
// many advances on a LARGE deck. With the deck/cursor split (B1) the 200-slide deck
// is shipped ONCE on setDeck; every advance after that sends only a tiny cursor, so
// latency must stay low and flat. A regression that re-broadcasts the whole deck per
// keystroke would blow the p95 budget here. Run under CPU/GPU throttling per
// scripts/profile-present.md to capture real low-end numbers.
test('slide-advance latency stays low across many advances on a big deck (O(cursor))', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-perf-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  const result = (await presenter.evaluate(async () => {
    // A long passage's worth of slides (the worst case the brief calls out).
    const deck = Array.from({ length: 200 }, (_, i) => ({ id: `s${i}`, lines: [`Line ${i + 1}`] }));
    await window.api.present.setDeck(deck, 0);

    const N = 40;
    const times: number[] = [];
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      await new Promise<void>((resolve) => {
        // Resolve when the cursor advances to the next index. The seed callback
        // (current index) is ignored; only the post-next() push resolves.
        const off = window.api.present.onState((s) => {
          if (s.index === i + 1) {
            off();
            resolve();
          }
        });
        void window.api.present.next();
      });
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    return {
      p50: times[Math.floor(N * 0.5)],
      p95: times[Math.floor(N * 0.95)],
      max: times[N - 1],
    };
  })) as { p50: number; p95: number; max: number };

  console.log(
    `[present-perf] advance latency (200-slide deck): p50=${result.p50.toFixed(1)}ms ` +
      `p95=${result.p95.toFixed(1)}ms max=${result.max.toFixed(1)}ms`,
  );

  // Generous tripwire for un-throttled CI. The point is to catch an O(deck)
  // regression (which would be many× slower), not to assert a tight number.
  expect(result.p95).toBeLessThan(250);

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
