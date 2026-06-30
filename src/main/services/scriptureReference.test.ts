import { describe, it, expect } from 'vitest';
import { parseReference, formatReference, bookName } from './scriptureReference';

describe('parseReference', () => {
  it('parses a single verse "John 3:16"', () => {
    expect(parseReference('John 3:16')).toEqual({
      bookNumber: 43,
      chapter: 3,
      verseStart: 16,
      verseEnd: 16,
    });
  });

  it('parses a verse range "Gen 1:1-3" via abbreviation', () => {
    expect(parseReference('Gen 1:1-3')).toEqual({
      bookNumber: 1,
      chapter: 1,
      verseStart: 1,
      verseEnd: 3,
    });
  });

  it('parses a whole chapter "Psalm 23" (Psalms alias)', () => {
    expect(parseReference('Psalm 23')).toEqual({
      bookNumber: 19,
      chapter: 23,
      verseStart: null,
      verseEnd: null,
    });
  });

  it('parses a numbered book "1 John 2:1-5"', () => {
    expect(parseReference('1 John 2:1-5')).toEqual({
      bookNumber: 62,
      chapter: 2,
      verseStart: 1,
      verseEnd: 5,
    });
  });

  it('handles no space in a numbered book "1John 2:1"', () => {
    expect(parseReference('1John 2:1')).toMatchObject({
      bookNumber: 62,
      chapter: 2,
      verseStart: 1,
    });
  });

  it('is case- and whitespace-insensitive', () => {
    expect(parseReference('  rEv 22:21 ')).toEqual({
      bookNumber: 66,
      chapter: 22,
      verseStart: 21,
      verseEnd: 21,
    });
  });

  it('normalizes a reversed range to a single verse', () => {
    expect(parseReference('John 3:16-10')).toEqual({
      bookNumber: 43,
      chapter: 3,
      verseStart: 16,
      verseEnd: 16,
    });
  });

  it('returns null for an unknown book', () => {
    expect(parseReference('Hezekiah 1:1')).toBeNull();
  });

  it('returns null for empty or non-reference input', () => {
    expect(parseReference('')).toBeNull();
    expect(parseReference('hello world')).toBeNull();
  });
});

describe('formatReference / bookName', () => {
  it('formats a canonical label', () => {
    expect(formatReference(43, 3, 16)).toBe('John 3:16');
    expect(formatReference(62, 2, 1)).toBe('1 John 2:1');
  });
  it('resolves a book name by number', () => {
    expect(bookName(1)).toBe('Genesis');
    expect(bookName(66)).toBe('Revelation');
    expect(bookName(99)).toBeNull();
  });
});
