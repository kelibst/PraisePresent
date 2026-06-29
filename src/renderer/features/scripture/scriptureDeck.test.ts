import { describe, it, expect } from 'vitest';
import type { BibleVerse } from '@/shared/schemas/scripture';
import {
  referenceLabel,
  verseId,
  versesToDeck,
  rangeLabel,
  highlightSegments,
} from './scriptureDeck';

const v = (
  chapter: number,
  verse: number,
  text = 'x',
  book = 'John',
  bookNumber = 43,
): BibleVerse => ({
  bookNumber,
  bookName: book,
  chapter,
  verse,
  text,
});

describe('referenceLabel / verseId', () => {
  it('formats a canonical reference and a stable id', () => {
    expect(referenceLabel(v(3, 16))).toBe('John 3:16');
    expect(verseId(v(3, 16))).toBe('43-3-16');
  });
});

describe('versesToDeck', () => {
  it('makes one slide per verse, each with its own reference + id', () => {
    const deck = versesToDeck([v(3, 16, 'a'), v(3, 17, 'b')]);
    expect(deck).toEqual([
      { id: '43-3-16', lines: ['a'], reference: 'John 3:16' },
      { id: '43-3-17', lines: ['b'], reference: 'John 3:17' },
    ]);
  });
});

describe('rangeLabel', () => {
  it('returns a single label for one verse', () => {
    expect(rangeLabel([v(3, 16)])).toBe('John 3:16');
  });
  it('collapses a same-chapter range', () => {
    expect(rangeLabel([v(3, 16), v(3, 17), v(3, 18)])).toBe('John 3:16–18');
  });
  it('is empty for no verses', () => {
    expect(rangeLabel([])).toBe('');
  });
});

describe('highlightSegments', () => {
  it('marks each matched word, case-insensitively', () => {
    const segs = highlightSegments('Love your enemies and love', 'love');
    const marked = segs.filter((s) => s.match).map((s) => s.text);
    expect(marked).toEqual(['Love', 'love']);
    expect(segs.map((s) => s.text).join('')).toBe('Love your enemies and love');
  });
  it('returns the whole text unmarked when the query is empty', () => {
    expect(highlightSegments('hello', '  ')).toEqual([{ text: 'hello', match: false }]);
  });
  it('does not break on regex metacharacters in the query', () => {
    const segs = highlightSegments('a (b) c', '(b)');
    expect(segs.map((s) => s.text).join('')).toBe('a (b) c');
  });
});
