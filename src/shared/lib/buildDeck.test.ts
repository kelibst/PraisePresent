import { describe, it, expect } from 'vitest';
import { textToLines, blocksToDeck, singleSlideDeck } from './buildDeck';

describe('buildDeck', () => {
  it('textToLines trims, drops blanks, and normalizes CRLF', () => {
    expect(textToLines('  a \r\n\n b ')).toEqual(['a', 'b']);
  });

  it('blocksToDeck is index-stable: deck[i] always maps to blocks[i]', () => {
    const deck = blocksToDeck(
      [{ text: 'line 1\nline 2' }, { text: '   ', label: 'Chorus' }, { text: 'x' }],
      'song-7',
    );
    // No block is dropped — empty block keeps its slot (placeholder line).
    expect(deck).toHaveLength(3);
    expect(deck[0]).toEqual({ id: 'song-7-0', lines: ['line 1', 'line 2'], reference: undefined });
    expect(deck[1].id).toBe('song-7-1');
    expect(deck[1].lines).toEqual(['Chorus']); // safe placeholder from the label
    expect(deck[2]).toEqual({ id: 'song-7-2', lines: ['x'], reference: undefined });
  });

  it('blocksToDeck placeholder falls back to a single space when no label/reference', () => {
    const deck = blocksToDeck([{ text: '' }]);
    expect(deck).toHaveLength(1);
    expect(deck[0].lines).toEqual([' ']);
  });

  it('clicking the section AFTER an empty one starts the deck on the correct slide', () => {
    // Reproduces reviewer finding #1: an empty section in the MIDDLE must not
    // shift later indices, or the clicked startIndex opens the wrong slide.
    const sections = [
      { text: 'Verse 1 line', label: 'Verse 1' },
      { text: '', label: 'Chorus' }, // header-only / empty content
      { text: 'Verse 2 line', label: 'Verse 2' },
    ];
    const deck = blocksToDeck(sections, 'song-3');
    const clickedIndex = 2; // operator clicks "Verse 2" (the 3rd rendered row)
    expect(deck.length).toBe(sections.length);
    // The slide at the clicked source index is exactly Verse 2.
    expect(deck[clickedIndex].lines).toEqual(['Verse 2 line']);
  });

  it('blocksToDeck carries an optional reference per block', () => {
    const deck = blocksToDeck([{ text: 'v', reference: 'John 3:16' }]);
    expect(deck[0].reference).toBe('John 3:16');
  });

  it('singleSlideDeck builds a one-slide deck, empty when text is blank', () => {
    expect(singleSlideDeck('hello', 'Ps 23', 'item-0')).toEqual([
      { id: 'item-0', lines: ['hello'], reference: 'Ps 23' },
    ]);
    expect(singleSlideDeck('   ')).toEqual([]);
  });
});
