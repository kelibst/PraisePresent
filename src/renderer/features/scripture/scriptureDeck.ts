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

/**
 * One projectable slide per verse, each carrying its own reference label. Every
 * scripture slide is `locked: true` — the displayed verse text is read-only
 * (translation integrity), enforced in both the UI and main (§5.3).
 */
export function versesToDeck(verses: BibleVerse[]): PresentSlide[] {
  return verses.map((v) => ({
    id: verseId(v),
    lines: [v.text],
    reference: referenceLabel(v),
    locked: true,
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

/** A selected verse range within a chapter (from..to inclusive). */
export type VerseRange = { from: number; to: number };

/**
 * Parse a verse-zone string ("15", "16-18", "") into the selected verse range,
 * or null for a whole-chapter / empty selection. A reversed range ("18-16")
 * collapses to a single verse (matching the reference parser, which normalizes
 * verseEnd < verseStart to verseStart).
 */
export function parseVerseRange(v: string): VerseRange | null {
  const m = v.trim().match(/^(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  const from = Number(m[1]);
  const to = m[2] ? Number(m[2]) : from;
  return { from, to: Math.max(from, to) };
}

/**
 * The editable reference draft ({ book, chapter, verse }) for a staged passage,
 * so the segmented Reference field can reflect whatever is currently staged when
 * the operator returns to it — state stays consistent across the mode tabs and
 * with verses picked in the Card-picker/Keyword modes (one source of truth). A
 * multi-verse passage yields a range verse string ("16-18"); empty → null.
 */
export function referenceDraft(
  verses: BibleVerse[],
): { book: string; chapter: string; verse: string } | null {
  if (verses.length === 0) return null;
  const first = verses[0];
  const last = verses[verses.length - 1];
  const verse = verses.length > 1 ? `${first.verse}-${last.verse}` : String(first.verse);
  return { book: first.bookName, chapter: String(first.chapter), verse };
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
