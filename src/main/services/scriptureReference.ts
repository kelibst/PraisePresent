import type { ScriptureReference } from '@/shared/schemas/scripture';

// PURE scripture-reference parser (no DB / electron — Vitest-testable without
// the native binary, CLAUDE.md §5.5/§5.8). Resolves a free-text reference like
// "John 3:16", "Gen 1:1-3", "Psalm 23", or "1 John 2:1-5" to a normalized
// { bookNumber, chapter, verseStart, verseEnd }. Also formats the canonical
// label for a verse and chunks long passages for projection.

// Canonical book table (number → name) plus accepted aliases. Aliases cover the
// full name, the OSIS abbreviation, and common short forms. All matching is
// case-insensitive and whitespace-insensitive ("1John" === "1 John").
export type BookDef = { number: number; name: string; aliases: string[] };

// Exported so the AI detector (scriptureDetect.ts) reuses ONE book table —
// detection sits in front of this parser, it does not duplicate Bible data.
export const BOOKS: BookDef[] = [
  { number: 1, name: 'Genesis', aliases: ['gen', 'ge', 'gn'] },
  { number: 2, name: 'Exodus', aliases: ['exod', 'exo', 'ex'] },
  { number: 3, name: 'Leviticus', aliases: ['lev', 'le', 'lv'] },
  { number: 4, name: 'Numbers', aliases: ['num', 'nu', 'nm', 'nb'] },
  { number: 5, name: 'Deuteronomy', aliases: ['deut', 'deu', 'dt'] },
  { number: 6, name: 'Joshua', aliases: ['josh', 'jos', 'jsh'] },
  { number: 7, name: 'Judges', aliases: ['judg', 'jdg', 'jg', 'jdgs'] },
  { number: 8, name: 'Ruth', aliases: ['ruth', 'rth', 'ru'] },
  { number: 9, name: '1 Samuel', aliases: ['1sam', '1sa', '1s', '1samuel'] },
  { number: 10, name: '2 Samuel', aliases: ['2sam', '2sa', '2s', '2samuel'] },
  { number: 11, name: '1 Kings', aliases: ['1kgs', '1ki', '1k', '1kings'] },
  { number: 12, name: '2 Kings', aliases: ['2kgs', '2ki', '2k', '2kings'] },
  { number: 13, name: '1 Chronicles', aliases: ['1chr', '1ch', '1chronicles'] },
  { number: 14, name: '2 Chronicles', aliases: ['2chr', '2ch', '2chronicles'] },
  { number: 15, name: 'Ezra', aliases: ['ezra', 'ezr', 'ez'] },
  { number: 16, name: 'Nehemiah', aliases: ['neh', 'ne'] },
  { number: 17, name: 'Esther', aliases: ['esth', 'est', 'es'] },
  { number: 18, name: 'Job', aliases: ['job', 'jb'] },
  { number: 19, name: 'Psalms', aliases: ['ps', 'psa', 'psalm', 'pss', 'psalms'] },
  { number: 20, name: 'Proverbs', aliases: ['prov', 'pro', 'prv', 'pr'] },
  { number: 21, name: 'Ecclesiastes', aliases: ['eccl', 'ecc', 'ec', 'qoh'] },
  {
    number: 22,
    name: 'Song of Solomon',
    aliases: ['song', 'sos', 'so', 'songofsongs', 'canticles', 'cant'],
  },
  { number: 23, name: 'Isaiah', aliases: ['isa', 'is'] },
  { number: 24, name: 'Jeremiah', aliases: ['jer', 'je', 'jr'] },
  { number: 25, name: 'Lamentations', aliases: ['lam', 'la'] },
  { number: 26, name: 'Ezekiel', aliases: ['ezek', 'eze', 'ezk'] },
  { number: 27, name: 'Daniel', aliases: ['dan', 'da', 'dn'] },
  { number: 28, name: 'Hosea', aliases: ['hos', 'ho'] },
  { number: 29, name: 'Joel', aliases: ['joel', 'joe', 'jl'] },
  { number: 30, name: 'Amos', aliases: ['amos', 'amo', 'am'] },
  { number: 31, name: 'Obadiah', aliases: ['obad', 'oba', 'ob'] },
  { number: 32, name: 'Jonah', aliases: ['jonah', 'jon', 'jnh'] },
  { number: 33, name: 'Micah', aliases: ['mic', 'mi'] },
  { number: 34, name: 'Nahum', aliases: ['nah', 'na'] },
  { number: 35, name: 'Habakkuk', aliases: ['hab', 'hb'] },
  { number: 36, name: 'Zephaniah', aliases: ['zeph', 'zep', 'zp'] },
  { number: 37, name: 'Haggai', aliases: ['hag', 'hg'] },
  { number: 38, name: 'Zechariah', aliases: ['zech', 'zec', 'zc'] },
  { number: 39, name: 'Malachi', aliases: ['mal', 'ml'] },
  { number: 40, name: 'Matthew', aliases: ['matt', 'mat', 'mt'] },
  { number: 41, name: 'Mark', aliases: ['mark', 'mrk', 'mk', 'mr'] },
  { number: 42, name: 'Luke', aliases: ['luke', 'luk', 'lk'] },
  { number: 43, name: 'John', aliases: ['john', 'joh', 'jn', 'jhn'] },
  { number: 44, name: 'Acts', aliases: ['acts', 'act', 'ac'] },
  { number: 45, name: 'Romans', aliases: ['rom', 'ro', 'rm'] },
  { number: 46, name: '1 Corinthians', aliases: ['1cor', '1co', '1corinthians'] },
  { number: 47, name: '2 Corinthians', aliases: ['2cor', '2co', '2corinthians'] },
  { number: 48, name: 'Galatians', aliases: ['gal', 'ga'] },
  { number: 49, name: 'Ephesians', aliases: ['eph', 'ephes'] },
  { number: 50, name: 'Philippians', aliases: ['phil', 'php', 'pp'] },
  { number: 51, name: 'Colossians', aliases: ['col', 'co'] },
  { number: 52, name: '1 Thessalonians', aliases: ['1thess', '1th', '1thes', '1thessalonians'] },
  { number: 53, name: '2 Thessalonians', aliases: ['2thess', '2th', '2thes', '2thessalonians'] },
  { number: 54, name: '1 Timothy', aliases: ['1tim', '1ti', '1timothy'] },
  { number: 55, name: '2 Timothy', aliases: ['2tim', '2ti', '2timothy'] },
  { number: 56, name: 'Titus', aliases: ['titus', 'tit', 'ti'] },
  { number: 57, name: 'Philemon', aliases: ['phlm', 'phm', 'philem'] },
  { number: 58, name: 'Hebrews', aliases: ['heb', 'hebr'] },
  { number: 59, name: 'James', aliases: ['jas', 'jm', 'james'] },
  { number: 60, name: '1 Peter', aliases: ['1pet', '1pe', '1pt', '1peter'] },
  { number: 61, name: '2 Peter', aliases: ['2pet', '2pe', '2pt', '2peter'] },
  { number: 62, name: '1 John', aliases: ['1john', '1jn', '1jo', '1jhn'] },
  { number: 63, name: '2 John', aliases: ['2john', '2jn', '2jo', '2jhn'] },
  { number: 64, name: '3 John', aliases: ['3john', '3jn', '3jo', '3jhn'] },
  { number: 65, name: 'Jude', aliases: ['jude', 'jud', 'jd'] },
  {
    number: 66,
    name: 'Revelation',
    aliases: ['rev', 're', 'rv', 'revelation', 'apocalypse', 'apoc'],
  },
];

// Build a lookup: normalized alias/name (lowercased, no spaces/periods) → number.
const NAME_INDEX = new Map<string, number>();
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[\s.]/g, '');
}
for (const b of BOOKS) {
  NAME_INDEX.set(normalizeName(b.name), b.number);
  for (const a of b.aliases) NAME_INDEX.set(normalizeName(a), b.number);
}

const BOOK_BY_NUMBER = new Map<number, string>(BOOKS.map((b) => [b.number, b.name]));

export function bookName(bookNumber: number): string | null {
  return BOOK_BY_NUMBER.get(bookNumber) ?? null;
}

// Resolve a book token (which may include a leading numeral, e.g. "1 John") to
// its canonical number, or null if unknown.
function resolveBook(token: string): number | null {
  return NAME_INDEX.get(normalizeName(token)) ?? null;
}

// Parse "John 3:16", "Gen 1:1-3", "Psalm 23", "1 John 2:1-5". Returns null if
// the reference can't be resolved. Whole-chapter refs (no verse) yield
// verseStart=null, verseEnd=null. A single verse yields verseStart=verseEnd.
export function parseReference(input: string): ScriptureReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Split into "<book part> <numeric part>". The book part is everything up to
  // the last whitespace before the first chapter digit. Books may start with a
  // leading numeral (1/2/3), so anchor on the chapter:verse tail.
  const m = trimmed.match(/^(.*?)\s*(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?\s*$/);
  if (!m) return null;

  const bookToken = m[1].trim();
  if (!bookToken) return null;
  const bookNumber = resolveBook(bookToken);
  if (bookNumber === null) return null;

  const chapter = Number(m[2]);
  if (!Number.isInteger(chapter) || chapter < 1) return null;

  const verseStart = m[3] !== undefined ? Number(m[3]) : null;
  let verseEnd = m[4] !== undefined ? Number(m[4]) : verseStart;

  if (verseStart !== null && (!Number.isInteger(verseStart) || verseStart < 1)) return null;
  if (verseEnd !== null && (!Number.isInteger(verseEnd) || verseEnd < 1)) return null;
  // Normalize a reversed range (3:16-10 typos) to a single verse.
  if (verseStart !== null && verseEnd !== null && verseEnd < verseStart) verseEnd = verseStart;

  return { bookNumber, chapter, verseStart, verseEnd };
}

// Canonical label for a single verse, e.g. "John 3:16".
export function formatReference(bookNumber: number, chapter: number, verse: number): string {
  const name = bookName(bookNumber) ?? `Book ${bookNumber}`;
  return `${name} ${chapter}:${verse}`;
}
