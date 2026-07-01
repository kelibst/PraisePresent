import { describe, it, expect, afterAll, vi } from 'vitest';
import { rmSync } from 'node:fs';

// Point the model manager's userData at a throwaway dir (the global electron mock
// returns '/tmp'; we want an isolated, cleaned-up location).
const hoisted = vi.hoisted(() => ({
  userData: `/tmp/pp-modelmgr-${Math.floor(Math.random() * 1e9)}`,
}));
vi.mock('electron', () => ({ app: { getPath: () => hoisted.userData, isPackaged: false } }));

// The preferred-model preference is persisted via settingsRepository, which
// opens a real SQLite connection (getDb()) — unavailable/ABI-mismatched under
// the plain-Node test runtime. Stand in with an in-memory store so
// installedModel()'s preference lookup doesn't touch a real DB (mirrors how
// aiScriptureDetector's tests mock '../infra/secrets').
const settingsStore = new Map<string, string>();
vi.mock('../db/repositories/settingsRepository', () => ({
  settingsRepository: {
    get: vi.fn((key: string) => settingsStore.get(key) ?? null),
    set: vi.fn((key: string, value: string) => {
      settingsStore.set(key, value);
    }),
  },
}));

import {
  deleteModel,
  downloadModel,
  getPreferredModel,
  installedModel,
  isModelInstalled,
  listModels,
  modelPath,
  setPreferredModel,
  whisperModelStatus,
  isDownloading,
} from './modelManager';

afterAll(() => {
  rmSync(hoisted.userData, { recursive: true, force: true });
});

// Build a fake `fetch` that streams `bytes` back as a single chunk.
function fakeFetch(bytes: number, ok = true): typeof fetch {
  return (async () => {
    const chunk = new Uint8Array(bytes);
    let read = false;
    return {
      ok,
      headers: { get: (k: string) => (k === 'content-length' ? String(bytes) : null) },
      body: {
        getReader: () => ({
          read: async () => {
            if (read) return { done: true, value: undefined };
            read = true;
            return { done: false, value: chunk };
          },
        }),
      },
    } as unknown as Response;
  }) as unknown as typeof fetch;
}

describe('modelManager.downloadModel', () => {
  it('downloads, atomically installs, and reports ready', async () => {
    expect(isModelInstalled('tiny')).toBe(false);
    await downloadModel('tiny', fakeFetch(1_100_000)); // > MIN_VALID_BYTES
    expect(isModelInstalled('tiny')).toBe(true);
    expect(installedModel()).toBe('tiny');
    expect(isDownloading()).toBe(false);

    const status = whisperModelStatus('whisper-local');
    expect(status.installed).toBe(true);
    expect(status.state).toBe('ready');
  });

  it('rejects a too-small (failed) download and leaves nothing installed', async () => {
    await expect(downloadModel('small', fakeFetch(500))).rejects.toThrow(/too small/i);
    expect(isModelInstalled('small')).toBe(false);
    // No stray .part file masquerades as installed.
    expect(installedModel()).not.toBe('small');
  });

  it('rejects a non-OK response', async () => {
    await expect(downloadModel('base', fakeFetch(1_100_000, false))).rejects.toThrow(/failed/i);
    expect(isModelInstalled('base')).toBe(false);
  });
});

describe('modelPath', () => {
  it('uses the official ggml filename under the whisper models dir', () => {
    expect(modelPath('base')).toContain('ggml-base.bin');
    expect(modelPath('base')).toContain(hoisted.userData);
  });
});

// Runs after the describe block above, which leaves `tiny` installed (`base`
// and `small` failed to install there) — the operator model-choice surface.
describe('modelManager — operator model choice', () => {
  it('listModels reports install state + size for every variant', () => {
    const models = listModels();
    const tiny = models.find((m) => m.id === 'tiny')!;
    const base = models.find((m) => m.id === 'base')!;
    expect(tiny.installed).toBe(true);
    expect(tiny.sizeBytes).toBeGreaterThan(0);
    expect(tiny.downloading).toBe(false);
    expect(base.installed).toBe(false);
  });

  it('with no preference set, installedModel() picks automatically', () => {
    expect(getPreferredModel()).toBeNull();
    expect(installedModel()).toBe('tiny'); // the only one installed so far
  });

  it('setPreferredModel pins a specific installed model', () => {
    setPreferredModel('tiny');
    expect(getPreferredModel()).toBe('tiny');
    expect(installedModel()).toBe('tiny');
  });

  it('a preference for a model that is not installed is stored but not honored', () => {
    setPreferredModel('small'); // never successfully installed above
    expect(getPreferredModel()).toBe('small');
    expect(installedModel()).toBe('tiny'); // falls back to automatic
  });

  it('clearing the preference (null) returns to automatic', () => {
    setPreferredModel(null);
    expect(getPreferredModel()).toBeNull();
    expect(installedModel()).toBe('tiny');
  });

  it('refuses to delete a model that is currently downloading', async () => {
    let release: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let reads = 0;
    const slowFetch = (async () =>
      ({
        ok: true,
        headers: { get: (k: string) => (k === 'content-length' ? '1100000' : null) },
        body: {
          getReader: () => ({
            read: async () => {
              reads += 1;
              if (reads === 1) return { done: false, value: new Uint8Array(1_100_000) };
              await gate; // hold the download open so we can assert mid-flight
              return { done: true, value: undefined };
            },
          }),
        },
      }) as unknown as Response) as unknown as typeof fetch;

    // downloadModel is async but sets `inFlight` synchronously before its
    // first await, so isDownloading() is already true without awaiting here.
    const pending = downloadModel('base', slowFetch);
    expect(isDownloading()).toBe(true);
    expect(() => deleteModel('base')).toThrow(/downloading/i);

    release!();
    await pending;
    expect(isModelInstalled('base')).toBe(true);
  });

  it('deleteModel removes an installed model', () => {
    expect(isModelInstalled('tiny')).toBe(true);
    deleteModel('tiny');
    expect(isModelInstalled('tiny')).toBe(false);
  });

  it('deleteModel on an already-absent model is a safe no-op', () => {
    expect(() => deleteModel('small')).not.toThrow();
  });
});
