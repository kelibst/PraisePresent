import { describe, it, expect, vi, beforeEach } from 'vitest';

// Detector-level tests for the A2/A3 control surface: key storage round-trip
// (renderer only ever sees a boolean), the kill-switch hard-stop, and the
// connectivity-driven auto-degrade. The electron-backed secrets store and the
// window manager are mocked so this runs under Node (CLAUDE.md §5.8).

// In-memory stand-in for the safeStorage-backed secrets module. We assert the
// detector NEVER returns a stored value across the bridge — only booleans.
const store = new Map<string, string>();
vi.mock('../infra/secrets', () => ({
  secrets: {
    set: vi.fn((key: string, value: string) => store.set(key, value)),
    get: vi.fn((key: string) => store.get(key) ?? null),
    has: vi.fn((key: string) => store.has(key)),
    delete: vi.fn((key: string) => {
      store.delete(key);
    }),
    isAvailable: vi.fn(() => true),
  },
}));

// The presenter push target is electron-backed; stub it out.
vi.mock('../windows/windowManager', () => ({
  sendToPresenter: vi.fn(),
}));

import { aiScriptureDetector, setConnectivityCheck } from './aiScriptureDetector';

beforeEach(() => {
  store.clear();
  // Reset orchestrator-affecting state to defaults between tests.
  aiScriptureDetector.setEnabled(true);
  aiScriptureDetector.setAgent('praisepresent-local');
  aiScriptureDetector.setOnline(false);
  setConnectivityCheck(() => true);
});

describe('aiScriptureDetector — API key storage (privacy §1.7)', () => {
  it('round-trips a key but only ever returns a boolean (+ masked hint)', () => {
    const set = aiScriptureDetector.setApiKey('claude', 'sk-ant-supersecret-abcd');
    // The result is a key STATUS, not the key. No field equals the plaintext.
    expect(set.hasKey).toBe(true);
    expect(JSON.stringify(set)).not.toContain('supersecret');
    expect(set.hint).toBe('••••abcd'); // masked last-4 only

    const status = aiScriptureDetector.hasKey('claude');
    expect(status).toEqual({ hasKey: true });
    expect(JSON.stringify(status)).not.toContain('supersecret');

    // hasKey is false for an agent with no stored key.
    expect(aiScriptureDetector.hasKey('deepgram').hasKey).toBe(false);
  });

  it('listAgents reflects real key presence without exposing the value', () => {
    aiScriptureDetector.setApiKey('claude', 'sk-ant-xyz1234');
    const agents = aiScriptureDetector.listAgents();
    const claude = agents.find((a) => a.id === 'claude')!;
    const deepgram = agents.find((a) => a.id === 'deepgram')!;
    expect(claude.hasKey).toBe(true);
    expect(deepgram.hasKey).toBe(false);
    expect(JSON.stringify(agents)).not.toContain('xyz1234');
  });

  it('clearApiKey removes the key and reports keyless', () => {
    aiScriptureDetector.setApiKey('claude', 'sk-ant-tobedeleted');
    expect(aiScriptureDetector.hasKey('claude').hasKey).toBe(true);
    const cleared = aiScriptureDetector.clearApiKey('claude');
    expect(cleared).toEqual({ hasKey: false });
    expect(aiScriptureDetector.hasKey('claude').hasKey).toBe(false);
  });

  it('a stored key makes the cloud agent listen-eligible (online + opt-in)', () => {
    aiScriptureDetector.setApiKey('claude', 'sk-ant-realkey');
    aiScriptureDetector.setOnline(true);
    aiScriptureDetector.setAgent('claude');
    const status = aiScriptureDetector.startListening();
    expect(status.listening).toBe(true);
    expect(status.lastError).toBeUndefined();
  });
});

describe('aiScriptureDetector — kill-switch hard stop', () => {
  it('setEnabled(false) forces listening off and blocks restart', () => {
    aiScriptureDetector.setApiKey('claude', 'sk-ant-realkey');
    aiScriptureDetector.setOnline(true);
    aiScriptureDetector.setAgent('claude');
    expect(aiScriptureDetector.startListening().listening).toBe(true);

    const killed = aiScriptureDetector.setEnabled(false);
    expect(killed.enabled).toBe(false);
    expect(killed.listening).toBe(false);

    const blocked = aiScriptureDetector.startListening();
    expect(blocked.listening).toBe(false);
    expect(blocked.lastError).toBeTruthy();
  });
});

describe('aiScriptureDetector — auto-project default (R8)', () => {
  it('default config never auto-projects; enabling sets a threshold', () => {
    const initial = aiScriptureDetector.status();
    expect(initial.autoProject.enabled).toBe(false);

    const enabled = aiScriptureDetector.setAutoProject({ enabled: true, minConfidence: 0.9 });
    expect(enabled.autoProject).toEqual({ enabled: true, minConfidence: 0.9 });

    // Back off — restore the default never-auto-project posture.
    const off = aiScriptureDetector.setAutoProject({ enabled: false, minConfidence: 0.95 });
    expect(off.autoProject.enabled).toBe(false);
  });
});

describe('aiScriptureDetector — auto-degrade on fake connectivity loss', () => {
  it('switches an active cloud agent to offline with no network call', () => {
    aiScriptureDetector.setApiKey('claude', 'sk-ant-realkey');
    aiScriptureDetector.setOnline(true);
    aiScriptureDetector.setAgent('claude');

    // Connectivity is fine → no change.
    setConnectivityCheck(() => true);
    expect(aiScriptureDetector.checkConnectivity().activeAgentId).toBe('claude');

    // Fake a connectivity loss → silent fallback to the offline default.
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    setConnectivityCheck(() => false);
    const degraded = aiScriptureDetector.checkConnectivity();
    expect(degraded.activeAgentId).toBe('praisepresent-local');
    expect(degraded.online).toBe(false);
    expect(degraded.lastError).toMatch(/offline/i);
    // The offline path makes zero network calls.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
