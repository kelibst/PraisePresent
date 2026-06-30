import { describe, it, expect } from 'vitest';
import { reduce } from './presentEngine';
import type { PresentState, PresentSlide } from '@/shared/schemas/present';
import { FAILSAFE, DEFAULT_TRANSITION } from '@/shared/schemas/present';

function slide(id: string): PresentSlide {
  return { id, lines: [id] };
}

const deck3 = [slide('a'), slide('b'), slide('c')];

function withDeck(index = 0): PresentState {
  return { mode: 'slide', deck: deck3, index, transition: DEFAULT_TRANSITION };
}

describe('presentEngine reducer', () => {
  it('setDeck loads a deck and enters slide mode', () => {
    const s = reduce(FAILSAFE, { type: 'setDeck', deck: deck3 });
    expect(s.mode).toBe('slide');
    expect(s.deck).toHaveLength(3);
    expect(s.index).toBe(0);
  });

  it('setDeck with an out-of-range start index clamps it', () => {
    const s = reduce(FAILSAFE, { type: 'setDeck', deck: deck3, index: 99 });
    expect(s.index).toBe(2);
  });

  it('setDeck with an empty deck falls back to black (§5.7)', () => {
    const s = reduce(FAILSAFE, { type: 'setDeck', deck: [] });
    expect(s.mode).toBe('black');
    expect(s.deck).toHaveLength(0);
    expect(s.index).toBe(0);
  });

  it('next advances and clamps at the end (never out of range)', () => {
    let s = withDeck(0);
    s = reduce(s, { type: 'next' });
    expect(s.index).toBe(1);
    s = reduce(s, { type: 'next' });
    expect(s.index).toBe(2);
    s = reduce(s, { type: 'next' }); // at end, stays put
    expect(s.index).toBe(2);
  });

  it('prev goes back and clamps at the start', () => {
    let s = withDeck(2);
    s = reduce(s, { type: 'prev' });
    expect(s.index).toBe(1);
    s = reduce(s, { type: 'prev' });
    expect(s.index).toBe(0);
    s = reduce(s, { type: 'prev' }); // at start, stays put
    expect(s.index).toBe(0);
  });

  it('goto jumps to a valid index and clamps an out-of-range target', () => {
    expect(reduce(withDeck(0), { type: 'goto', index: 1 }).index).toBe(1);
    expect(reduce(withDeck(0), { type: 'goto', index: 99 }).index).toBe(2);
    expect(reduce(withDeck(0), { type: 'goto', index: -5 }).index).toBe(0);
  });

  it('next/prev/goto on an empty deck never throw and stay black/0', () => {
    const empty: PresentState = { ...FAILSAFE };
    expect(reduce(empty, { type: 'next' })).toMatchObject({ mode: 'black', index: 0 });
    expect(reduce(empty, { type: 'prev' })).toMatchObject({ mode: 'black', index: 0 });
    expect(reduce(empty, { type: 'goto', index: 4 })).toMatchObject({ mode: 'black', index: 0 });
  });

  it('black forgets the deck entirely (hard fail-safe)', () => {
    const s = reduce(withDeck(1), { type: 'black' });
    expect(s.mode).toBe('black');
    expect(s.deck).toHaveLength(0);
    expect(s.index).toBe(0);
  });

  it('blank keeps the deck/index but stops showing it', () => {
    const s = reduce(withDeck(1), { type: 'blank' });
    expect(s.mode).toBe('blank');
    expect(s.deck).toHaveLength(3);
    expect(s.index).toBe(1);
  });

  it('clear keeps the deck/index for resume', () => {
    const s = reduce(withDeck(2), { type: 'clear' });
    expect(s.mode).toBe('clear');
    expect(s.deck).toHaveLength(3);
    expect(s.index).toBe(2);
  });

  it('resuming navigation after blank re-enters slide mode at a valid index', () => {
    let s = reduce(withDeck(1), { type: 'blank' });
    s = reduce(s, { type: 'next' });
    expect(s.mode).toBe('slide');
    expect(s.index).toBe(2);
  });
});
