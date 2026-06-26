import { ipcMain } from 'electron';
import type { ZodType } from 'zod';
import { ok, err, type Result } from '@/shared/types/result';
import log from '../infra/logger';

// Wrap ipcMain.handle with zod validation + a typed Result. Handlers never throw
// across the bridge; invalid payloads are rejected at the main boundary — the
// renderer is never trusted (CLAUDE.md §5.3).
export function handle<TReq, TRes>(
  channel: string,
  schema: ZodType<TReq>,
  handler: (req: TReq) => TRes | Promise<TRes>,
): void {
  ipcMain.handle(channel, async (_event, raw): Promise<Result<TRes>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      log.warn(`IPC ${channel}: rejected invalid payload —`, parsed.error.issues);
      return err(`Invalid payload for ${channel}`);
    }
    try {
      return ok(await handler(parsed.data));
    } catch (e) {
      log.error(`IPC ${channel}: handler error —`, e);
      return err(e instanceof Error ? e.message : String(e));
    }
  });
}
