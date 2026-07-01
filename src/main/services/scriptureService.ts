import { bibleRepository } from '../db/repositories/bibleRepository';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { loadBibleBundles } from './bibleBundle';
import { parseReference } from './scriptureReference';
import log from '../infra/logger';
import { DEFAULT_TRANSLATION_KEY } from '@/shared/schemas/scripture';
import type {
  BibleBook,
  BibleSearchResult,
  BibleTranslation,
  BibleVerse,
  ScriptureReference,
} from '@/shared/schemas/scripture';

// Thin scripture service: delegates to the repository + the pure reference
// parser (CLAUDE.md §5). Hydration loads every bundled translation into SQLite
// once, idempotently, on app start. Every read is scoped to the active
// translation — the one persisted under DEFAULT_TRANSLATION_KEY (Settings →
// Bible), falling back to the first installed translation.

export function hydrateScripture(): void {
  try {
    const bundles = loadBibleBundles();
    let anyLoaded = false;
    for (const bundle of bundles) {
      // Defer the FTS rebuild — do it once after all translations are loaded.
      const loaded = bibleRepository.hydrate(bundle, { rebuildFts: false });
      if (loaded) {
        anyLoaded = true;
        log.info(`Scripture hydrated: ${bundle.translation} (${bundle.verses.length} verses).`);
      }
    }
    if (anyLoaded) bibleRepository.rebuildFts();

    // Seed the default translation on first run so every surface (service reads,
    // the Scripture pane chip, Settings → Bible) agrees on WEB until the user
    // chooses otherwise. Idempotent: only writes when unset.
    if (!settingsRepository.get(DEFAULT_TRANSLATION_KEY)) {
      const seed =
        bibleRepository.getTranslationId('WEB') !== null
          ? 'WEB'
          : (bibleRepository.listTranslations()[0]?.abbreviation ?? null);
      if (seed) settingsRepository.set(DEFAULT_TRANSLATION_KEY, seed);
    }
  } catch (e) {
    // Hydration failure must not kill app start; scripture features degrade but
    // the rest of the app keeps running (CLAUDE.md §5.7).
    log.error('Scripture hydration failed:', e);
  }
}

// The translation id every read is scoped to: the stored default, else the
// first installed translation. Null when nothing is hydrated (reads degrade to
// empty results rather than throwing).
function activeTranslationId(): number | null {
  const stored = settingsRepository.get(DEFAULT_TRANSLATION_KEY);
  const id = stored ? bibleRepository.getTranslationId(stored) : null;
  return id ?? bibleRepository.getDefaultTranslationId();
}

export const scriptureService = {
  listTranslations: (): BibleTranslation[] => bibleRepository.listTranslations(),
  listBooks: (): BibleBook[] => {
    const id = activeTranslationId();
    return id === null ? [] : bibleRepository.listBooks(id);
  },

  // Parse the free-text reference (pure) → fetch verses (repo). Empty array when
  // the reference can't be resolved.
  lookupReference: (query: string): BibleVerse[] => {
    const ref = parseReference(query);
    const id = activeTranslationId();
    if (!ref || id === null) return [];
    return bibleRepository.lookupReference(id, ref);
  },

  // Browse a whole chapter (book → chapter → verses).
  getChapter: (bookNumber: number, chapter: number): BibleVerse[] => {
    const id = activeTranslationId();
    return id === null ? [] : bibleRepository.getChapter(id, bookNumber, chapter);
  },

  // Resolve an already-parsed reference (used by the AI detector, which produces
  // structured refs). Empty array when the passage doesn't exist (precision).
  resolve: (ref: ScriptureReference): BibleVerse[] => {
    const id = activeTranslationId();
    return id === null ? [] : bibleRepository.lookupReference(id, ref);
  },

  searchKeyword: (query: string, limit: number): BibleSearchResult[] => {
    const id = activeTranslationId();
    return id === null ? [] : bibleRepository.searchKeyword(id, query, limit);
  },
};
