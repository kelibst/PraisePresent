import { getDb } from '../connection';
import { formatReference } from '../../services/scriptureReference';
import type { BibleBundle } from '../../services/bibleBundle';
import type {
  BibleBook,
  BibleTranslation,
  BibleVerse,
  BibleSearchResult,
  ScriptureReference,
} from '@/shared/schemas/scripture';

// All Bible DB access behind this repository (CLAUDE.md §5.5); parameterized
// queries only. Hydration loads the bundled WEB dataset once, in a single
// transaction (31k verses). FTS5 keyword search is ranked by bm25.

type TranslationRow = { id: number; abbreviation: string; name: string; license: string };
type BookRow = {
  number: number;
  name: string;
  abbreviation: string;
  osis_id: string;
  testament: string;
  chapter_count: number;
};
type VerseRow = {
  book_number: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

function mapBook(r: BookRow): BibleBook {
  return {
    number: r.number,
    name: r.name,
    abbreviation: r.abbreviation,
    osisId: r.osis_id,
    testament: r.testament as BibleBook['testament'],
    chapterCount: r.chapter_count,
  };
}

function mapVerse(r: VerseRow): BibleVerse {
  return {
    bookNumber: r.book_number,
    bookName: r.book_name,
    chapter: r.chapter,
    verse: r.verse,
    text: r.text,
  };
}

export const bibleRepository = {
  // Idempotent: skip if the translation is already hydrated. Returns true if it
  // performed the load, false if it was already present.
  hydrate(bundle: BibleBundle): boolean {
    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM bible_translations WHERE abbreviation = ?')
      .get(bundle.abbreviation) as { id: number } | undefined;
    if (existing) {
      const count = db
        .prepare('SELECT COUNT(*) AS n FROM bible_verses WHERE translation_id = ?')
        .get(existing.id) as { n: number };
      if (count.n === bundle.verses.length) return false; // fully hydrated already
    }

    const tx = db.transaction(() => {
      const insTranslation = db.prepare(
        'INSERT INTO bible_translations (abbreviation, name, license) VALUES (?, ?, ?) ON CONFLICT(abbreviation) DO UPDATE SET name = excluded.name, license = excluded.license RETURNING id',
      );
      const { id: translationId } = insTranslation.get(
        bundle.abbreviation,
        bundle.translation,
        bundle.license,
      ) as { id: number };

      const insBook = db.prepare(
        'INSERT INTO bible_books (number, name, abbreviation, osis_id, testament) VALUES (?, ?, ?, ?, ?) ON CONFLICT(number) DO NOTHING',
      );
      for (const b of bundle.books) {
        insBook.run(b.number, b.name, b.abbreviation, b.osisId, b.testament);
      }

      // Clear any partial prior load for this translation, then bulk-insert.
      db.prepare('DELETE FROM bible_verses WHERE translation_id = ?').run(translationId);
      const insVerse = db.prepare(
        'INSERT INTO bible_verses (translation_id, book_number, chapter, verse, text) VALUES (?, ?, ?, ?, ?)',
      );
      for (const [bookNumber, chapter, verse, text] of bundle.verses) {
        insVerse.run(translationId, bookNumber, chapter, verse, text);
      }

      // Rebuild the external-content FTS index from the freshly loaded verses.
      db.prepare("INSERT INTO bible_verses_fts(bible_verses_fts) VALUES ('rebuild')").run();
    });
    tx();
    return true;
  },

  listTranslations(): BibleTranslation[] {
    const rows = getDb()
      .prepare('SELECT id, abbreviation, name, license FROM bible_translations ORDER BY name')
      .all() as TranslationRow[];
    return rows.map((r) => ({
      id: r.id,
      abbreviation: r.abbreviation,
      name: r.name,
      license: r.license,
    }));
  },

  listBooks(): BibleBook[] {
    // chapter_count derived from the verses of the default/first translation so
    // the browser can render the right number of chapter buttons per book.
    const rows = getDb()
      .prepare(
        `SELECT b.number, b.name, b.abbreviation, b.osis_id, b.testament,
                COALESCE((SELECT MAX(v.chapter) FROM bible_verses v WHERE v.book_number = b.number), 0)
                  AS chapter_count
           FROM bible_books b
          ORDER BY b.number`,
      )
      .all() as BookRow[];
    return rows.map(mapBook);
  },

  // Whole chapter in verse order (book → chapter → verses) for the browser.
  // Mirrors lookupReference's whole-chapter path but with explicit args.
  getChapter(bookNumber: number, chapter: number): BibleVerse[] {
    const rows = getDb()
      .prepare(
        `SELECT v.book_number, b.name AS book_name, v.chapter, v.verse, v.text
           FROM bible_verses v JOIN bible_books b ON b.number = v.book_number
          WHERE v.book_number = ? AND v.chapter = ?
          ORDER BY v.verse`,
      )
      .all(bookNumber, chapter) as VerseRow[];
    return rows.map(mapVerse);
  },

  // Resolve a normalized reference to its verses (whole chapter when verseStart
  // is null). Uses the first/default translation.
  lookupReference(ref: ScriptureReference): BibleVerse[] {
    const db = getDb();
    if (ref.verseStart === null) {
      const rows = db
        .prepare(
          `SELECT v.book_number, b.name AS book_name, v.chapter, v.verse, v.text
             FROM bible_verses v JOIN bible_books b ON b.number = v.book_number
            WHERE v.book_number = ? AND v.chapter = ?
            ORDER BY v.verse`,
        )
        .all(ref.bookNumber, ref.chapter) as VerseRow[];
      return rows.map(mapVerse);
    }
    const end = ref.verseEnd ?? ref.verseStart;
    const rows = db
      .prepare(
        `SELECT v.book_number, b.name AS book_name, v.chapter, v.verse, v.text
           FROM bible_verses v JOIN bible_books b ON b.number = v.book_number
          WHERE v.book_number = ? AND v.chapter = ? AND v.verse BETWEEN ? AND ?
          ORDER BY v.verse`,
      )
      .all(ref.bookNumber, ref.chapter, ref.verseStart, end) as VerseRow[];
    return rows.map(mapVerse);
  },

  // FTS5 keyword search ranked by bm25 (lower = better). The query is passed as
  // a bound parameter; FTS5 treats it as a MATCH expression.
  searchKeyword(query: string, limit: number): BibleSearchResult[] {
    const match = toFtsQuery(query);
    if (!match) return [];
    const rows = getDb()
      .prepare(
        `SELECT v.book_number, b.name AS book_name, v.chapter, v.verse, v.text
           FROM bible_verses_fts f
           JOIN bible_verses v ON v.id = f.rowid
           JOIN bible_books b ON b.number = v.book_number
          WHERE bible_verses_fts MATCH ?
          ORDER BY bm25(bible_verses_fts)
          LIMIT ?`,
      )
      .all(match, limit) as VerseRow[];
    return rows.map((r) => ({
      ...mapVerse(r),
      reference: formatReference(r.book_number, r.chapter, r.verse),
    }));
  },
};

// Sanitize free-text into a safe FTS5 MATCH expression: keep word tokens, AND
// them together (all terms must appear). Stripping FTS operators avoids syntax
// errors from stray punctuation in user input.
function toFtsQuery(raw: string): string {
  const terms = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return terms.join(' AND ');
}
