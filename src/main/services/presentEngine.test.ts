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

  describe('setBackground', () => {
    const color = { type: 'color', color: '#112233' } as const;

    it('sets the background on the current slide only', () => {
      const s = reduce(withDeck(1), { type: 'setBackground', background: color });
      expect(s.deck[1].background).toEqual(color);
      expect(s.deck[0].background).toBeUndefined();
      expect(s.deck[2].background).toBeUndefined();
      // mode/index are untouched — a background edit never moves the audience.
      expect(s.mode).toBe('slide');
      expect(s.index).toBe(1);
    });

    it('targets an explicit (clamped) index when given', () => {
      const s = reduce(withDeck(0), { type: 'setBackground', background: color, index: 99 });
      expect(s.deck[2].background).toEqual(color); // clamped to last
      expect(s.deck[0].background).toBeUndefined();
    });

    it('applyToAll paints every slide', () => {
      const s = reduce(withDeck(0), {
        type: 'setBackground',
        background: color,
        applyToAll: true,
      });
      expect(s.deck.every((sl) => sl.background?.type === 'color')).toBe(true);
    });

    it('clears the background (null) and drops the key entirely', () => {
      const withBg = reduce(withDeck(1), { type: 'setBackground', background: color });
      const cleared = reduce(withBg, { type: 'setBackground', background: null });
      expect('background' in cleared.deck[1]).toBe(false);
    });

    it('clears every slide with applyToAll + null', () => {
      const withBg = reduce(withDeck(0), {
        type: 'setBackground',
        background: color,
        applyToAll: true,
      });
      const cleared = reduce(withBg, {
        type: 'setBackground',
        background: null,
        applyToAll: true,
      });
      expect(cleared.deck.every((sl) => !('background' in sl))).toBe(true);
    });

    it('is a no-op on an empty deck (never throws — §5.7)', () => {
      const s = reduce({ ...FAILSAFE }, { type: 'setBackground', background: color });
      expect(s.deck).toHaveLength(0);
      expect(s.mode).toBe('black');
    });

    it('accepts a media background', () => {
      const media = { type: 'media', kind: 'image', url: 'app-media://media/7' } as const;
      const s = reduce(withDeck(0), { type: 'setBackground', background: media });
      expect(s.deck[0].background).toEqual(media);
    });
  });

  describe('updateText', () => {
    it('replaces the current slide lines and never moves the audience', () => {
      const s = reduce(withDeck(1), { type: 'updateText', lines: ['edited', 'two'] });
      expect(s.deck[1].lines).toEqual(['edited', 'two']);
      expect(s.deck[0].lines).toEqual(['a']); // others untouched
      expect(s.deck[2].lines).toEqual(['c']);
      expect(s.mode).toBe('slide');
      expect(s.index).toBe(1);
    });

    it('targets an explicit (clamped) index when given', () => {
      const s = reduce(withDeck(0), { type: 'updateText', lines: ['x'], index: 99 });
      expect(s.deck[2].lines).toEqual(['x']); // clamped to last
      expect(s.deck[0].lines).toEqual(['a']);
    });

    it('hard-rejects an edit to a LOCKED (scripture) slide — no-op (§5.3)', () => {
      const locked: PresentState = {
        mode: 'slide',
        deck: [{ id: 'v', lines: ['John 3:16'], locked: true }],
        index: 0,
        transition: DEFAULT_TRANSITION,
      };
      const s = reduce(locked, { type: 'updateText', lines: ['tampered'] });
      expect(s.deck[0].lines).toEqual(['John 3:16']); // unchanged
      expect(s).toEqual(locked); // identical state — true no-op
    });

    it('allows empty lines (audience still fails safe — §5.7)', () => {
      const s = reduce(withDeck(0), { type: 'updateText', lines: [] });
      expect(s.deck[0].lines).toEqual([]);
      expect(s.mode).toBe('slide');
    });

    it('is a no-op on an empty deck (never throws — §5.7)', () => {
      const s = reduce({ ...FAILSAFE }, { type: 'updateText', lines: ['x'] });
      expect(s.deck).toHaveLength(0);
      expect(s.mode).toBe('black');
    });

    it('back-compat: an unlocked slide with no `locked` key is editable', () => {
      // deck3 slides carry no `locked` key (existing decks) — editable by default.
      expect('locked' in deck3[0]).toBe(false);
      const s = reduce(withDeck(0), { type: 'updateText', lines: ['ok'] });
      expect(s.deck[0].lines).toEqual(['ok']);
    });
  });
});
