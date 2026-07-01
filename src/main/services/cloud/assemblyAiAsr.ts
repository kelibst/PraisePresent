import { z } from 'zod';
import type { AsrSession, AsrSessionCallbacks, AsrTranscript } from '../asrSession';
import {
  createStreamingAsrSession,
  type Timers,
  type WebSocketCtor,
} from './streamingClient';

// AssemblyAI Universal-Streaming (v3) STT (spec §3.1). MAIN-PROCESS ONLY — socket
// + key here, never the renderer (§1.3/§1.7). Audio is 16 kHz mono pcm_s16le.
// Results arrive as `Turn` messages; `end_of_turn` marks a stabilized segment.
//
// Auth: the key is passed via the `token` query param (v3 accepts the API key as
// the token). It rides wss/TLS and is NEVER logged. A short-lived minted token is
// a hardening follow-up (see the task file); functionally equivalent for testing.

export const ASSEMBLYAI_HOST = 'wss://streaming.assemblyai.com';
const ASSEMBLYAI_WS_PATH = '/v3/ws';

export function buildAssemblyAiUrl(sampleRate: number, apiKey: string): string {
  const params = new URLSearchParams({
    sample_rate: String(sampleRate),
    encoding: 'pcm_s16le',
    format_turns: 'true',
    token: apiKey,
  });
  return `${ASSEMBLYAI_HOST}${ASSEMBLYAI_WS_PATH}?${params.toString()}`;
}

// The slice of a v3 `Turn` message we use. Validated at the boundary (§5.1);
// `Begin`/`Termination`/anything else parses to null.
const assemblyTurn = z.object({
  type: z.literal('Turn'),
  transcript: z.string().default(''),
  end_of_turn: z.boolean().optional(),
  end_of_turn_confidence: z.number().optional(),
});

// PURE parser — exported for unit testing without a socket.
export function parseAssemblyAiMessage(raw: string): AsrTranscript | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = assemblyTurn.safeParse(json);
  if (!parsed.success) return null;
  if (!parsed.data.transcript) return null;
  return {
    text: parsed.data.transcript,
    isFinal: parsed.data.end_of_turn ?? false,
    confidence: parsed.data.end_of_turn_confidence,
  };
}

export type AssemblyAiSessionOpts = {
  apiKey: string;
  sampleRate: number;
  callbacks: AsrSessionCallbacks;
  WebSocketImpl: WebSocketCtor;
  timers?: Timers;
};

export function createAssemblyAiSession(opts: AssemblyAiSessionOpts): AsrSession {
  return createStreamingAsrSession(
    {
      agentId: 'assemblyai',
      url: buildAssemblyAiUrl(opts.sampleRate, opts.apiKey),
      parse: parseAssemblyAiMessage,
      // v3 closes cleanly on a `Terminate` control message.
      closeMessage: JSON.stringify({ type: 'Terminate' }),
    },
    opts.callbacks,
    opts.WebSocketImpl,
    opts.timers,
  );
}
