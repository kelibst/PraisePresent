import { describe, it, expect, vi } from 'vitest';
import {
  createStreamingAsrSession,
  type StreamingConfig,
  type Timers,
  type WebSocketCtor,
  type WebSocketLike,
} from './streamingClient';
import type { AsrSessionCallbacks } from '../asrSession';

// A fake WebSocket so the session is driven without a real socket (matches the
// AnthropicClient injection pattern). Captures sends + exposes lifecycle triggers.
class FakeWebSocket implements WebSocketLike {
  static last: FakeWebSocket | null = null;
  readyState = 0; // CONNECTING
  sent: Array<ArrayBufferView | ArrayBuffer | string> = [];
  closed = false;
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;

  constructor(
    readonly url: string,
    readonly protocols?: string | string[],
  ) {
    FakeWebSocket.last = this;
  }
  send(data: ArrayBufferView | ArrayBuffer | string): void {
    this.sent.push(data);
  }
  close(): void {
    this.closed = true;
    this.readyState = 3;
  }
  open(): void {
    this.readyState = 1;
    this.onopen?.({});
  }
  message(data: unknown): void {
    this.onmessage?.({ data });
  }
}

const Ctor = FakeWebSocket as unknown as WebSocketCtor;

function makeCallbacks(): AsrSessionCallbacks & {
  transcripts: unknown[];
  errors: string[];
  closes: number;
} {
  const transcripts: unknown[] = [];
  const errors: string[] = [];
  let closes = 0;
  return {
    transcripts,
    errors,
    get closes() {
      return closes;
    },
    onTranscript: (t) => transcripts.push(t),
    onError: (m) => errors.push(m),
    onClose: () => {
      closes++;
    },
  };
}

const baseConfig = (over: Partial<StreamingConfig> = {}): StreamingConfig => ({
  agentId: 'fake',
  url: 'wss://example/ws',
  parse: (raw) => (raw === 'hello' ? { text: 'hello', isFinal: true } : null),
  ...over,
});

describe('createStreamingAsrSession', () => {
  it('buffers frames until open, then flushes them in order', () => {
    const cb = makeCallbacks();
    const session = createStreamingAsrSession(baseConfig(), cb, Ctor);
    const ws = FakeWebSocket.last!;

    session.pushAudio(Int16Array.from([1, 2]));
    session.pushAudio(Int16Array.from([3, 4]));
    expect(ws.sent).toHaveLength(0); // queued, not sent — socket not open yet

    ws.open();
    expect(ws.sent).toHaveLength(2);

    session.pushAudio(Int16Array.from([5, 6]));
    expect(ws.sent).toHaveLength(3); // open now → sent immediately
  });

  it('routes parsed transcripts to onTranscript and ignores the rest', () => {
    const cb = makeCallbacks();
    createStreamingAsrSession(baseConfig(), cb, Ctor);
    const ws = FakeWebSocket.last!;
    ws.open();

    ws.message('hello'); // parses to a transcript
    ws.message('ignored'); // parses to null
    ws.message(new ArrayBuffer(4)); // non-string binary frame → skipped

    expect(cb.transcripts).toEqual([{ text: 'hello', isFinal: true }]);
  });

  it('sends the close message then closes the socket', () => {
    const cb = makeCallbacks();
    const session = createStreamingAsrSession(baseConfig({ closeMessage: 'BYE' }), cb, Ctor);
    const ws = FakeWebSocket.last!;
    ws.open();
    session.close();
    expect(ws.sent).toContain('BYE');
    expect(ws.closed).toBe(true);
  });

  it('suppresses the onClose callback after our own close()', () => {
    const cb = makeCallbacks();
    const session = createStreamingAsrSession(baseConfig(), cb, Ctor);
    const ws = FakeWebSocket.last!;
    ws.open();
    session.close();
    ws.onclose?.({}); // the socket's own close event after we asked to close
    expect(cb.closes).toBe(0);
  });

  it('reports an unexpected socket close via onClose', () => {
    const cb = makeCallbacks();
    createStreamingAsrSession(baseConfig(), cb, Ctor);
    const ws = FakeWebSocket.last!;
    ws.open();
    ws.onclose?.({}); // far end dropped, we did NOT call close()
    expect(cb.closes).toBe(1);
  });

  it('schedules + sends keep-alive frames on open', () => {
    let scheduled: (() => void) | null = null;
    const timers: Timers = {
      setInterval: (fn) => {
        scheduled = fn;
        return 1 as unknown as ReturnType<typeof setInterval>;
      },
      clearInterval: vi.fn(),
    };
    const cb = makeCallbacks();
    createStreamingAsrSession(
      baseConfig({ keepAlive: { message: 'PING', intervalMs: 1000 } }),
      cb,
      Ctor,
      timers,
    );
    const ws = FakeWebSocket.last!;
    ws.open();
    expect(scheduled).toBeTypeOf('function');
    scheduled!();
    expect(ws.sent).toContain('PING');
  });

  it('surfaces a socket error via onError', () => {
    const cb = makeCallbacks();
    createStreamingAsrSession(baseConfig(), cb, Ctor);
    const ws = FakeWebSocket.last!;
    ws.onerror?.({});
    expect(cb.errors).toHaveLength(1);
  });
});
