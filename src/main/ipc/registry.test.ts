import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';
import { z } from 'zod';
import { handle } from './registry';

// Pull out the (channel, handler) pair the registry registered with ipcMain.
type IpcHandler = (event: unknown, raw: unknown) => Promise<unknown>;
function lastRegistered(): IpcHandler {
  const calls = (ipcMain.handle as unknown as { mock: { calls: [string, IpcHandler][] } }).mock
    .calls;
  return calls[calls.length - 1][1];
}

const schema = z.object({ key: z.string().min(1) });

beforeEach(() => vi.clearAllMocks());

describe('ipc registry harness', () => {
  it('returns Ok with the handler result for a valid payload', async () => {
    handle('test:ok', schema, ({ key }) => `got:${key}`);
    const fn = lastRegistered();
    expect(await fn({}, { key: 'abc' })).toEqual({ ok: true, data: 'got:abc' });
  });

  it('rejects an invalid payload at the boundary (handler never runs)', async () => {
    const spy = vi.fn(() => 'should-not-run');
    handle('test:bad', schema, spy);
    const fn = lastRegistered();
    const res = (await fn({}, { key: '' })) as { ok: boolean };
    expect(res.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns a generic Err when the handler throws (no detail leaks)', async () => {
    handle('test:throw', schema, () => {
      throw new Error('internal /secret/path detail');
    });
    const fn = lastRegistered();
    const res = (await fn({}, { key: 'x' })) as { ok: boolean; error: string };
    expect(res.ok).toBe(false);
    expect(res.error).toBe('test:throw failed');
    expect(res.error).not.toContain('secret');
  });
});
