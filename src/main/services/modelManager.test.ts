import { describe, it, expect, afterAll, vi } from 'vitest';
import { rmSync } from 'node:fs';

// Point the model manager's userData at a throwaway dir (the global electron mock
// returns '/tmp'; we want an isolated, cleaned-up location).
const hoisted = vi.hoisted(() => ({
  userData: `/tmp/pp-modelmgr-${Math.floor(Math.random() * 1e9)}`,
}));
vi.mock('electron', () => ({ app: { getPath: () => hoisted.userData, isPackaged: false } }));

import {
  downloadModel,
  installedModel,
  isModelInstalled,
  modelPath,
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
