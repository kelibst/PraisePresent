import { z } from 'zod';

// Media domain schemas (CLAUDE.md §5.1/§5.3). The library REFERENCES files by
// their original absolute path (no copy) — a missing/moved file fails safe to
// black on the audience, never a crash (§5.7). Files are served to the audience
// window only through the DB-allowlisted `app-media://` protocol (main-side).

export const mediaKind = z.enum(['image', 'video', 'audio']);

export const mediaItem = z.object({
  id: z.number().int().positive(),
  name: z.string(), // display name (file basename by default)
  path: z.string().min(1), // original absolute path on disk
  kind: mediaKind,
  createdAt: z.string(),
});

// IPC inputs. `add` registers already-known paths (the file-dialog picker and a
// future drag-drop both funnel through it); `import` opens the OS picker in main.
export const mediaAdd = z.object({
  paths: z.array(z.string().min(1)).min(1),
});
export const mediaId = z.object({ id: z.number().int().positive() });

export type MediaKind = z.infer<typeof mediaKind>;
export type MediaItem = z.infer<typeof mediaItem>;
export type MediaAdd = z.infer<typeof mediaAdd>;
export type MediaId = z.infer<typeof mediaId>;
