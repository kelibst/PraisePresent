import { app } from 'electron';
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import log from '../infra/logger';
import type { AiModelStatus } from '@/shared/schemas/ai';

// Whisper GGUF model download manager (spec §4, P4-T3). Fetches a whisper.cpp
// model into `userData/models/whisper/` so the offline ASR has weights to run.
// MAIN-PROCESS ONLY — the renderer triggers a download over IPC and polls status;
// it never touches the filesystem or network (§1.3). A model is verified by a
// minimum size and an atomic rename from a `.part` temp so a half-download is
// never mistaken for `ready` (§5.7). Once installed, the offline path makes ZERO
// network calls — downloading is the only egress and it is explicit + operator-driven.

export type WhisperModelId = 'tiny' | 'base' | 'small';

export type WhisperModelDef = {
  id: WhisperModelId;
  label: string;
  fileName: string;
  url: string;
  approxBytes: number;
};

// The official whisper.cpp GGML weights on Hugging Face. `.bin` is the format the
// whisper-cli binary loads with `-m`.
const HF_BASE = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main';
export const WHISPER_MODELS: Record<WhisperModelId, WhisperModelDef> = {
  tiny: {
    id: 'tiny',
    label: 'Tiny (~75 MB)',
    fileName: 'ggml-tiny.bin',
    url: `${HF_BASE}/ggml-tiny.bin`,
    approxBytes: 75_000_000,
  },
  base: {
    id: 'base',
    label: 'Base (~142 MB)',
    fileName: 'ggml-base.bin',
    url: `${HF_BASE}/ggml-base.bin`,
    approxBytes: 142_000_000,
  },
  small: {
    id: 'small',
    label: 'Small (~466 MB)',
    fileName: 'ggml-small.bin',
    url: `${HF_BASE}/ggml-small.bin`,
    approxBytes: 466_000_000,
  },
};

export const DEFAULT_WHISPER_MODEL: WhisperModelId = 'base';

// A weights file under this size is treated as a failed/partial download, never
// as installed — guards against a 404 HTML body or a truncated transfer.
const MIN_VALID_BYTES = 1_000_000;

function modelsDir(): string {
  return path.join(app.getPath('userData'), 'models', 'whisper');
}

export function modelPath(id: WhisperModelId): string {
  return path.join(modelsDir(), WHISPER_MODELS[id].fileName);
}

export function isModelInstalled(id: WhisperModelId): boolean {
  try {
    const p = modelPath(id);
    return existsSync(p) && statSync(p).size >= MIN_VALID_BYTES;
  } catch {
    return false;
  }
}

// The best installed model (prefer larger = more accurate), or null if none.
export function installedModel(): WhisperModelId | null {
  for (const id of ['small', 'base', 'tiny'] as WhisperModelId[]) {
    if (isModelInstalled(id)) return id;
  }
  return null;
}

// Single in-flight download (serialized, like the transcode queue). Tracked so
// status polling can report `downloading` + a progress fraction without a push.
let inFlight: { id: WhisperModelId; received: number; total: number } | null = null;

// Whether a download (or any work) is currently in progress.
export function isDownloading(): boolean {
  return inFlight !== null;
}

// Start (and await) a model download. Streams to a `.part` temp with progress,
// then atomically renames into place. Throws on failure (the caller surfaces it);
// the temp is always cleaned up. Refuses a second concurrent download.
export async function downloadModel(
  id: WhisperModelId,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (inFlight) throw new Error('A model download is already in progress');
  const def = WHISPER_MODELS[id];
  const dir = modelsDir();
  mkdirSync(dir, { recursive: true });
  const dest = modelPath(id);
  const tmp = `${dest}.part`;
  inFlight = { id, received: 0, total: def.approxBytes };
  try {
    const res = await fetchImpl(def.url);
    if (!res.ok || !res.body) throw new Error(`Model download failed (${res.status})`);
    const total = Number(res.headers.get('content-length')) || def.approxBytes;
    inFlight.total = total;
    const out = createWriteStream(tmp);
    const reader = res.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          out.write(Buffer.from(value));
          inFlight.received += value.length;
        }
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        out.end((err?: Error | null) => (err ? reject(err) : resolve()));
      });
    }
    if (!existsSync(tmp) || statSync(tmp).size < MIN_VALID_BYTES) {
      throw new Error('Downloaded model is too small — treating as failed');
    }
    renameSync(tmp, dest);
    log.info(`Whisper model ${id} installed → ${dest}`);
  } catch (e) {
    try {
      rmSync(tmp, { force: true });
    } catch {
      /* best-effort */
    }
    log.error(`Whisper model ${id} download failed:`, e);
    throw e;
  } finally {
    inFlight = null;
  }
}

// Project the manager state to the shared model-status shape for a given agent id.
export function whisperModelStatus(agentId: string): AiModelStatus {
  if (inFlight) {
    const progress = inFlight.total > 0 ? Math.min(1, inFlight.received / inFlight.total) : 0;
    return {
      agentId,
      installed: false,
      state: 'downloading',
      detail: `Downloading ${WHISPER_MODELS[inFlight.id].label}…`,
      progress,
    };
  }
  const id = installedModel();
  if (id) {
    return {
      agentId,
      installed: true,
      state: 'ready',
      detail: `${WHISPER_MODELS[id].label} installed`,
    };
  }
  return { agentId, installed: false, state: 'absent', detail: 'No local model downloaded' };
}
