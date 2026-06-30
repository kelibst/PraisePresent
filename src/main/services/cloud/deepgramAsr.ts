import { z } from 'zod';
import type { AsrSession, AsrSessionCallbacks, AsrTranscript } from '../asrSession';
import {
  createStreamingAsrSession,
  type Timers,
  type WebSocketCtor,
} from './streamingClient';

// Deepgram live streaming STT (spec §3.1). MAIN-PROCESS ONLY — the socket and the
// API key live here, never in the renderer (§1.3/§1.7). Auth uses the
// `Sec-WebSocket-Protocol: token, <key>` subprotocol so no custom header is
// needed (works with the plain WebSocket main exposes). Audio is 16 kHz mono
// linear16; results come back as JSON `Results` messages.

export const DEEPGRAM_HOST = 'wss://api.deepgram.com';
const DEEPGRAM_LISTEN_PATH = '/v1/listen';

// Build the listen URL. `nova-2` is Deepgram's accurate general model; interim
// results + smart formatting give a live feel and clean numerals ("3:16"), which
// helps the downstream reference detector. Book-name vocabulary biasing (spec
// §3.1) can be added later via `keywords=`; kept out of v1 to stay simple.
export function buildDeepgramUrl(sampleRate: number): string {
  const params = new URLSearchParams({
    encoding: 'linear16',
    sample_rate: String(sampleRate),
    channels: '1',
    model: 'nova-2',
    interim_results: 'true',
    smart_format: 'true',
    punctuate: 'true',
  });
  return `${DEEPGRAM_HOST}${DEEPGRAM_LISTEN_PATH}?${params.toString()}`;
}

// The slice of a Deepgram `Results` message we use. Validated at the boundary
// (untrusted external data, §5.1); anything else (Metadata, etc.) parses to null.
const deepgramResults = z.object({
  type: z.literal('Results'),
  is_final: z.boolean().optional(),
  channel: z.object({
    alternatives: z
      .array(z.object({ transcript: z.string().default(''), confidence: z.number().optional() }))
      .default([]),
  }),
});

// PURE parser — exported for unit testing without a socket. Returns a transcript
// for a non-empty `Results` message, else null.
export function parseDeepgramMessage(raw: string): AsrTranscript | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = deepgramResults.safeParse(json);
  if (!parsed.success) return null;
  const alt = parsed.data.channel.alternatives[0];
  if (!alt || !alt.transcript) return null;
  return { text: alt.transcript, isFinal: parsed.data.is_final ?? false, confidence: alt.confidence };
}

export type DeepgramSessionOpts = {
  apiKey: string;
  sampleRate: number;
  callbacks: AsrSessionCallbacks;
  WebSocketImpl: WebSocketCtor;
  timers?: Timers;
};

export function createDeepgramSession(opts: DeepgramSessionOpts): AsrSession {
  return createStreamingAsrSession(
    {
      agentId: 'deepgram',
      url: buildDeepgramUrl(opts.sampleRate),
      // Subprotocol auth: the server selects `token` and reads the key. The key
      // rides the handshake (wss/TLS), never a logged URL.
      protocols: ['token', opts.apiKey],
      parse: parseDeepgramMessage,
      keepAlive: { message: JSON.stringify({ type: 'KeepAlive' }), intervalMs: 8000 },
      closeMessage: JSON.stringify({ type: 'CloseStream' }),
    },
    opts.callbacks,
    opts.WebSocketImpl,
    opts.timers,
  );
}
