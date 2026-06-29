import type { CapabilityTier } from '@/shared/schemas/capability';

// Pure media-rendition decision logic (B6b). No I/O / jimp / electron imports so
// Vitest can unit-test every branch in isolation (CLAUDE.md §5.8); the actual image
// decode/resize lives in mediaOptimizer.ts. "Adapt, don't punish; clamp to the
// projector, never to the weakest machine" (plan/rerendering_engine/media-pipeline.mermaid).

export type Size = { width: number; height: number };

// Raster formats jimp reliably round-trips. Others (svg/webp/avif/gif/tiff) are left
// untouched — the original is served as-is (graceful, never an error).
const OPTIMIZABLE_EXT = new Set(['jpg', 'jpeg', 'png', 'bmp']);

// Refuse to optimize an absurdly large file (decompression-bomb / time guard). The
// file is still usable — we just serve the original and never block/crash the import.
export const MAX_OPTIMIZE_BYTES = 200 * 1024 * 1024; // 200 MB

// A LOW-tier machine is capped to 1080p even on a 4K projector — a weak GPU decodes
// 1080p far more cheaply and the softness is invisible under stage lighting. Standard
// and high tiers get the full projector resolution (capable machines aren't punished).
const LOW_TIER_CAP: Size = { width: 1920, height: 1080 };

export function effectiveTarget(projector: Size, tier: CapabilityTier): Size {
  if (tier !== 'low') return projector;
  return {
    width: Math.min(projector.width, LOW_TIER_CAP.width),
    height: Math.min(projector.height, LOW_TIER_CAP.height),
  };
}

// Fit `source` within `target`, DOWNSCALE ONLY (never upscale — that adds bytes and
// no quality). Returns the rendition dimensions, or null when the source already fits
// the projector (no rendition needed — the original is optimal).
export function planFit(source: Size, target: Size): Size | null {
  if (source.width <= 0 || source.height <= 0) return null;
  if (target.width <= 0 || target.height <= 0) return null;
  if (source.width <= target.width && source.height <= target.height) return null;
  const scale = Math.min(target.width / source.width, target.height / source.height);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

export type OptimizeDecision = { ok: true } | { ok: false; reason: string };

// Ingest guard rail: is this image worth (and safe) to optimize?
export function shouldOptimizeImage(ext: string, fileBytes: number): OptimizeDecision {
  const e = ext.replace(/^\./, '').toLowerCase();
  if (!OPTIMIZABLE_EXT.has(e)) return { ok: false, reason: 'unsupported-format' };
  if (fileBytes <= 0) return { ok: false, reason: 'empty' };
  if (fileBytes > MAX_OPTIMIZE_BYTES) return { ok: false, reason: 'too-large' };
  return { ok: true };
}

// The rendition is written as JPEG for photographic (jpg) sources and PNG otherwise
// (preserves transparency); both decode far cheaper than an oversized original.
export function renditionExt(sourceExt: string): '.jpg' | '.png' {
  return /jpe?g/i.test(sourceExt) ? '.jpg' : '.png';
}
