import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BLACK_ON_DISCONNECT,
  DEFAULT_SAFE_AREA_PCT,
  MAX_SAFE_AREA_PCT,
  parseBlackOnDisconnect,
  parseSafeAreaPct,
} from './display';

// The display-safety settings are persisted as strings; these pure parsers turn
// the stored value back into a clamped, fail-safe value the audience view and the
// window manager consume (CLAUDE.md §5.7). Garbage never breaks the projector.

describe('parseSafeAreaPct', () => {
  it('returns the default for a missing value', () => {
    expect(parseSafeAreaPct(null)).toBe(DEFAULT_SAFE_AREA_PCT);
  });

  it('round-trips a valid value', () => {
    expect(parseSafeAreaPct('5')).toBe(5);
    expect(parseSafeAreaPct('0')).toBe(0);
    expect(parseSafeAreaPct(String(MAX_SAFE_AREA_PCT))).toBe(MAX_SAFE_AREA_PCT);
  });

  it('clamps out-of-range values into [0, MAX]', () => {
    expect(parseSafeAreaPct('-4')).toBe(0);
    expect(parseSafeAreaPct('99')).toBe(MAX_SAFE_AREA_PCT);
  });

  it('falls back to the default for garbage', () => {
    expect(parseSafeAreaPct('abc')).toBe(DEFAULT_SAFE_AREA_PCT);
    expect(parseSafeAreaPct('')).toBe(DEFAULT_SAFE_AREA_PCT);
  });
});

describe('parseBlackOnDisconnect', () => {
  it('defaults ON for a missing value (fail safe)', () => {
    expect(parseBlackOnDisconnect(null)).toBe(DEFAULT_BLACK_ON_DISCONNECT);
    expect(DEFAULT_BLACK_ON_DISCONNECT).toBe(true);
  });

  it('only an explicit "false" disables it', () => {
    expect(parseBlackOnDisconnect('false')).toBe(false);
    expect(parseBlackOnDisconnect('true')).toBe(true);
    expect(parseBlackOnDisconnect('anything')).toBe(true);
  });
});
