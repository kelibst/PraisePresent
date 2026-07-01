import { app } from 'electron';
import { spawn } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import log from '../infra/logger';
import { TARGET_SAMPLE_RATE } from '@/shared/schemas/ai';
import type { AiModelStatus } from '@/shared/schemas/ai';
import type { AsrSession, AsrSessionCallbacks } from './asrSession';
import { LOCAL_ASR_AGENT_ID, NullLocalAsr, type LocalAsr } from './localAsr';
import { installedModel, modelPath, whisperModelStatus } from './modelManager';

// Real offline ASR backed by the whisper.cpp CLI run as a child-process SIDECAR
// (mirrors transcodeSidecar.ts — crash-isolated, never takes down the live
// service, §5.7). It implements the stable `LocalAsr` contract (R6) plus a
// rolling-window `AsrSession` adapter for the live audio spine. MAIN-PROCESS ONLY.
//
// The binary is NOT bundled in this build; it is resolved from (1) the
// `PRAISEPRESENT_WHISPER_BIN` env var (point it at your whisper-cli build to try
// locally), (2) `resources/whisper-cli` when packaged, or (3) in dev only, the
// conventional local build tree at `.tools/whisper.cpp/build/bin/` (mirrors
// bibleBundle.ts's app.getAppPath()-relative walk-up) — so a one-time local
// build keeps working across restarts without re-exporting the env var every
// session. The GGUF weights come from the model download manager. When either
// is missing, `isInstalled()` is false and the orchestrator keeps the engine
// unavailable with a clear reason — it never fakes a transcription.

const WATCHDOG_MS = 60_000; // kill a whisper run that hangs on a pathological window
// Live window: transcribe ~5 s of speech at a time. Long enough for whisper to
// have context, short enough to keep candidates flowing during a sermon.
const WINDOW_SAMPLES = TARGET_SAMPLE_RATE * 5;

// Dev-only fallback: the local whisper.cpp build tree a contributor builds once
// (see docs/revival or the P4-T3 task note). app.getAppPath() is the Vite build
// dir (.vite/build) in dev, so we also walk up to the repo root — same pattern
// bibleBundle.ts uses for resources/bible.
function devFallbackBinaryPath(name: string): string | null {
  const appPath = app.getAppPath();
  const candidates = [
    path.join(appPath, '.tools', 'whisper.cpp', 'build', 'bin', name),
    path.join(appPath, '..', '..', '.tools', 'whisper.cpp', 'build', 'bin', name),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

// Resolve the whisper-cli binary, or null when it isn't available.
export function whisperBinaryPath(): string | null {
  const fromEnv = process.env.PRAISEPRESENT_WHISPER_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const name = process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli';
  if (app.isPackaged) {
    const bundled = path.join(process.resourcesPath, name);
    if (existsSync(bundled)) return bundled;
    return null;
  }
  return devFallbackBinaryPath(name);
}

// Encode 16-bit mono PCM as a minimal WAV (44-byte header + samples). PURE +
// exported for unit testing — whisper-cli reads this off disk per window.
export function encodeWav(pcm: Int16Array, sampleRate: number): Buffer {
  const dataBytes = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM fmt chunk size
  buf.writeUInt16LE(1, 20); // audio format = PCM
  buf.writeUInt16LE(1, 22); // channels = 1
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate (mono 16-bit)
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < pcm.length; i++) buf.writeInt16LE(pcm[i], 44 + i * 2);
  return buf;
}

// whisper-cli prints transcription lines (and, before `-nt`, timestamps) plus the
// noise tokens it brackets like "[BLANK_AUDIO]" / "(silence)". Strip those so a
// silent window yields "" (no spurious detection) rather than junk.
export function cleanWhisperOutput(stdout: string): string {
  return stdout
    .split('\n')
    .map((line) => line.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

// Run whisper-cli over one window of PCM and resolve the recognized text. Rejects
// when the binary/model is missing or the process fails; the caller treats a
// failure as "no text this window" and keeps the session alive.
export function runWhisperOnce(pcm: Int16Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const bin = whisperBinaryPath();
    const model = installedModel();
    if (!bin) return reject(new Error('whisper-cli binary not found'));
    if (!model) return reject(new Error('no whisper model installed'));

    const wav = path.join(os.tmpdir(), `pp-whisper-${process.pid}-${Date.now()}.wav`);
    try {
      writeFileSync(wav, encodeWav(pcm, TARGET_SAMPLE_RATE));
    } catch (e) {
      return reject(e instanceof Error ? e : new Error('could not stage audio'));
    }

    const cleanup = () => {
      try {
        rmSync(wav, { force: true });
      } catch {
        /* best-effort */
      }
    };

    const args = [
      '-m', modelPath(model),
      '-f', wav,
      '-nt', // no timestamps — stdout is plain text
      '-l', 'en',
      '-t', String(Math.max(1, Math.min(8, os.cpus().length - 1))),
      // Greedy decoding (whisper-cli defaults to beam-size 5 + best-of 5, which
      // multiplies decode cost for a small latency win in accuracy). Live
      // rolling-window transcription needs to keep up with the 5s window
      // budget more than it needs beam search's marginal WER improvement —
      // this is the same decoding choice whisper.cpp's own real-time examples
      // make. Benchmarked: ~10% faster on top of the model-size choice below.
      '-bs', '1',
      '-bo', '1',
      '-nf', // skip the temperature-fallback retry loop — another latency tax
    ];

    let stdout = '';
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    try {
      const proc = spawn(bin, args, { stdio: ['ignore', 'pipe', 'ignore'] });
      const timer = setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch {
          /* ignore */
        }
      }, WATCHDOG_MS);
      proc.stdout?.on('data', (d: Buffer) => {
        stdout += d.toString();
      });
      proc.on('error', (e) => {
        clearTimeout(timer);
        finish(() => reject(e));
      });
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) finish(() => resolve(cleanWhisperOutput(stdout)));
        else finish(() => reject(new Error(`whisper-cli exited ${code}`)));
      });
    } catch (e) {
      finish(() => reject(e instanceof Error ? e : new Error('whisper spawn failed')));
    }
  });
}

// --- LocalAsr (R6 stable interface) ---------------------------------------

export class WhisperLocalAsr implements LocalAsr {
  readonly agentId = LOCAL_ASR_AGENT_ID;

  isInstalled(): boolean {
    return whisperBinaryPath() !== null && installedModel() !== null;
  }

  modelStatus(): AiModelStatus {
    return whisperModelStatus(this.agentId);
  }

  transcribe(pcm: Int16Array): Promise<string> {
    if (!this.isInstalled()) {
      return Promise.reject(
        new Error(`${this.agentId} model is not installed — local transcription is unavailable`),
      );
    }
    return runWhisperOnce(pcm);
  }
}

// --- AsrSession adapter (live spine) --------------------------------------

export type WhisperSessionOpts = {
  callbacks: AsrSessionCallbacks;
  // Injectable for tests: how a window of PCM becomes text, and the window size.
  run?: (pcm: Int16Array) => Promise<string>;
  windowSamples?: number;
};

// Buffer incoming frames as a chunk queue; once a window's worth has accumulated,
// transcribe it as a single whisper run and emit a FINAL transcript. Runs are
// serialized — while one window processes, frames keep queueing (no overlapping
// whisper procs). The queue is CAPPED: if transcription falls behind (whisper on a
// weak CPU can take longer than real time), the oldest audio is shed rather than
// letting the buffer grow without bound — a renderer can't OOM main this way
// (§5.7). Frames arrive as fresh Int16Arrays (per-IPC clone), so queueing the view
// by reference is safe.
export function createWhisperSession(opts: WhisperSessionOpts): AsrSession {
  const windowSamples = opts.windowSamples ?? WINDOW_SAMPLES;
  // Keep at most a few windows of audio; beyond this the transcriber can't catch up.
  const maxBuffered = windowSamples * 3;
  const run = opts.run ?? runWhisperOnce;
  let chunks: Int16Array[] = [];
  let buffered = 0; // total samples across all chunks
  let processing = false;
  let closed = false;
  let shedding = false;

  // Pull exactly `windowSamples` samples off the front of the chunk queue.
  const takeWindow = (): Int16Array => {
    const out = new Int16Array(windowSamples);
    let filled = 0;
    while (filled < windowSamples && chunks.length > 0) {
      const head = chunks[0];
      const need = windowSamples - filled;
      if (head.length <= need) {
        out.set(head, filled);
        filled += head.length;
        chunks.shift();
      } else {
        out.set(head.subarray(0, need), filled);
        chunks[0] = head.subarray(need);
        filled += need;
      }
    }
    buffered -= windowSamples;
    return out;
  };

  const drain = () => {
    if (closed || processing || buffered < windowSamples) return;
    processing = true;
    const window = takeWindow();
    void run(window)
      .then((text) => {
        if (!closed && text.trim()) opts.callbacks.onTranscript({ text, isFinal: true });
      })
      .catch((e) => {
        log.warn('Whisper window failed (skipped):', e);
      })
      .finally(() => {
        processing = false;
        drain(); // a full window may have accumulated while we were busy
      });
  };

  return {
    agentId: LOCAL_ASR_AGENT_ID,
    pushAudio(pcm: Int16Array) {
      if (closed || pcm.length === 0) return;
      chunks.push(pcm);
      buffered += pcm.length;
      // Shed oldest audio when backed up — bound memory rather than grow it (§5.7).
      while (buffered > maxBuffered && chunks.length > 0) {
        buffered -= chunks.shift()!.length;
        if (!shedding) {
          log.warn('Whisper transcription is falling behind; dropping oldest audio.');
          shedding = true;
        }
      }
      if (buffered <= maxBuffered) shedding = false;
      drain();
    },
    close() {
      closed = true;
      chunks = [];
      buffered = 0;
    },
  };
}

// The single app-wide local ASR backend: the real whisper backend, or the Null
// stub when whisper can't be wired (keeps callers depending on the interface, R6).
export const whisperLocalAsr: LocalAsr = new WhisperLocalAsr();
export { NullLocalAsr };
