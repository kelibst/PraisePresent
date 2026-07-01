import { describe, it, expect } from 'vitest';
import {
  shouldTranscodeVideo,
  buildFfmpegArgs,
  scaleFilter,
  videoTarget,
  MAX_TRANSCODE_BYTES,
} from './videoPipeline';

describe('shouldTranscodeVideo (guard rails)', () => {
  it('accepts the supported containers', () => {
    for (const e of ['mp4', '.webm', 'MOV', 'mkv', 'm4v']) {
      expect(shouldTranscodeVideo(e, 50_000_000).ok).toBe(true);
    }
  });
  it('rejects unsupported containers (served as-is)', () => {
    const d = shouldTranscodeVideo('avi', 50_000_000);
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe('unsupported-container');
  });
  it('rejects empty and absurdly large files', () => {
    expect(shouldTranscodeVideo('mp4', 0).ok).toBe(false);
    const big = shouldTranscodeVideo('mp4', MAX_TRANSCODE_BYTES + 1);
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.reason).toBe('too-large');
  });
});

describe('scaleFilter (downscale-only fit)', () => {
  it('caps to WxH with escaped commas, decrease aspect, even dims', () => {
    const f = scaleFilter({ width: 1920, height: 1080 });
    expect(f).toBe(
      'scale=w=min(iw\\,1920):h=min(ih\\,1080):force_original_aspect_ratio=decrease:force_divisible_by=2',
    );
    // commas inside min() are escaped so they are not read as a filter separator
    expect(f).toContain('min(iw\\,1920)');
  });
});

describe('videoTarget (tier-aware cap)', () => {
  it('low caps to 1080p even on a 4K projector; high gets full res', () => {
    expect(videoTarget({ width: 3840, height: 2160 }, 'low')).toEqual({ width: 1920, height: 1080 });
    expect(videoTarget({ width: 3840, height: 2160 }, 'high')).toEqual({ width: 3840, height: 2160 });
  });
});

describe('buildFfmpegArgs', () => {
  const target = { width: 1920, height: 1080 };

  it('produces H.264 + AAC + faststart with the scale filter and IO paths', () => {
    const args = buildFfmpegArgs('/in.mov', '/out.mp4', target, 'standard');
    expect(args[0]).toBe('-y');
    expect(args).toContain('/in.mov');
    expect(args[args.length - 1]).toBe('/out.mp4');
    expect(args).toContain('libx264');
    expect(args).toContain('aac');
    expect(args).toContain('+faststart');
    expect(args).toContain('yuv420p');
    expect(args[args.indexOf('-vf') + 1]).toBe(scaleFilter(target));
  });

  it('uses tier-aware preset + crf (weak machines encode faster, smaller)', () => {
    const low = buildFfmpegArgs('/i', '/o', target, 'low');
    const high = buildFfmpegArgs('/i', '/o', target, 'high');
    expect(low[low.indexOf('-preset') + 1]).toBe('veryfast');
    expect(low[low.indexOf('-crf') + 1]).toBe('28');
    expect(high[high.indexOf('-preset') + 1]).toBe('medium');
    expect(high[high.indexOf('-crf') + 1]).toBe('22');
  });
});
