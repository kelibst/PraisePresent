import type { CapabilityTier } from '@/shared/schemas/capability';
import { effectiveTarget, type Size } from './mediaPipeline';

// Pure video-transcode decision logic (B6c). No spawn / electron / ffmpeg imports so
// Vitest can unit-test the guard rails and the ffmpeg arg construction in isolation
// (CLAUDE.md §5.8); the actual out-of-process transcode lives in transcodeSidecar.ts.
//
// Goal: pre-scale oversized/4K video to the projector resolution + a low-power H.264
// rendition ON IMPORT so the projector never decodes oversized video live. ffmpeg
// streams frame-by-frame, so RAM is independent of file size — the guard rails are
// about time/disk, enforced by the sidecar's watchdog, not a hard size refusal.

// Containers worth transcoding (what the media library accepts as video).
const TRANSCODABLE_EXT = new Set(['mp4', 'webm', 'mov', 'mkv', 'm4v']);

// A sanity ceiling — above this we skip transcode and stream the original (which the
// app-media:// protocol range-streams anyway). Generous: real 4K service media is far
// below this; the watchdog handles anything that's merely slow.
export const MAX_TRANSCODE_BYTES = 16 * 1024 * 1024 * 1024; // 16 GB

export type TranscodeDecision = { ok: true } | { ok: false; reason: string };

export function shouldTranscodeVideo(ext: string, fileBytes: number): TranscodeDecision {
  const e = ext.replace(/^\./, '').toLowerCase();
  if (!TRANSCODABLE_EXT.has(e)) return { ok: false, reason: 'unsupported-container' };
  if (fileBytes <= 0) return { ok: false, reason: 'empty' };
  if (fileBytes > MAX_TRANSCODE_BYTES) return { ok: false, reason: 'too-large' };
  return { ok: true };
}

// Per-tier encode settings. preset = encode CPU on the IMPORTING machine (a weak box
// encodes faster with a faster preset); crf = quality/size (a higher crf → smaller
// file the weak PROJECTOR decodes more cheaply). "Adapt, don't punish."
function encodeSettings(tier: CapabilityTier): { preset: string; crf: number } {
  switch (tier) {
    case 'low':
      return { preset: 'veryfast', crf: 28 };
    case 'high':
      return { preset: 'medium', crf: 22 };
    default:
      return { preset: 'fast', crf: 24 };
  }
}

// The scale filter caps the video to WxH, DOWNSCALE ONLY (min(iw,W) never upscales a
// smaller source), preserves aspect (force_original_aspect_ratio=decrease), and keeps
// dimensions even (force_divisible_by=2 — required by yuv420p/H.264). Commas inside
// min() are escaped (\,) so ffmpeg's filtergraph parser doesn't read them as a filter
// separator. No probe needed — the filter computes the fit from the input itself.
export function scaleFilter(target: Size): string {
  return (
    `scale=w=min(iw\\,${target.width}):h=min(ih\\,${target.height})` +
    `:force_original_aspect_ratio=decrease:force_divisible_by=2`
  );
}

// Build the ffmpeg argv (no shell). H.264 + AAC + faststart = broadly compatible and
// hardware-decodable on old GPUs. `target` is the tier-aware projector cap.
export function buildFfmpegArgs(input: string, output: string, target: Size, tier: CapabilityTier): string[] {
  const { preset, crf } = encodeSettings(tier);
  return [
    '-y', // overwrite the (main-controlled) output path
    '-i',
    input,
    '-vf',
    scaleFilter(target),
    '-c:v',
    'libx264',
    '-preset',
    preset,
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    output,
  ];
}

// The tier-aware projector cap a transcode targets (re-exported convenience).
export function videoTarget(projector: Size, tier: CapabilityTier): Size {
  return effectiveTarget(projector, tier);
}
