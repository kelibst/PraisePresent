import { BOOKS } from './scriptureReference';
import type { ScriptureReference } from '@/shared/schemas/scripture';

// PURE deterministic scripture-reference DETECTOR (CLAUDE.md §5.5/§5.8 — no DB /
// electron, fully unit-testable). It finds references inside free text (typed or
// transcribed): explicit ("turn to John 3:16"), spoken-number ("John three
// sixteen", "Romans eight twenty-eight"), and book+chapter ("Psalm 23"). It only
// proposes CANDIDATES — actual verse existence is confirmed by resolving through
// the Phase 3 scriptureService (this module never touches Bible data, only the
// shared book table). Spec §4.2. Never throws on junk input (§5.7).

export type DetectedReference = {
  ref: ScriptureReference;
  canonical: string; // "John 3:16" / "Psalm 23"
  triggerText: string; // the matched span from the source text
  type: 'explicit' | 'book_chapter';
  confidence: number; // 0..1
};

// --- spoken-number normalization ------------------------------------------

const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};
const TEENS: Record<string, number> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

type NumWord = { value: number; kind: 'unit' | 'teen' | 'ten' | 'hundred' };
function numWord(token: string): NumWord | null {
  if (token in UNITS) return { value: UNITS[token], kind: 'unit' };
  if (token in TEENS) return { value: TEENS[token], kind: 'teen' };
  if (token in TENS) return { value: TENS[token], kind: 'ten' };
  if (token === 'hundred') return { value: 100, kind: 'hundred' };
  return null;
}

// Collapse a run of number-words into one or more integers. Bible numbers are
// spoken as grouped digits — "three sixteen" → [3, 16] (chapter:verse), while
// "twenty eight" → [28] and "one hundred nineteen" → [119].
function parseNumberRun(words: NumWord[]): number[] {
  const out: number[] = [];
  let cur: number | null = null;
  const flush = () => {
    if (cur !== null) out.push(cur);
    cur = null;
  };
  for (const w of words) {
    if (w.kind === 'hundred') {
      cur = (cur ?? 1) * 100;
    } else if (w.kind === 'ten') {
      if (cur !== null && cur % 100 === 0 && cur > 0)
        cur += w.value; // one hundred seventy
      else {
        flush();
        cur = w.value;
      }
    } else if (w.kind === 'teen') {
      if (cur !== null && cur % 100 === 0 && cur > 0)
        cur += w.value; // one hundred sixteen
      else {
        flush();
        cur = w.value;
      }
    } else {
      // unit
      if (cur !== null && cur % 10 === 0 && cur > 0)
        cur += w.value; // twenty + eight, one hundred seventy + six
      else {
        flush();
        cur = w.value;
      }
    }
  }
  flush();
  return out;
}

// Replace number-word runs in free text with digit groups (space-separated), so
// "john three sixteen" becomes "john 3 16". Hyphens in "twenty-eight" are split.
export function wordsToNumbers(text: string): string {
  const tokens = text.split(/(\s+|-)/); // keep separators to rebuild spacing
  const result: string[] = [];
  let run: NumWord[] = [];
  // Separator seen while a run is open. Dropped if the next token continues the
  // run (numbers merge); re-emitted if the run ends at a non-number token, so we
  // never glue a number to the following word ("8 verse", not "8verse").
  let pendingSep = '';
  const flushRun = () => {
    if (run.length) {
      result.push(parseNumberRun(run).join(' '));
      run = [];
    }
  };
  for (const tok of tokens) {
    if (/^\s+$/.test(tok) || tok === '-') {
      if (run.length === 0) result.push(tok);
      else pendingSep = ' ';
      continue;
    }
    // Strip surrounding punctuation ("sixteen," / "(eight)") before the lookup
    // so attached commas/parens don't hide a spoken number.
    const nw = numWord(tok.toLowerCase().replace(/[^a-z]/g, ''));
    if (nw) {
      run.push(nw);
      pendingSep = ''; // consecutive number words merge — drop the separator
    } else {
      flushRun();
      if (pendingSep) {
        result.push(pendingSep);
        pendingSep = '';
      }
      result.push(tok);
    }
  }
  flushRun();
  if (pendingSep) result.push(pendingSep);
  return result.join('');
}

// --- book matching (reuse the shared table) -------------------------------

// One normalized phrase → book number. Built from canonical names + aliases +
// spoken numeral prefixes for the 1/2/3-numbered books ("first john", "1 john").
const PREFIX_WORDS: Record<string, string[]> = {
  '1': ['1', 'first', 'i'],
  '2': ['2', 'second', 'ii'],
  '3': ['3', 'third', 'iii'],
};
// Aliases that are also common English words — they cause false positives when
// matching free PROSE ("she is 16" → Isaiah 16, "so 2 came" → Song 2). Excluded
// from DETECTION only; the parser (scriptureReference) still accepts them for the
// explicit Scripture search, where the whole input is known to be a reference.
const DETECTOR_STOPWORDS = new Set([
  'is', // Isaiah
  'so', // Song of Solomon
  'am', // Amos
  're', // Revelation
  'ex', // Exodus
  'ne', // Nehemiah
  'ho', // Hosea
  'na', // Nahum
  'ru', // Ruth
  'ti', // Titus
  'mi', // Micah
  'ob', // Obadiah
]);

const phraseToBook = new Map<string, number>();
function addPhrase(phrase: string, num: number) {
  phraseToBook.set(phrase.toLowerCase().replace(/\s+/g, ' ').trim(), num);
}
for (const b of BOOKS) {
  addPhrase(b.name, b.number);
  for (const a of b.aliases) {
    if (DETECTOR_STOPWORDS.has(a)) continue;
    addPhrase(a, b.number);
  }
  const m = b.name.match(/^([123])\s+(.*)$/);
  if (m) {
    const rest = m[2];
    for (const p of PREFIX_WORDS[m[1]]) {
      addPhrase(`${p} ${rest}`, b.number);
      addPhrase(`${p}${rest}`, b.number);
    }
  }
}

// Longest phrases first so "song of solomon" wins over "song", "1 john" over "john".
const BOOK_ALT = [...phraseToBook.keys()]
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

// <book> [chapter] [(:|.|verse|space) verse] [(-|to|through) verseEnd]
const REF_RE = new RegExp(
  `\\b(${BOOK_ALT})\\b[\\s.]*(?:chapters?\\s+)?(\\d{1,3})` +
    `(?:\\s*[:.]\\s*|\\s+verses?\\s+|\\s+)?(\\d{1,3})?` +
    `(?:\\s*(?:[-–]|to|thru|through)\\s*(\\d{1,3}))?`,
  'gi',
);

// --- public API -----------------------------------------------------------

// Hard ceiling on candidates from one submission — a sermon passage won't cite
// more, and it bounds the downstream DB fan-out for pathological input (§5.7).
const MAX_CANDIDATES = 100;

export function detectReferences(rawText: string): DetectedReference[] {
  if (!rawText || !rawText.trim()) return [];
  const text = wordsToNumbers(rawText);
  const out: DetectedReference[] = [];
  const seen = new Set<string>();

  for (const m of text.matchAll(REF_RE)) {
    if (out.length >= MAX_CANDIDATES) break;
    const bookNumber = phraseToBook.get(m[1].toLowerCase().replace(/\s+/g, ' ').trim());
    if (bookNumber === undefined) continue;
    const chapter = Number(m[2]);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) continue;

    let verseStart = m[3] !== undefined ? Number(m[3]) : null;
    let verseEnd = m[4] !== undefined ? Number(m[4]) : verseStart;
    if (verseStart !== null && (verseStart < 1 || verseStart > 176)) verseStart = null;
    if (verseStart === null) verseEnd = null; // a range with no start is meaningless
    if (verseEnd !== null && (verseEnd < 1 || verseEnd > 176)) verseEnd = verseStart;
    if (verseStart !== null && verseEnd !== null && verseEnd < verseStart) verseEnd = verseStart;

    const ref: ScriptureReference = { bookNumber, chapter, verseStart, verseEnd };
    const bookLabel = BOOKS.find((b) => b.number === bookNumber)!.name;
    const canonical =
      verseStart === null
        ? `${bookLabel} ${chapter}`
        : verseEnd && verseEnd !== verseStart
          ? `${bookLabel} ${chapter}:${verseStart}-${verseEnd}`
          : `${bookLabel} ${chapter}:${verseStart}`;

    const key = `${bookNumber}-${chapter}-${verseStart ?? 'x'}-${verseEnd ?? 'x'}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      ref,
      canonical,
      triggerText: m[0].trim(),
      type: verseStart === null ? 'book_chapter' : 'explicit',
      // Explicit verse refs are high-confidence; bare book+chapter is lower
      // because a book word ("John", "Mark") may just be a name in prose.
      confidence: verseStart === null ? 0.55 : 0.9,
    });
  }
  return out;
}
