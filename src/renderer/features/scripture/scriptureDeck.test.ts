import { describe, it, expect } from 'vitest';
import type { BibleVerse } from '@/shared/schemas/scripture';
import {
  referenceLabel,
  verseId,
  versesToDeck,
  rangeLabel,
  referenceDraft,
  parseVerseRange,
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
      { id: '43-3-16', lines: ['a'], reference: 'John 3:16', locked: true },
      { id: '43-3-17', lines: ['b'], reference: 'John 3:17', locked: true },
    ]);
  });

  it('marks every scripture slide read-only (locked) — translation integrity', () => {
    const deck = versesToDeck([v(3, 16, 'a'), v(3, 17, 'b')]);
    expect(deck.every((s) => s.locked === true)).toBe(true);
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

describe('referenceDraft', () => {
  it('is null for an empty passage', () => {
    expect(referenceDraft([])).toBeNull();
  });
  it('returns a single-verse draft', () => {
    expect(referenceDraft([v(3, 16)])).toEqual({ book: 'John', chapter: '3', verse: '16' });
  });
  it('returns a range draft for a multi-verse passage', () => {
    expect(referenceDraft([v(3, 16), v(3, 17), v(3, 18)])).toEqual({
      book: 'John',
      chapter: '3',
      verse: '16-18',
    });
  });
});

describe('parseVerseRange', () => {
  it('parses a single verse', () => {
    expect(parseVerseRange('15')).toEqual({ from: 15, to: 15 });
  });
  it('parses a range', () => {
    expect(parseVerseRange('16-18')).toEqual({ from: 16, to: 18 });
  });
  it('is null for empty / whole-chapter / incomplete input', () => {
    expect(parseVerseRange('')).toBeNull();
    expect(parseVerseRange('  ')).toBeNull();
    expect(parseVerseRange('16-')).toBeNull(); // incomplete range
    expect(parseVerseRange('x')).toBeNull();
  });
  it('collapses a reversed range to the start verse (matches the reference parser)', () => {
    expect(parseVerseRange('18-16')).toEqual({ from: 18, to: 18 });
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
