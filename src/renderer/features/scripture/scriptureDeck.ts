import type { PresentSlide } from '@/shared/schemas/present';
import type { BibleVerse } from '@/shared/schemas/scripture';

// Pure helpers shared across the Scripture screen panes (CLAUDE.md §5.1 — pure
// functions, no side effects, no window.api). A "staged" verse is a BibleVerse
// the operator has lined up; we project it as a one-verse-per-slide deck so
// present.next()/prev() walk the verses (matching the existing D2 semantics the
// scripture e2e relies on).

/** Canonical reference label for a single verse, e.g. "John 3:16". */
export function referenceLabel(v: BibleVerse): string {
  return `${v.bookName} ${v.chapter}:${v.verse}`;
}

/** Stable per-verse id used as the slide id and as a React/staging key. */
export function verseId(v: BibleVerse): string {
  return `${v.bookNumber}-${v.chapter}-${v.verse}`;
}

/** One projectable slide per verse, each carrying its own reference label. */
export function versesToDeck(verses: BibleVerse[]): PresentSlide[] {
  return verses.map((v) => ({
    id: verseId(v),
    lines: [v.text],
    reference: referenceLabel(v),
  }));
}

/**
 * Compact range label for a list of verses, e.g. "John 3:16–18" or "John 3:16"
 * for a single verse. Assumes a contiguous, single-book/chapter passage (what
 * lookupReference returns); falls back to the first verse's label otherwise.
 */
export function rangeLabel(verses: BibleVerse[]): string {
  if (verses.length === 0) return '';
  const first = verses[0];
  const last = verses[verses.length - 1];
  if (verses.length === 1) return referenceLabel(first);
  const sameBookChapter = first.bookNumber === last.bookNumber && first.chapter === last.chapter;
  if (sameBookChapter) {
    return `${first.bookName} ${first.chapter}:${first.verse}–${last.verse}`;
  }
  return `${referenceLabel(first)}–${referenceLabel(last)}`;
}

/**
 * Split keyword-match text around the searched term so the UI can mark the hit.
 * Pure string work; case-insensitive, returns the original text as a single
 * segment when there is no match. `match` is false for the surrounding text.
 */
export type HitSegment = { text: string; match: boolean };

export function highlightSegments(text: string, query: string): HitSegment[] {
  const term = query.trim();
  if (!term) return [{ text, match: false }];
  // Match whole words of the query, longest first, so "love" highlights inside
  // a verse without escaping regex metacharacters from user input.
  const words = Array.from(new Set(term.split(/\s+/).filter(Boolean)))
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (words.length === 0) return [{ text, match: false }];
  const re = new RegExp(`(${words.join('|')})`, 'gi');
  const out: HitSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: text.slice(last, start), match: false });
    out.push({ text: m[0], match: true });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false });
  return out.length ? out : [{ text, match: false }];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
