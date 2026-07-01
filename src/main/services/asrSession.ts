// The stable contract between the audio spine and any streaming ASR backend
// (CLAUDE.md R6 — engines sit behind a stable interface). A session is a single
// "listening" lifetime: the orchestrator opens one on Start, pushes 16 kHz mono
// 16-bit PCM frames as the mic produces them, receives transcript results back
// through callbacks, and closes it on Stop / kill-switch / error.
//
// Implementations: the Deepgram + AssemblyAI cloud WebSocket clients (cloud/*.ts)
// and the whisper.cpp local sidecar (whisperAsr.ts). All are MAIN-PROCESS ONLY
// (§1.3) — the renderer only captures audio and streams PCM here over IPC.

// One transcript result from an engine. `isFinal` separates a stabilized segment
// (Deepgram `is_final`, AssemblyAI `end_of_turn`) from an interim partial; the
// detector runs on finals to avoid acting on words the engine may still revise.
export type AsrTranscript = {
  text: string;
  isFinal: boolean;
  confidence?: number; // 0..1 when the engine reports it
};

// How a session reports back to the orchestrator. Pure data — no electron here.
export type AsrSessionCallbacks = {
  onTranscript: (t: AsrTranscript) => void;
  // A recoverable engine error (bad key, network blip). The orchestrator surfaces
  // it and stops listening fail-safe — it never crashes the live service (§5.7).
  onError: (message: string) => void;
  // The engine closed (expected close, or a dropped connection). The orchestrator
  // uses this to drive auto-degrade / reflect listening=false in the UI.
  onClose?: () => void;
};

export interface AsrSession {
  /** The engine id this session serves (for logging / status). */
  readonly agentId: string;
  /** Push one frame of 16 kHz mono 16-bit PCM. Buffered until the engine is ready. */
  pushAudio(pcm: Int16Array): void;
  /** Close the session and release all resources. Idempotent; never throws. */
  close(): void;
}
