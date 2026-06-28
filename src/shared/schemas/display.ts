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

export type DisplayInfo = z.infer<typeof displayInfo>;
export type AudienceSelection = z.infer<typeof audienceSelection>;
