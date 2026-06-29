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

// A1 control surface: the orchestrator state machine the Live-Detect / AI-Privacy
// screens render, driven entirely through window.api.ai.* (the real bridge).
// Interfaces + in-memory state only — no audio/network/keys (A2/A4).
test('AI orchestrator: agents, mode, kill-switch, listen stub via the bridge', async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-ai-ctrl-'));
  const app = await electron.launch({
    args: [mainPath, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: launchEnv(),
  });

  const pages: Page[] = [await app.firstWindow()];
  while (pages.length < 2) pages.push(await app.waitForEvent('window'));
  for (const p of pages) await p.waitForLoadState('domcontentloaded');
  const presenter = pages.find((p) => !p.url().includes('/audience'))!;

  // Built-in registry: the five documented agents with their availability gates.
  const agents = await presenter.evaluate(() => window.api.ai.listAgents());
  expect(agents.ok).toBe(true);
  expect(agents.data.map((a) => a.id)).toEqual([
    'praisepresent-local',
    'whisper-local',
    'claude',
    'deepgram',
    'assemblyai',
  ]);
  expect(agents.data.find((a) => a.id === 'praisepresent-local')!.installed).toBe(true);
  expect(agents.data.find((a) => a.id === 'whisper-local')!.installed).toBe(false);
  expect(agents.data.find((a) => a.id === 'claude')!.hasKey).toBe(false);

  // Audio sources: the renderer pushes enumerated device labels; main merges them
  // with the built-in default. Pushing an empty list still yields the default.
  const sources = await presenter.evaluate(() => window.api.ai.listSources([]));
  expect(sources.ok && sources.data.length).toBeGreaterThan(0);
  expect(sources.ok && sources.data.some((s) => s.id === 'default')).toBe(true);

  // A pushed device is preserved and selectable; an unknown id is rejected.
  const merged = await presenter.evaluate(() =>
    window.api.ai.listSources([{ id: 'mic-1', label: 'USB Mic' }]),
  );
  expect(merged.ok && merged.data.some((s) => s.id === 'mic-1')).toBe(true);
  const picked = await presenter.evaluate(() => window.api.ai.setSource('mic-1'));
  expect(picked.ok && picked.data.selectedSourceId).toBe('mic-1');
  const badSrc = await presenter.evaluate(() => window.api.ai.setSource('nope'));
  expect(badSrc.ok && badSrc.data.selectedSourceId).toBe('mic-1'); // unchanged

  // Local model download manager (R6 stub): whisper-local reports absent, and the
  // download action is a clear no-op — never a fake "ready", never a crash.
  const model = await presenter.evaluate(() => window.api.ai.modelStatus('whisper-local'));
  expect(model.ok).toBe(true);
  expect(model.data.installed).toBe(false);
  expect(model.data.state).toBe('absent');
  const dl = await presenter.evaluate(() => window.api.ai.downloadModel('whisper-local'));
  expect(dl.ok && dl.data.state).toBe('absent');
  expect(dl.ok && (dl.data.detail ?? '')).toContain('not available');

  // Default status: passive, enabled, not listening, local agent.
  const initial = await presenter.evaluate(() => window.api.ai.status());
  expect(initial.ok).toBe(true);
  expect(initial.data.mode).toBe('passive');
  expect(initial.data.enabled).toBe(true);
  expect(initial.data.listening).toBe(false);
  expect(initial.data.activeAgentId).toBe('praisepresent-local');

  // Mode toggles passive <-> drive.
  const drive = await presenter.evaluate(() => window.api.ai.setMode('drive'));
  expect(drive.ok && drive.data.mode).toBe('drive');
  await presenter.evaluate(() => window.api.ai.setMode('passive'));

  // The bundled local agent is available → startListening succeeds.
  const listening = await presenter.evaluate(() => window.api.ai.startListening());
  expect(listening.ok && listening.data.listening).toBe(true);

  // Kill-switch: setEnabled(false) is a hard stop (forces listening off).
  const killed = await presenter.evaluate(() => window.api.ai.setEnabled(false));
  expect(killed.ok).toBe(true);
  expect(killed.data.enabled).toBe(false);
  expect(killed.data.listening).toBe(false);

  // Cannot start listening while killed; clear status, no detection.
  const blocked = await presenter.evaluate(() => window.api.ai.startListening());
  expect(blocked.ok && blocked.data.listening).toBe(false);
  expect(blocked.data.lastError).toBeTruthy();

  // Re-enable, then switch to an uninstalled agent → listen no-ops with a reason.
  await presenter.evaluate(() => window.api.ai.setEnabled(true));
  const switched = await presenter.evaluate(() => window.api.ai.setAgent('whisper-local'));
  expect(switched.ok && switched.data.activeAgentId).toBe('whisper-local');
  const stub = await presenter.evaluate(() => window.api.ai.startListening());
  expect(stub.ok && stub.data.listening).toBe(false);
  expect(stub.data.lastError).toBeTruthy();

  // An unknown agent id is rejected without breaking the surface.
  const bad = await presenter.evaluate(() => window.api.ai.setAgent('does-not-exist'));
  expect(bad.ok && bad.data.activeAgentId).toBe('whisper-local');

  // --- A2/A3 surface: online opt-in, key presence, auto-project guard --------
  await presenter.evaluate(() => window.api.ai.setAgent('praisepresent-local'));

  // Online opt-in toggles via the (now-wired) setOnline channel.
  const online = await presenter.evaluate(() => window.api.ai.setOnline(true));
  expect(online.ok && online.data.online).toBe(true);
  await presenter.evaluate(() => window.api.ai.setOnline(false));

  // Default config NEVER auto-projects (R8); enabling sets a threshold; the
  // value comes back in status but the default stays disabled.
  const ap0 = await presenter.evaluate(() => window.api.ai.status());
  expect(ap0.ok && ap0.data.autoProject.enabled).toBe(false);
  const ap1 = await presenter.evaluate(() =>
    window.api.ai.setAutoProject({ enabled: true, minConfidence: 0.9 }),
  );
  expect(ap1.ok && ap1.data.autoProject.enabled).toBe(true);
  expect(ap1.ok && ap1.data.autoProject.minConfidence).toBe(0.9);
  await presenter.evaluate(() =>
    window.api.ai.setAutoProject({ enabled: false, minConfidence: 0.95 }),
  );

  // Transcript-only flag round-trips.
  const to = await presenter.evaluate(() => window.api.ai.setTranscriptOnly(true));
  expect(to.ok && to.data.transcriptOnly).toBe(true);
  await presenter.evaluate(() => window.api.ai.setTranscriptOnly(false));

  // Key management: hasKey returns ONLY a boolean status; the value never
  // crosses the bridge. (safeStorage may be unavailable on a headless CI box —
  // tolerate a failed set, but a successful set must report hasKey and a hint
  // that is never the raw key.)
  const before = await presenter.evaluate(() => window.api.ai.hasKey('claude'));
  expect(before.ok).toBe(true);
  expect(typeof before.data.hasKey).toBe('boolean');

  const set = await presenter.evaluate(() =>
    window.api.ai.setApiKey('claude', 'sk-ant-e2e-testkey-7777'),
  );
  if (set.ok) {
    expect(set.data.hasKey).toBe(true);
    // The masked hint, if present, must not be the raw key.
    expect(set.data.hint ?? '').not.toContain('testkey');
    const has = await presenter.evaluate(() => window.api.ai.hasKey('claude'));
    expect(has.ok && has.data.hasKey).toBe(true);
    // The whole serialized result must never contain the plaintext key.
    expect(JSON.stringify(has.data)).not.toContain('7777');
    const cleared = await presenter.evaluate(() => window.api.ai.clearApiKey('claude'));
    expect(cleared.ok && cleared.data.hasKey).toBe(false);
  }

  // The text path still works unchanged alongside the control surface.
  await expect
    .poll(
      async () => {
        const r = await presenter.evaluate(() => window.api.ai.submitText('John 3:16'));
        return r.ok ? r.data.length : 0;
      },
      { timeout: 30_000 },
    )
    .toBe(1);

  // Event subscriptions wire up and unsubscribe cleanly (no events pushed in A1).
  const subscribed = await presenter.evaluate(() => {
    const offC = window.api.ai.onCandidates(() => {});
    const offT = window.api.ai.onTranscript(() => {});
    offC();
    offT();
    return typeof offC === 'function' && typeof offT === 'function';
  });
  expect(subscribed).toBe(true);

  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});
