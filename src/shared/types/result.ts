// Typed boundary result. IPC handlers never throw across the bridge — they
// return Ok or Err so the renderer handles failures explicitly (CLAUDE.md §5.1).
export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: string };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = (error: string): Err => ({ ok: false, error });
