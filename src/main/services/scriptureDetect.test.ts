import { describe, it, expect } from 'vitest';
import { detectReferences, wordsToNumbers } from './scriptureDetect';

describe('wordsToNumbers', () => {
  it('groups spoken Bible numbers into chapter/verse digits', () => {
    expect(wordsToNumbers('john three sixteen')).toBe('john 3 16');
    expect(wordsToNumbers('romans eight twenty eight')).toBe('romans 8 28');
    expect(wordsToNumbers('twenty-eight')).toBe('28');
    expect(wordsToNumbers('one hundred nineteen')).toBe('119');
    expect(wordsToNumbers('one hundred seventy six')).toBe('176');
  });

  it('leaves non-number words untouched', () => {
    expect(wordsToNumbers('turn with me to the book of')).toBe('turn with me to the book of');
  });
});

describe('detectReferences', () => {
  const one = (text: string) => detectReferences(text);

  it('detects an explicit digit reference in prose', () => {
    const r = one('Please turn with me to John 3:16 this morning.');
    expect(r).toHaveLength(1);
    expect(r[0].canonical).toBe('John 3:16');
    expect(r[0].ref).toMatchObject({ bookNumber: 43, chapter: 3, verseStart: 16, verseEnd: 16 });
    expect(r[0].type).toBe('explicit');
    expect(r[0].confidence).toBeGreaterThan(0.8);
  });

  it('detects a verse range', () => {
    const r = one('Read 1 Corinthians 13:4-7 with me.');
    expect(r[0].canonical).toBe('1 Corinthians 13:4-7');
    expect(r[0].ref).toMatchObject({ bookNumber: 46, chapter: 13, verseStart: 4, verseEnd: 7 });
  });

  it('detects spoken-number references', () => {
    expect(one('open to john three sixteen')[0].canonical).toBe('John 3:16');
    expect(one('romans eight twenty eight reminds us')[0].canonical).toBe('Romans 8:28');
  });

  it('handles chapter/verse keyword phrasing', () => {
    expect(one('romans chapter eight verse twenty eight')[0].canonical).toBe('Romans 8:28');
  });

  it('handles ordinal-prefixed books spoken aloud', () => {
    expect(one('look at first john four eight')[0].canonical).toBe('1 John 4:8');
    expect(one('second corinthians five seventeen')[0].canonical).toBe('2 Corinthians 5:17');
  });

  it('handles multiword book names', () => {
    expect(one('song of solomon 2 1')[0].canonical).toBe('Song of Solomon 2:1');
  });

  it('detects book+chapter (no verse) at lower confidence', () => {
    const r = one('We are reading Psalm 23 today.');
    expect(r[0].canonical).toBe('Psalms 23');
    expect(r[0].type).toBe('book_chapter');
    expect(r[0].ref.verseStart).toBeNull();
    expect(r[0].confidence).toBeLessThan(0.7);
  });

  it('detects a spoken whole-chapter psalm', () => {
    expect(one('turn to psalm one hundred nineteen')[0].canonical).toBe('Psalms 119');
  });

  it('tolerates punctuation attached to spoken numbers', () => {
    const r = one('Turn to John three sixteen, then Romans 8:28 this morning.');
    expect(r.map((x) => x.canonical).sort()).toEqual(['John 3:16', 'Romans 8:28']);
  });

  it('finds multiple references in one passage and dedups repeats', () => {
    const r = one('Compare John 3:16 with Romans 8:28, then John 3:16 again.');
    expect(r.map((x) => x.canonical).sort()).toEqual(['John 3:16', 'Romans 8:28']);
  });

  it('does not fire on common English words that are also short book aliases', () => {
    expect(one('she is 16 years old')).toHaveLength(0); // "is" != Isaiah here
    expect(one('so 2 of them came')).toHaveLength(0); // "so" != Song of Solomon
    expect(one('I am 3 minutes late')).toHaveLength(0); // "am" != Amos
    expect(one('we have ex 2 options')).toHaveLength(0); // "ex" != Exodus
  });

  it('still accepts roman-numeral ordinal book prefixes', () => {
    expect(one('iii john 1 2')[0].canonical).toBe('3 John 1:2');
  });

  it('clamps an out-of-range verse end to the start verse', () => {
    expect(one('john 3:16-200')[0].canonical).toBe('John 3:16');
  });

  it('returns nothing for text with no scripture', () => {
    expect(one('I have 3 apples and 5 oranges in 2024.')).toHaveLength(0);
    expect(one('')).toHaveLength(0);
    expect(one('   ')).toHaveLength(0);
  });

  it('ignores out-of-range chapter numbers (e.g. years)', () => {
    expect(one('back in the year 2024 we met')).toHaveLength(0);
  });
});
