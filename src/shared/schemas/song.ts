import { z } from 'zod';

// Song domain schemas (CLAUDE.md §5.1/§5.3). A song has metadata + ordered
// sections (verse/chorus/bridge…). The arrangement is the sections' sortOrder.
export const songSectionKind = z.enum([
  'verse',
  'chorus',
  'bridge',
  'intro',
  'outro',
  'prechorus',
  'tag',
  'other',
]);

export const songSection = z.object({
  kind: songSectionKind,
  label: z.string(),
  content: z.string(),
  sortOrder: z.number().int().nonnegative(),
});

export const song = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  author: z.string(),
  ccli: z.string(),
  tags: z.array(z.string()),
  sections: z.array(songSection),
});

export const songSummary = song.omit({ sections: true });
export const songCreate = song.omit({ id: true });
export const songId = z.object({ id: z.number().int().positive() });
export const songImportText = z.object({
  title: z.string().min(1),
  author: z.string().default(''),
  text: z.string(),
});

export type SongSectionKind = z.infer<typeof songSectionKind>;
export type SongSection = z.infer<typeof songSection>;
export type Song = z.infer<typeof song>;
export type SongSummary = z.infer<typeof songSummary>;
export type SongCreate = z.infer<typeof songCreate>;
export type SongImportText = z.infer<typeof songImportText>;
