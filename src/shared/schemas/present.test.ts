import { describe, it, expect } from 'vitest';
import {
  presentState,
  presentSlide,
  setDeckInput,
  gotoInput,
  setBackgroundInput,
  slideBackground,
  isSafeCssColor,
  transition,
  FAILSAFE,
} from './present';

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

  describe('slide background (back-compat + safety)', () => {
    it('a slide WITHOUT a background is still valid (backward-compatible)', () => {
      expect(presentSlide.safeParse({ id: 's1', lines: ['hi'] }).success).toBe(true);
    });

    it('a whole deck without backgrounds round-trips unchanged through setDeckInput', () => {
      const parsed = setDeckInput.parse({
        deck: [
          { id: 's1', lines: ['a'] },
          { id: 's2', lines: ['b'], reference: 'John 3:16' },
        ],
      });
      expect(parsed.deck[0].background).toBeUndefined();
      expect(parsed.deck[1].background).toBeUndefined();
    });

    it('accepts a color background', () => {
      const s = presentSlide.safeParse({
        id: 's1',
        lines: [],
        background: { type: 'color', color: '#5E3B9E' },
      });
      expect(s.success).toBe(true);
    });

    it('accepts a media (image/video) background but not audio', () => {
      expect(
        slideBackground.safeParse({ type: 'media', kind: 'video', url: 'app-media://media/3' })
          .success,
      ).toBe(true);
      expect(
        slideBackground.safeParse({ type: 'media', kind: 'audio', url: 'app-media://media/3' })
          .success,
      ).toBe(false);
    });

    it('rejects an unsafe / injecting color string', () => {
      for (const bad of [
        'url(http://evil/x.png)',
        'red; background: url(x)',
        'expression(alert(1))',
        '#5E3B9E}',
        'rgb(0,0,0);}',
        'var(--x)',
      ]) {
        expect(isSafeCssColor(bad)).toBe(false);
        expect(slideBackground.safeParse({ type: 'color', color: bad }).success).toBe(false);
      }
    });

    it('accepts safe color forms (hex / rgb / hsl / named)', () => {
      for (const good of [
        '#000',
        '#5E3B9E',
        '#5E3B9EFF',
        'rgb(10, 20, 30)',
        'rgba(10,20,30,0.5)',
        'hsl(262, 47%, 43%)',
        'black',
      ]) {
        expect(isSafeCssColor(good)).toBe(true);
      }
    });
  });

  describe('setBackgroundInput', () => {
    it('accepts a color background with no index (current slide)', () => {
      const p = setBackgroundInput.safeParse({ background: { type: 'color', color: '#000000' } });
      expect(p.success).toBe(true);
    });

    it('accepts null to clear + applyToAll', () => {
      const p = setBackgroundInput.parse({ background: null, applyToAll: true });
      expect(p.background).toBeNull();
      expect(p.applyToAll).toBe(true);
    });

    it('rejects an unsafe color across the IPC boundary', () => {
      expect(
        setBackgroundInput.safeParse({ background: { type: 'color', color: 'url(x)' } }).success,
      ).toBe(false);
    });

    it('rejects a negative index', () => {
      expect(setBackgroundInput.safeParse({ index: -1, background: null }).success).toBe(false);
    });
  });
});
