import type { AiModelStatus } from '@/shared/schemas/ai';
import { modelStatusFor } from './aiOrchestratorState';

// Local (offline) ASR behind a STABLE interface (CLAUDE.md R6, spec §4). The real
// engine is whisper.cpp via a sidecar / napi-rs binding feeding the deterministic
// T1 text extractor — that binary + its GGUF weights are DEFERRED. Everything
// downstream (the orchestrator, the model-download manager, the audio path) is
// coded against this interface so the binary can land later without a rewrite.
//
// `NullLocalAsr` is the not-installed stub the app ships with today: it reports
// `isInstalled() === false` and refuses to transcribe with a clear, typed error
// rather than crashing the live service (§5.7) or faking a "ready" model.

// The whisper-local agent id this ASR backs (matches the built-in registry).
export const LOCAL_ASR_AGENT_ID = 'whisper-local';

// The stable contract every local ASR backend implements. `transcribe` takes raw
// 16-bit PCM mono samples (the audio path's normalized format) and returns the
// recognized text; callers feed that to the T1 extractor.
export interface LocalAsr {
  /** The engine id this backend serves (e.g. 'whisper-local'). */
  readonly agentId: string;
  /** Whether the model is downloaded and usable right now (gates listening). */
  isInstalled(): boolean;
  /** Current download-manager status for this engine's model. */
  modelStatus(): AiModelStatus;
  /** Transcribe a chunk of 16kHz mono PCM. Rejects when not installed. */
  transcribe(pcm: Int16Array): Promise<string>;
}

// The shipped stub: model absent, transcription unavailable. No network, no
// child process, no native dep — it just answers honestly so the UI can offer a
// (currently no-op) download and explain why nothing is listening.
export class NullLocalAsr implements LocalAsr {
  readonly agentId: string;

  constructor(agentId: string = LOCAL_ASR_AGENT_ID) {
    this.agentId = agentId;
  }

  isInstalled(): boolean {
    return false;
  }

  modelStatus(): AiModelStatus {
    // Derive from the registry so installed/absent stays in one place.
    return modelStatusFor(this.agentId);
  }

  transcribe(): Promise<string> {
    // Never silently return empty text (that would read as a successful empty
    // transcription); reject with a typed, actionable error instead (§5.7). The
    // PCM argument is part of the stable interface but unused by the stub.
    return Promise.reject(
      new Error(`${this.agentId} model is not installed — local transcription is unavailable`),
    );
  }
}

// The concrete app-wide local ASR backend now lives in `whisperAsr.ts`
// (`whisperLocalAsr`), which implements this interface over the whisper.cpp
// sidecar + model download manager. This module stays the stable contract (R6)
// plus `NullLocalAsr` for environments where whisper can't be wired.
