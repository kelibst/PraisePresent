import { describe, it, expect } from 'vitest';
import {
  planFit,
  shouldOptimizeImage,
  effectiveTarget,
  renditionExt,
  MAX_OPTIMIZE_BYTES,
} from './mediaPipeline';

describe('planFit (downscale-only fit)', () => {
  it('returns null when the source already fits the target', () => {
    expect(planFit({ width: 1920, height: 1080 }, { width: 1920, height: 1080 })).toBeNull();
    expect(planFit({ width: 800, height: 600 }, { width: 1920, height: 1080 })).toBeNull();
  });

  it('never upscales a small source', () => {
    expect(planFit({ width: 640, height: 480 }, { width: 3840, height: 2160 })).toBeNull();
  });

  it('downscales a 4K-wide image to fit 1080p, preserving aspect', () => {
    const fit = planFit({ width: 4000, height: 3000 }, { width: 1920, height: 1080 });
    // limited by height (1080/3000 < 1920/4000) → 1440x1080
    expect(fit).toEqual({ width: 1440, height: 1080 });
  });

  it('downscales a wide panorama by width', () => {
    const fit = planFit({ width: 6000, height: 1000 }, { width: 1920, height: 1080 });
    expect(fit).toEqual({ width: 1920, height: 320 });
  });

  it('guards against zero/negative dimensions', () => {
    expect(planFit({ width: 0, height: 100 }, { width: 1920, height: 1080 })).toBeNull();
    expect(planFit({ width: 100, height: 100 }, { width: 0, height: 0 })).toBeNull();
  });
});

describe('effectiveTarget (tier-aware cap)', () => {
  const projector4k = { width: 3840, height: 2160 };
  it('low tier caps to 1080p even on a 4K projector', () => {
    expect(effectiveTarget(projector4k, 'low')).toEqual({ width: 1920, height: 1080 });
  });
  it('standard/high get the full projector resolution (not punished)', () => {
    expect(effectiveTarget(projector4k, 'standard')).toEqual(projector4k);
    expect(effectiveTarget(projector4k, 'high')).toEqual(projector4k);
  });
  it('low tier never UPscales a sub-1080p projector', () => {
    expect(effectiveTarget({ width: 1280, height: 720 }, 'low')).toEqual({
      width: 1280,
      height: 720,
    });
  });
});

describe('shouldOptimizeImage (ingest guard rails)', () => {
  it('accepts the common raster formats', () => {
    for (const e of ['jpg', '.jpeg', 'PNG', '.bmp']) {
      expect(shouldOptimizeImage(e, 5_000_000).ok).toBe(true);
    }
  });
  it('skips formats jimp does not round-trip (served as-is)', () => {
    for (const e of ['svg', 'webp', 'avif', 'gif', 'tiff']) {
      const d = shouldOptimizeImage(e, 5_000_000);
      expect(d.ok).toBe(false);
      if (!d.ok) expect(d.reason).toBe('unsupported-format');
    }
  });
  it('refuses an absurdly large file (never blocks/crashes the import)', () => {
    const d = shouldOptimizeImage('jpg', MAX_OPTIMIZE_BYTES + 1);
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe('too-large');
  });
  it('rejects an empty file', () => {
    expect(shouldOptimizeImage('png', 0).ok).toBe(false);
  });
});

describe('renditionExt', () => {
  it('keeps JPEG for photographic sources, PNG otherwise (preserves alpha)', () => {
    expect(renditionExt('.jpg')).toBe('.jpg');
    expect(renditionExt('.jpeg')).toBe('.jpg');
    expect(renditionExt('.png')).toBe('.png');
    expect(renditionExt('.bmp')).toBe('.png');
  });
});
