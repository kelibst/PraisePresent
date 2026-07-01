import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AsrSession, AsrSessionCallbacks } from './asrSession';

// Live audio-spine integration: a transcript arriving from an ASR session must flow
// through the EXISTING deterministic detector + resolver and be pushed to the
// presenter review queue — never the audience (R8). The engine itself is faked
// (no socket/child process); secrets, the window manager, and the resolver are
// mocked so this runs under Node (§5.8).

const store = new Map<string, string>();
vi.mock('../infra/secrets', () => ({
  secrets: {
    set: vi.fn((k: string, v: string) => store.set(k, v)),
    get: vi.fn((k: string) => store.get(k) ?? null),
    has: vi.fn((k: string) => store.has(k)),
    delete: vi.fn((k: string) => void store.delete(k)),
    isAvailable: vi.fn(() => true),
  },
}));

// Hoisted so the mock factory (itself hoisted above the imports) can reference it.
const { sendToPresenter } = vi.hoisted(() => ({ sendToPresenter: vi.fn() }));
vi.mock('../windows/windowManager', () => ({ sendToPresenter }));

// Resolve any reference to a single fake verse so candidates are produced without
// a real Bible DB. The detector still does the DETECTION (pure) itself.
vi.mock('./scriptureService', () => ({
  scriptureService: {
    resolve: vi.fn(() => [
      { translation: 'KJV', book: 'John', bookNumber: 43, chapter: 3, verse: 16, text: 'For God…' },
    ]),
  },
}));

import { CHANNELS } from '@/shared/constants/channels';
import {
  aiScriptureDetector,
  setSessionFactory,
  setConnectivityCheck,
} from './aiScriptureDetector';

let captured: AsrSessionCallbacks | null = null;
let fakeSession: { agentId: string; pushAudio: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };

function startCloudListening() {
  aiScriptureDetector.setApiKey('deepgram', 'dg-key');
  aiScriptureDetector.setOnline(true);
  aiScriptureDetector.setAgent('deepgram');
  return aiScriptureDetector.startListening();
}

function pushed(channel: string) {
  return sendToPresenter.mock.calls.filter((c) => c[0] === channel).map((c) => c[1]);
}

beforeEach(() => {
  store.clear();
  sendToPresenter.mockClear();
  captured = null;
  setConnectivityCheck(() => true);
  aiScriptureDetector.setEnabled(true);
  aiScriptureDetector.setTranscriptOnly(false);
  aiScriptureDetector.setAgent('praisepresent-local');
  aiScriptureDetector.setOnline(false);
  setSessionFactory((agentId, callbacks) => {
    captured = callbacks;
    fakeSession = { agentId, pushAudio: vi.fn(), close: vi.fn() };
    return fakeSession as unknown as AsrSession;
  });
});

describe('aiScriptureDetector — live transcript path', () => {
  it('opens a session on start and routes PCM frames to it', () => {
    expect(startCloudListening().listening).toBe(true);
    const frame = Int16Array.from([1, 2, 3]);
    aiScriptureDetector.pushAudio(frame);
    expect(fakeSession.pushAudio).toHaveBeenCalledWith(frame);
  });

  it('detects + resolves a final transcript and pushes a transcript + candidates', () => {
    startCloudListening();
    captured!.onTranscript({ text: 'turn to John 3:16', isFinal: true });

    const transcripts = pushed(CHANNELS.ai.transcript);
    const candidates = pushed(CHANNELS.ai.candidates);
    expect(transcripts).toHaveLength(1);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].length).toBeGreaterThan(0);
    expect(candidates[0][0].reference).toContain('John 3:16');
  });

  it('ignores interim (non-final) results', () => {
    startCloudListening();
    captured!.onTranscript({ text: 'turn to John 3:16', isFinal: false });
    expect(pushed(CHANNELS.ai.transcript)).toHaveLength(0);
    expect(pushed(CHANNELS.ai.candidates)).toHaveLength(0);
  });

  it('transcript-only shows the transcript but suppresses candidates', () => {
    startCloudListening();
    aiScriptureDetector.setTranscriptOnly(true);
    captured!.onTranscript({ text: 'turn to John 3:16', isFinal: true });
    expect(pushed(CHANNELS.ai.transcript)).toHaveLength(1);
    expect(pushed(CHANNELS.ai.candidates)).toHaveLength(0);
  });

  it('auto-degrades to the offline default (keeps listening) when a cloud socket drops', () => {
    startCloudListening();
    expect(aiScriptureDetector.status().activeAgentId).toBe('deepgram');
    captured!.onClose!(); // far end dropped — a mid-service connectivity loss
    const status = aiScriptureDetector.status();
    expect(status.activeAgentId).toBe('praisepresent-local'); // silent fallback (spec §7)
    expect(status.online).toBe(false);
    expect(status.listening).toBe(true); // kept listening on the offline engine
    expect(pushed(CHANNELS.ai.statusChanged).length).toBeGreaterThan(0);
  });

  it('a session error stops listening and pushes the updated status', () => {
    startCloudListening();
    expect(aiScriptureDetector.status().listening).toBe(true);
    captured!.onError('Transcription connection error');
    const status = aiScriptureDetector.status();
    expect(status.listening).toBe(false);
    expect(status.lastError).toMatch(/connection error/i);
    // The UI is notified of the main-initiated stop.
    expect(pushed(CHANNELS.ai.statusChanged).length).toBeGreaterThan(0);
  });

  it('stop after a frame: a late frame is dropped (no throw, not routed)', () => {
    startCloudListening();
    aiScriptureDetector.stopListening();
    expect(() => aiScriptureDetector.pushAudio(Int16Array.from([9]))).not.toThrow();
    expect(fakeSession.pushAudio).not.toHaveBeenCalled();
  });
});
