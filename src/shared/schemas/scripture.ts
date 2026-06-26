import { z } from 'zod';

// Scripture domain schemas (CLAUDE.md §5.1/§5.3). The bundled text is the World
// English Bible (public domain). A reference normalizes to a book number + a
// chapter + a verse range; search returns flat verse rows. Every payload that
// crosses IPC is validated against these.

export const bibleTranslation = z.object({
  id: z.number().int().positive(),
  abbreviation: z.string(),
  name: z.string(),
  license: z.string(),
});

export const bibleBook = z.object({
  number: z.number().int().min(1).max(66),
  name: z.string(),
  abbreviation: z.string(),
  osisId: z.string(),
  testament: z.enum(['OT', 'NT']),
});

export const bibleVerse = z.object({
  bookNumber: z.number().int().min(1).max(66),
  bookName: z.string(),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  text: z.string(),
});

// A parsed/normalized reference. verseEnd null = whole chapter or single verse.
export const scriptureReference = z.object({
  bookNumber: z.number().int().min(1).max(66),
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive().nullable(),
  verseEnd: z.number().int().positive().nullable(),
});

// IPC inputs.
export const referenceLookup = z.object({ query: z.string().min(1) });
export const keywordSearch = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(200).default(50),
});

// A keyword hit carries the verse plus its canonical reference label.
export const bibleSearchResult = bibleVerse.extend({
  reference: z.string(), // e.g. "John 3:16"
});

export type BibleTranslation = z.infer<typeof bibleTranslation>;
export type BibleBook = z.infer<typeof bibleBook>;
export type BibleVerse = z.infer<typeof bibleVerse>;
export type ScriptureReference = z.infer<typeof scriptureReference>;
export type ReferenceLookup = z.infer<typeof referenceLookup>;
export type KeywordSearch = z.infer<typeof keywordSearch>;
export type BibleSearchResult = z.infer<typeof bibleSearchResult>;
