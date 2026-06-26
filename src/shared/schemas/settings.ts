import { z } from 'zod';

// Settings payload schemas. Validated at the main-process boundary (the
// renderer is never trusted — CLAUDE.md §5.3). Values are strings for now;
// callers serialize richer values.
export const settingsGetRequest = z.object({
  key: z.string().min(1),
});

export const settingsSetRequest = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export type SettingsGetRequest = z.infer<typeof settingsGetRequest>;
export type SettingsSetRequest = z.infer<typeof settingsSetRequest>;
