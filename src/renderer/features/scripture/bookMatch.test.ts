import { describe, it, expect } from 'vitest';
import type { BibleBook } from '@/shared/schemas/scripture';
import {
  matchBooks,
  nearestBook,
  bookFragmentOf,
  normalizeFragment,
  isExactBook,
} from './bookMatch';

// Minimal canonical-order book list (number drives order, like listBooks()).
const mk = (number: number, name: string, abbreviation: string): BibleBook => ({
  number,
  name,
  abbreviation,
  osisId: abbreviation,
  testament: number < 40 ? 'OT' : 'NT',
  chapterCount: 1,
});

const BOOKS: BibleBook[] = [
  mk(1, 'Genesis', 'Gen'),
  mk(6, 'Joshua', 'Josh'),
  mk(7, 'Judges', 'Judg'),
  mk(18, 'Job', 'Job'),
  mk(29, 'Joel', 'Joel'),
  mk(32, 'Jonah', 'Jonah'),
  mk(43, 'John', 'John'),
  mk(52, '1 Thessalonians', '1Thess'),
  mk(54, '1 Timothy', '1Tim'),
  mk(59, 'James', 'Jas'),
];

describe('matchBooks / nearestBook', () => {
  it('returns nothing for an empty fragment', () => {
    expect(matchBooks(BOOKS, '')).toEqual([]);
    expect(nearestBook(BOOKS, '  ')).toBeNull();
  });

  it('selects the nearest book by canonical order on the first letter', () => {
    // "j" → Joshua is the first J book in canonical order (like EasyWorship).
    expect(nearestBook(BOOKS, 'j')?.name).toBe('Joshua');
  });

  it('narrows as more letters are typed', () => {
    expect(nearestBook(BOOKS, 'joh')?.name).toBe('John');
    expect(matchBooks(BOOKS, 'joh').map((b) => b.name)).toEqual(['John']);
  });

  it('handles numbered books like "1 the" → 1 Thessalonians', () => {
    expect(nearestBook(BOOKS, '1 the')?.name).toBe('1 Thessalonians');
    // "1 t" matches both 1 Thessalonians and 1 Timothy, canonical order first.
    expect(matchBooks(BOOKS, '1 t').map((b) => b.name)).toEqual(['1 Thessalonians', '1 Timothy']);
  });

  it('matches on abbreviation too', () => {
    expect(nearestBook(BOOKS, 'gen')?.name).toBe('Genesis');
    expect(nearestBook(BOOKS, 'jas')?.name).toBe('James');
  });
});

describe('isExactBook', () => {
  it('is true only for a full name or abbreviation, not a prefix', () => {
    expect(isExactBook(BOOKS, 'John')).toBe(true);
    expect(isExactBook(BOOKS, 'john')).toBe(true); // case-insensitive
    expect(isExactBook(BOOKS, 'John ')).toBe(true); // trailing space ignored
    expect(isExactBook(BOOKS, '1 Thessalonians')).toBe(true);
    expect(isExactBook(BOOKS, '1thess')).toBe(true); // abbreviation
    expect(isExactBook(BOOKS, 'joh')).toBe(false); // prefix only
    expect(isExactBook(BOOKS, 'jo')).toBe(false);
    expect(isExactBook(BOOKS, '')).toBe(false);
  });
});

describe('bookFragmentOf', () => {
  it('extracts the book portion before the chapter digit', () => {
    expect(bookFragmentOf('John 3:16')).toBe('John');
    expect(bookFragmentOf('1 John 2')).toBe('1 John');
    expect(bookFragmentOf('Song of Solomon 1:1')).toBe('Song of Solomon');
    expect(bookFragmentOf('Ps')).toBe('Ps');
  });
});

describe('normalizeFragment', () => {
  it('lowercases and drops spaces and periods', () => {
    expect(normalizeFragment('1 The')).toBe('1the');
    expect(normalizeFragment('S. of S')).toBe('sofs');
  });
});
