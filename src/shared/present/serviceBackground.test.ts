import { describe, it, expect } from 'vitest';
import type { SlideBackground } from '@/shared/schemas/present';
import {
  SERVICE_BACKGROUND_KEY,
  serializeServiceBackground,
  parseServiceBackground,
  effectiveBackground,
} from './serviceBackground';

const COLOR: SlideBackground = { type: 'color', color: 'hsl(99, 25%, 47%)' };
const MEDIA: SlideBackground = { type: 'media', kind: 'image', url: 'app-media://media/7' };

describe('serviceBackground', () => {
  it('uses a stable settings key', () => {
    expect(SERVICE_BACKGROUND_KEY).toBe('present.serviceBackground');
  });

  describe('serialize/parse round-trip', () => {
    it('round-trips a color default', () => {
      expect(parseServiceBackground(serializeServiceBackground(COLOR))).toEqual(COLOR);
    });

    it('round-trips a media default', () => {
      expect(parseServiceBackground(serializeServiceBackground(MEDIA))).toEqual(MEDIA);
    });

    it('serializes null as the empty string and parses it back to null', () => {
      expect(serializeServiceBackground(null)).toBe('');
      expect(parseServiceBackground('')).toBeNull();
    });
  });

  describe('parseServiceBackground fail-safe', () => {
    it('returns null for unset/empty/whitespace', () => {
      expect(parseServiceBackground(null)).toBeNull();
      expect(parseServiceBackground(undefined)).toBeNull();
      expect(parseServiceBackground('')).toBeNull();
    });

    it('returns null for malformed JSON', () => {
      expect(parseServiceBackground('{not json')).toBeNull();
    });

    it('returns null for a structurally-wrong object', () => {
      expect(parseServiceBackground('{"type":"gradient"}')).toBeNull();
      expect(parseServiceBackground('{"type":"color"}')).toBeNull();
    });

    it('rejects an unsafe color (CSS injection) — fails safe to no default', () => {
      const malicious = JSON.stringify({ type: 'color', color: 'red; background: url(evil)' });
      expect(parseServiceBackground(malicious)).toBeNull();
    });

    it('rejects audio as a background kind', () => {
      const audio = JSON.stringify({ type: 'media', kind: 'audio', url: 'app-media://media/1' });
      expect(parseServiceBackground(audio)).toBeNull();
    });
  });

  describe('effectiveBackground (render-time resolver)', () => {
    it('uses the service default for a plain text slide', () => {
      expect(effectiveBackground({ background: undefined, media: undefined }, COLOR)).toEqual(
        COLOR,
      );
    });

    it('an explicit per-slide background always wins over the default', () => {
      expect(effectiveBackground({ background: MEDIA }, COLOR)).toEqual(MEDIA);
    });

    it('skips the default on a media slide (its media covers the surface)', () => {
      expect(
        effectiveBackground({ media: { kind: 'image', url: 'app-media://media/1' } }, COLOR),
      ).toBeUndefined();
    });

    it('still honors an EXPLICIT per-slide background even on a media slide', () => {
      expect(
        effectiveBackground(
          { background: COLOR, media: { kind: 'video', url: 'app-media://media/2' } },
          MEDIA,
        ),
      ).toEqual(COLOR);
    });

    it('returns undefined (gradient) for a text slide when there is no default', () => {
      expect(
        effectiveBackground({ background: undefined, media: undefined }, null),
      ).toBeUndefined();
    });
  });
});
