import { TARGET_SAMPLE_RATE } from '@/shared/schemas/ai';
import { downsampleFloat32, floatTo16BitPcm } from './pcm';

// Microphone capture controller (CLAUDE.md §5.2). This — together with
// useAudioSources — is the ONLY renderer code that touches `navigator.mediaDevices`
// / Web Audio; it captures the operator's mic, downsamples to 16 kHz mono 16-bit
// PCM, and streams frames to main via `window.api.ai.sendAudioFrame`. NO network,
// NO detection, NO key handling here — main owns all of that (§1.3). On Stop the
// graph + tracks + AudioContext are fully torn down so no mic stays hot.

const DEFAULT_SOURCE_ID = 'default';
// ~256 ms per frame at 16 kHz after downsampling (4096 native samples ≈ 85 ms at
// 48 kHz). Small enough for a live feel, large enough to keep IPC chatter modest.
const FRAME_SAMPLES = 4096;

export type AudioCapture = {
  /** Stop capture and release the mic, the audio graph, and the context. */
  stop: () => void;
};

// Map the operator-selected source id to a getUserMedia constraint. 'default' (the
// built-in fallback) means "let the OS pick"; a real deviceId pins that input.
function audioConstraint(sourceId: string): MediaStreamConstraints {
  const tuning = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
  if (sourceId && sourceId !== DEFAULT_SOURCE_ID) {
    return { audio: { deviceId: { exact: sourceId }, ...tuning } };
  }
  return { audio: tuning };
}

// Begin capturing from `sourceId`. Resolves once the mic is live and frames are
// flowing; rejects if the mic is denied/absent (the caller stops listening and
// surfaces it). The returned handle's `stop()` is idempotent.
export async function startAudioCapture(sourceId: string): Promise<AudioCapture> {
  const stream = await navigator.mediaDevices.getUserMedia(audioConstraint(sourceId));

  const ctx = new AudioContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      /* best-effort — onaudioprocess still fires once connected */
    }
  }

  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessorNode is deprecated in favour of AudioWorklet, but it needs no
  // separate worklet asset (which is awkward to serve under file:// + CSP) and the
  // operator window is not the perf-critical audience path — so it's the pragmatic
  // choice here. The output buffer is left untouched (silence), so routing it to
  // `destination` (required for the callback to fire) produces NO speaker feedback.
  const processor = ctx.createScriptProcessor(FRAME_SAMPLES, 1, 1);
  const inputRate = ctx.sampleRate;

  processor.onaudioprocess = (event: AudioProcessingEvent) => {
    const input = event.inputBuffer.getChannelData(0);
    const down = downsampleFloat32(input, inputRate, TARGET_SAMPLE_RATE);
    if (down.length === 0) return;
    window.api.ai.sendAudioFrame(floatTo16BitPcm(down), TARGET_SAMPLE_RATE);
  };

  source.connect(processor);
  processor.connect(ctx.destination);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      processor.onaudioprocess = null;
      try {
        processor.disconnect();
        source.disconnect();
      } catch {
        /* ignore */
      }
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
