import type { BibleBook } from '@/shared/schemas/scripture';

// Pure book-prefix matching for the reference field's EasyWorship-style
// autocomplete: typing "j" selects the nearest book starting with J, "1 the"
// narrows to 1 Thessalonians. Matches against the loaded book list (name +
// abbreviation) so the renderer needs no main-process import (§5.2). The book
// list is already in canonical order, so matches preserve canonical order —
// "j" → Joshua first, like EasyWorship. Vitest-tested alongside scriptureDeck.

// Lowercase, drop spaces and periods so "1 The" === "1the", "S. of S" === "sofs".
export function normalizeFragment(s: string): string {
  return s.toLowerCase().replace(/[\s.]/g, '');
}

// Books whose name or abbreviation starts with the fragment, in canonical order.
// Empty fragment → no matches (the field shows nothing to pick).
export function matchBooks(books: BibleBook[], fragment: string): BibleBook[] {
  const frag = normalizeFragment(fragment);
  if (!frag) return [];
  return books.filter(
    (b) =>
      normalizeFragment(b.name).startsWith(frag) ||
      normalizeFragment(b.abbreviation).startsWith(frag),
  );
}

// The single nearest book for a fragment (the auto-selected one), or null.
export function nearestBook(books: BibleBook[], fragment: string): BibleBook | null {
  return matchBooks(books, fragment)[0] ?? null;
}

// The book matching `text` exactly (its full name or its abbreviation), or null —
// e.g. "John"/"jhn" resolve, "joh" does not. Lets the field both gate live
// resolution and look up the book number (to load the whole chapter).
export function findExactBook(books: BibleBook[], text: string): BibleBook | null {
  const t = normalizeFragment(text);
  if (!t) return null;
  return (
    books.find((b) => normalizeFragment(b.name) === t || normalizeFragment(b.abbreviation) === t) ??
    null
  );
}

// True when `text` is an exact book (its full name or its abbreviation), not just
// a prefix. The segmented field uses this to know when the Book zone holds a real
// book and live resolution may run (so "jo" doesn't prematurely resolve to Joel).
export function isExactBook(books: BibleBook[], text: string): boolean {
  return findExactBook(books, text) !== null;
}

// The leading book portion of a free-text reference: everything before the first
// chapter digit. "John 3:16" → "John", "1 John 2" → "1 John", "Ps" → "Ps".
export function bookFragmentOf(query: string): string {
  const m = query.match(/^\s*(\d?\s*[^\d]*)/);
  return (m?.[1] ?? '').trim();
}
