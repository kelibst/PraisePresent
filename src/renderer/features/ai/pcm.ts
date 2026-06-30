// PURE PCM helpers for the mic-capture path (CLAUDE.md §5.8 — no Web Audio / DOM
// here, fully unit-testable). The capture controller (audioCapture.ts) gets raw
// Float32 mono samples at the hardware rate from the AudioContext and must hand
// main a stream of 16 kHz mono 16-bit PCM — the one format every ASR backend
// accepts (whisper.cpp + Deepgram linear16 + AssemblyAI pcm_s16le). These two
// functions do exactly that, and nothing else.

// Downsample a mono Float32 buffer from `inputRate` to `targetRate` by averaging
// each output sample's source window (a cheap, alias-reducing box filter — good
// enough for speech, and what the WebAudio recorder cookbooks use). Returns the
// input unchanged when already at the target rate; never upsamples (returns input
// if asked to, since there's no real signal to invent).
export function downsampleFloat32(
  input: Float32Array,
  inputRate: number,
  targetRate: number,
): Float32Array {
  if (targetRate >= inputRate) return input;
  const ratio = inputRate / targetRate;
  const newLength = Math.floor(input.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.floor((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
      accum += input[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// Convert Float32 samples in [-1, 1] to signed 16-bit PCM. Clamps out-of-range
// samples (a hot mic can exceed ±1) so we never wrap around to the wrong sign.
export function floatTo16BitPcm(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}
