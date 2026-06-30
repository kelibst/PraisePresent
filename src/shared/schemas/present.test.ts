import { describe, it, expect } from 'vitest';
import { presentState, setDeckInput, gotoInput, transition, FAILSAFE } from './present';

describe('present schemas', () => {
  it('FAILSAFE is a valid present state', () => {
    expect(presentState.safeParse(FAILSAFE).success).toBe(true);
  });

  it('transition applies sane defaults', () => {
    const t = transition.parse({});
    expect(t).toEqual({ type: 'fade', durationMs: 400 });
  });

  it('transition rejects an out-of-bounds duration', () => {
    expect(transition.safeParse({ type: 'fade', durationMs: 9999 }).success).toBe(false);
    expect(transition.safeParse({ type: 'fade', durationMs: -1 }).success).toBe(false);
  });

  it('setDeckInput defaults index to 0', () => {
    const parsed = setDeckInput.parse({ deck: [{ id: 's1', lines: ['hi'] }] });
    expect(parsed.index).toBe(0);
  });

  it('setDeckInput accepts an optional reference and transition', () => {
    const parsed = setDeckInput.parse({
      deck: [{ id: 's1', lines: ['v'], reference: 'John 3:16' }],
      index: 0,
      transition: { type: 'cut', durationMs: 0 },
    });
    expect(parsed.deck[0].reference).toBe('John 3:16');
    expect(parsed.transition?.type).toBe('cut');
  });

  it('rejects a slide with an empty id', () => {
    expect(setDeckInput.safeParse({ deck: [{ id: '', lines: [] }] }).success).toBe(false);
  });

  it('gotoInput rejects a negative index', () => {
    expect(gotoInput.safeParse({ index: -1 }).success).toBe(false);
    expect(gotoInput.safeParse({ index: 3 }).success).toBe(true);
  });
});
