# Profiling the audience render path on (emulated) low-end hardware

> B0 deliverable for the display-rendering re-architecture (`plan/prompt.md`).
> Decisions for B5 (drop React on the projector) and B6 (native media pipeline) are
> **gated on numbers captured here** — measure, don't assert.

## Target metrics

| Metric | How | Budget (guide) |
| --- | --- | --- |
| Slide-advance latency (next() → cursor reflected) | `tests/e2e/present-perf.spec.ts` (p50/p95/max) | p95 well under one frame-budget × a few; flat across a 200-slide deck |
| Transition frame rate | DevTools Performance panel, record a fade/dissolve | ≥60 fps; no long tasks > 16 ms on the compositor |
| Peak RSS | `app.evaluate(() => process.memoryUsage().rss)` before/after a long service | no unbounded growth across 100s of advances |
| IPC bytes per transport action | main-process instrumentation snippet (below) | cursor push ≪ deck push; deck sent once per setDeck |

## Run the automated latency harness

```bash
npm run package        # produce .vite/build (the e2e load .vite/build/main.js)
npx playwright test tests/e2e/present-perf.spec.ts
```

It prints `[present-perf] advance latency (200-slide deck): p50=… p95=… max=…`. With
the deck/cursor split (B1) the 200 slides ship once on `setDeck`; each advance sends
only a ~40-byte cursor, so latency stays low and FLAT. A regression that re-broadcasts
the whole deck per keystroke shows up as a much larger, deck-size-dependent p95.

## Emulate a 10–15-year-old church PC

Launch Electron with throttled CPU/GPU and a memory cap (combine as needed):

- **Software GL (weak/integrated GPU path):**
  `--use-gl=swiftshader` or `--disable-gpu` — measure BOTH; some old GPUs are faster
  in software, which is exactly the B5/compositor question.
- **CPU slowdown (6×):** drive via the Chrome DevTools Protocol from the test:
  `const client = await page.context().newCDPSession(page); await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });`
  then run the advance/transition measurements.
- **Memory cap:** `--js-flags="--max-old-space-size=512"` for the renderer heap; for a
  true 8 GB box, run inside a cgroup/VM limited to 8 GB and watch RSS.
- **Frame-rate / paint:** record the audience window in the DevTools Performance panel
  during a dissolve; confirm the opacity animation is GPU-composited (no purple
  "layout"/"paint" bars per frame) — verifies B2's compositor assumption.

## Optional: count IPC bytes per channel (main-process instrumentation)

Run inside the test against the main process to prove the deck-vs-cursor split:

```ts
await app.evaluate(({ webContents }) => {
  const g = globalThis as unknown as { __ipc?: Record<string, { n: number; bytes: number }> };
  g.__ipc = {};
  for (const wc of webContents.getAllWebContents()) {
    const orig = wc.send.bind(wc);
    wc.send = (channel: string, ...args: unknown[]) => {
      const s = (g.__ipc![channel] ??= { n: 0, bytes: 0 });
      s.n += 1;
      s.bytes += JSON.stringify(args).length;
      return orig(channel, ...args);
    };
  }
});
// … drive setDeck + N advances …
const ipc = await app.evaluate(() => (globalThis as { __ipc?: unknown }).__ipc);
console.log('[present-perf] ipc by channel', ipc);
// Expect: present:deck sent ~once (large); present:cursor sent N times (tiny).
```

> This monkeypatch is **test-only** (installed from the test, never shipped) — it
> stays out of production code per CLAUDE.md §1.3/§5.2.

## What still needs a real device

The emulated numbers are directional. Before unblocking B5/B6, capture RSS + transition
fps on an **actual 8 GB / integrated-GPU / spinning-disk** machine (the deployment
reality). Record before/after B1–B4 and attach to the B0 task outcome.
