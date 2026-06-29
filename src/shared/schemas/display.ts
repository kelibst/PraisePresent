import { z } from 'zod';

// Display/output schemas (CLAUDE.md §5.3). Monitor enumeration and window
// placement happen ONLY in main (via electron `screen`); the renderer just
// reads this typed, validated shape over `window.api.display.*` and never
// touches `electron`/`screen` itself (§1.3/§5.2).

export const displayInfo = z.object({
  id: z.number(), // electron Display.id (numeric, JSON-safe)
  label: z.string(), // friendly name, e.g. "Built-in" / "Dell U2720Q"
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
});

// The persisted audience-screen choice. displayId null = "auto" (pick the first
// non-primary display, else the primary as a single-screen fallback). NOTE: not
// `.int()` — electron's Display.id on Linux exceeds Number.MAX_SAFE_INTEGER, and
// `.int()` would reject a real monitor id. It only ever feeds an `===` lookup.
export const audienceSelection = z.object({
  displayId: z.number().nullable(),
});

// --- display safety (settings-backed) -------------------------------------
// Two operator-tunable safety controls, persisted via the existing settings IPC
// (truth in SQLite — §1.5) under these keys. They are read by the audience view
// (safe-area inset) and the window manager (black-on-disconnect, §5.7).
export const SAFE_AREA_KEY = 'display.safeAreaPct';
export const BLACK_ON_DISCONNECT_KEY = 'display.blackOnDisconnect';

// Inset the projected slide by this percentage on every edge (overscan / TV
// safe-area). Bounded 0–15%; default 0 (no inset).
export const DEFAULT_SAFE_AREA_PCT = 0;
export const MAX_SAFE_AREA_PCT = 15;
// Black the audience output when its display is unplugged (default ON — §5.7).
export const DEFAULT_BLACK_ON_DISCONNECT = true;

export const safeAreaPct = z.number().min(0).max(MAX_SAFE_AREA_PCT);

// Parse the persisted (string) safe-area value, clamping to [0,15]; any garbage
// or missing value falls back to the default so the audience never breaks.
export function parseSafeAreaPct(raw: string | null): number {
  if (raw === null) return DEFAULT_SAFE_AREA_PCT;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_SAFE_AREA_PCT;
  return Math.min(MAX_SAFE_AREA_PCT, Math.max(0, n));
}

// Parse the persisted (string) black-on-disconnect flag; default ON for anything
// that isn't an explicit 'false' (fail safe).
export function parseBlackOnDisconnect(raw: string | null): boolean {
  if (raw === null) return DEFAULT_BLACK_ON_DISCONNECT;
  return raw !== 'false';
}

export type DisplayInfo = z.infer<typeof displayInfo>;
export type AudienceSelection = z.infer<typeof audienceSelection>;
