import { describe, it, expect } from 'vitest';
import { buildAssemblyAiUrl, parseAssemblyAiMessage } from './assemblyAiAsr';

describe('buildAssemblyAiUrl', () => {
  it('requests 16 kHz pcm_s16le and passes the key as the token param', () => {
    const url = buildAssemblyAiUrl(16000, 'secret-key-123');
    expect(url).toContain('wss://streaming.assemblyai.com/v3/ws');
    expect(url).toContain('encoding=pcm_s16le');
    expect(url).toContain('sample_rate=16000');
    expect(url).toContain('token=secret-key-123');
  });
});

describe('parseAssemblyAiMessage', () => {
  it('extracts an end-of-turn transcript with confidence from a Turn message', () => {
    const raw = JSON.stringify({
      type: 'Turn',
      transcript: 'Romans eight twenty eight',
      end_of_turn: true,
      end_of_turn_confidence: 0.8,
    });
    expect(parseAssemblyAiMessage(raw)).toEqual({
      text: 'Romans eight twenty eight',
      isFinal: true,
      confidence: 0.8,
    });
  });

  it('marks a mid-turn transcript as non-final', () => {
    const raw = JSON.stringify({ type: 'Turn', transcript: 'Romans', end_of_turn: false });
    expect(parseAssemblyAiMessage(raw)?.isFinal).toBe(false);
  });

  it('returns null for Begin/Termination, empty transcript, and junk', () => {
    expect(parseAssemblyAiMessage(JSON.stringify({ type: 'Begin', id: 'x' }))).toBeNull();
    expect(parseAssemblyAiMessage(JSON.stringify({ type: 'Turn', transcript: '' }))).toBeNull();
    expect(parseAssemblyAiMessage('{ not json')).toBeNull();
  });
});
