import log from '../../infra/logger';
import type { AsrSession, AsrSessionCallbacks, AsrTranscript } from '../asrSession';

// Shared plumbing for a streaming cloud ASR over a WebSocket (Deepgram, AssemblyAI).
// MAIN-PROCESS ONLY (§1.3): the renderer never opens these — it only streams PCM
// to main, which owns the socket + the API key. The provider-specific bits (URL,
// auth, message shape) live in the per-provider modules; everything generic —
// buffer-until-open, keep-alive, graceful close, fail-safe error handling — is here.
//
// The WebSocket constructor is INJECTED (`WebSocketCtor`) so tests pass a fake and
// never touch the network, matching the AnthropicClient injection pattern.

// A structural subset of the WHATWG/undici WebSocket — enough to send audio and
// receive text frames — so we depend on neither the DOM lib nor a `ws` package.
export interface WebSocketLike {
  readyState: number;
  send(data: ArrayBufferView | ArrayBuffer | string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
}
export type WebSocketCtor = new (url: string, protocols?: string | string[]) => WebSocketLike;

const WS_OPEN = 1; // WebSocket.OPEN per the spec — avoids needing the static constant.

// Cap frames buffered before the socket opens so a never-connecting session can't
// grow memory without bound (~200 × 100 ms frames ≈ 20 s of audio).
const MAX_PENDING_FRAMES = 200;

export type StreamingConfig = {
  agentId: string;
  url: string;
  protocols?: string[];
  /** Parse a text frame into a transcript result, or null to ignore it. */
  parse: (raw: string) => AsrTranscript | null;
  /** Optional periodic keep-alive frame (e.g. Deepgram's `{"type":"KeepAlive"}`). */
  keepAlive?: { message: string; intervalMs: number };
  /** Optional graceful-close frame sent before the socket is closed. */
  closeMessage?: string;
};

// Injectable timers keep the session unit-testable without real wall-clock waits.
export type Timers = {
  setInterval: (fn: () => void, ms: number) => ReturnType<typeof setInterval>;
  clearInterval: (h: ReturnType<typeof setInterval>) => void;
};
const realTimers: Timers = { setInterval, clearInterval };

export function createStreamingAsrSession(
  cfg: StreamingConfig,
  callbacks: AsrSessionCallbacks,
  WebSocketImpl: WebSocketCtor,
  timers: Timers = realTimers,
): AsrSession {
  const pending: Int16Array[] = [];
  let ws: WebSocketLike | null = null;
  let keepAliveHandle: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stopKeepAlive = () => {
    if (keepAliveHandle !== null) {
      timers.clearInterval(keepAliveHandle);
      keepAliveHandle = null;
    }
  };

  try {
    ws = new WebSocketImpl(cfg.url, cfg.protocols);
  } catch {
    // Construction can throw (bad URL, no global WebSocket). Fail safe — and do
    // NOT log the error object: for AssemblyAI the key rides the URL query, and a
    // thrown WebSocket error can embed that URL, which would land the secret in
    // the log files (§1.7). A generic message is enough to diagnose.
    log.error(`ASR ${cfg.agentId}: could not open the transcription socket`);
    callbacks.onError('Could not open the transcription connection');
    return { agentId: cfg.agentId, pushAudio: () => {}, close: () => {} };
  }

  ws.onopen = () => {
    if (closed || !ws) return;
    for (const frame of pending) {
      try {
        ws.send(frame);
      } catch {
        /* drop a frame rather than crash the live service */
      }
    }
    pending.length = 0;
    if (cfg.keepAlive) {
      keepAliveHandle = timers.setInterval(() => {
        if (ws && ws.readyState === WS_OPEN) {
          try {
            ws.send(cfg.keepAlive!.message);
          } catch {
            /* ignore */
          }
        }
      }, cfg.keepAlive.intervalMs);
    }
  };

  ws.onmessage = (ev) => {
    if (typeof ev.data !== 'string') return; // we only consume text (JSON) frames
    try {
      const result = cfg.parse(ev.data);
      if (result && result.text.trim()) callbacks.onTranscript(result);
    } catch (e) {
      log.warn(`ASR ${cfg.agentId}: unparseable message —`, e);
    }
  };

  ws.onerror = () => {
    // The WHATWG error event carries no useful detail; keep the message generic
    // (and never echo a URL/key). The orchestrator stops listening fail-safe.
    log.error(`ASR ${cfg.agentId}: socket error`);
    callbacks.onError('Transcription connection error');
  };

  ws.onclose = () => {
    stopKeepAlive();
    if (!closed) callbacks.onClose?.();
  };

  return {
    agentId: cfg.agentId,
    pushAudio(pcm: Int16Array) {
      if (closed || !ws) return;
      if (ws.readyState === WS_OPEN) {
        try {
          ws.send(pcm);
        } catch {
          /* a single dropped frame is survivable */
        }
      } else if (pending.length < MAX_PENDING_FRAMES) {
        pending.push(pcm);
      }
    },
    close() {
      if (closed) return;
      closed = true;
      stopKeepAlive();
      pending.length = 0;
      if (ws) {
        try {
          if (cfg.closeMessage && ws.readyState === WS_OPEN) ws.send(cfg.closeMessage);
          ws.close();
        } catch {
          /* ignore */
        }
        ws = null;
      }
    },
  };
}
