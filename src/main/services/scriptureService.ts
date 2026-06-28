import { bibleRepository } from '../db/repositories/bibleRepository';
import { loadBibleBundle } from './bibleBundle';
import { parseReference } from './scriptureReference';
import log from '../infra/logger';
import type {
  BibleBook,
  BibleSearchResult,
  BibleTranslation,
  BibleVerse,
} from '@/shared/schemas/scripture';

// Thin scripture service: delegates to the repository + the pure reference
// parser (CLAUDE.md §5). Hydration loads the bundled WEB dataset into SQLite
// once, idempotently, on app start.

export function hydrateScripture(): void {
  try {
    const bundle = loadBibleBundle();
    const loaded = bibleRepository.hydrate(bundle);
    if (loaded) {
      log.info(`Scripture hydrated: ${bundle.translation} (${bundle.verses.length} verses).`);
    }
  } catch (e) {
    // Hydration failure must not kill app start; scripture features degrade but
    // the rest of the app keeps running (CLAUDE.md §5.7).
    log.error('Scripture hydration failed:', e);
  }
}

export const scriptureService = {
  listTranslations: (): BibleTranslation[] => bibleRepository.listTranslations(),
  listBooks: (): BibleBook[] => bibleRepository.listBooks(),

  // Parse the free-text reference (pure) → fetch verses (repo). Empty array when
  // the reference can't be resolved.
  lookupReference: (query: string): BibleVerse[] => {
    const ref = parseReference(query);
    if (!ref) return [];
    return bibleRepository.lookupReference(ref);
  },

  // Browse a whole chapter (book → chapter → verses).
  getChapter: (bookNumber: number, chapter: number): BibleVerse[] =>
    bibleRepository.getChapter(bookNumber, chapter),

  searchKeyword: (query: string, limit: number): BibleSearchResult[] =>
    bibleRepository.searchKeyword(query, limit),
};
