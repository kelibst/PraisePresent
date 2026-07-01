import { describe, it, expect } from 'vitest';
import { downsampleFloat32, floatTo16BitPcm } from './pcm';

// Pure PCM helpers feeding the mic-capture path. These gate audio quality for
// every ASR backend, so they're worth pinning (CLAUDE.md §5.8).

describe('floatTo16BitPcm', () => {
  it('maps the full-scale range and clamps overshoot', () => {
    const out = floatTo16BitPcm(new Float32Array([0, 1, -1, 0.5, 2, -2]));
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(32767); // +1.0 → max
    expect(out[2]).toBe(-32768); // -1.0 → min
    expect(out[3]).toBe(Math.trunc(0.5 * 0x7fff)); // Int16Array truncates toward zero
    expect(out[4]).toBe(32767); // +2.0 clamps to max (never wraps negative)
    expect(out[5]).toBe(-32768); // -2.0 clamps to min
  });

  it('returns an Int16Array of the same length', () => {
    const out = floatTo16BitPcm(new Float32Array(160));
    expect(out).toBeInstanceOf(Int16Array);
    expect(out.length).toBe(160);
  });
});

describe('downsampleFloat32', () => {
  it('returns the input unchanged when already at the target rate', () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);
    expect(downsampleFloat32(input, 16000, 16000)).toBe(input);
  });

  it('never upsamples (returns input when target exceeds input rate)', () => {
    const input = new Float32Array([0.1, 0.2]);
    expect(downsampleFloat32(input, 16000, 48000)).toBe(input);
  });

  it('reduces 48k → 16k length by ~1/3 and preserves a DC level', () => {
    const input = new Float32Array(4800).fill(0.5); // 0.1 s of constant 0.5 @ 48k
    const out = downsampleFloat32(input, 48000, 16000);
    expect(out.length).toBe(1600); // 0.1 s @ 16k
    // A constant signal must survive box-averaging unchanged.
    for (const s of out) expect(s).toBeCloseTo(0.5, 5);
  });
});
