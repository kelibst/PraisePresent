import { describe, it, expect } from 'vitest';
import { buildDeepgramUrl, parseDeepgramMessage } from './deepgramAsr';

// The Deepgram message parser is the untrusted boundary (§5.1) — pin it.

describe('buildDeepgramUrl', () => {
  it('requests 16 kHz linear16 mono from the nova-2 model', () => {
    const url = buildDeepgramUrl(16000);
    expect(url).toContain('wss://api.deepgram.com/v1/listen');
    expect(url).toContain('encoding=linear16');
    expect(url).toContain('sample_rate=16000');
    expect(url).toContain('channels=1');
    expect(url).toContain('model=nova-2');
  });
});

describe('parseDeepgramMessage', () => {
  it('extracts a final transcript + confidence from a Results message', () => {
    const raw = JSON.stringify({
      type: 'Results',
      is_final: true,
      channel: { alternatives: [{ transcript: 'turn to John three sixteen', confidence: 0.94 }] },
    });
    expect(parseDeepgramMessage(raw)).toEqual({
      text: 'turn to John three sixteen',
      isFinal: true,
      confidence: 0.94,
    });
  });

  it('marks interim results as non-final', () => {
    const raw = JSON.stringify({
      type: 'Results',
      is_final: false,
      channel: { alternatives: [{ transcript: 'turn to' }] },
    });
    expect(parseDeepgramMessage(raw)?.isFinal).toBe(false);
  });

  it('returns null for an empty transcript, a non-Results message, and junk', () => {
    expect(
      parseDeepgramMessage(
        JSON.stringify({ type: 'Results', channel: { alternatives: [{ transcript: '' }] } }),
      ),
    ).toBeNull();
    expect(parseDeepgramMessage(JSON.stringify({ type: 'Metadata' }))).toBeNull();
    expect(parseDeepgramMessage('not json')).toBeNull();
  });
});
