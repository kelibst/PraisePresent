import { describe, it, expect, vi } from 'vitest';
import { cleanWhisperOutput, createWhisperSession, encodeWav } from './whisperAsr';
import type { AsrTranscript } from './asrSession';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('encodeWav', () => {
  it('writes a valid 16-bit mono WAV header + samples', () => {
    const pcm = Int16Array.from([0, 1, -1, 1000]);
    const wav = encodeWav(pcm, 16000);
    expect(wav.length).toBe(44 + pcm.length * 2);
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.toString('ascii', 36, 40)).toBe('data');
    expect(wav.readUInt16LE(22)).toBe(1); // mono
    expect(wav.readUInt32LE(24)).toBe(16000); // sample rate
    expect(wav.readUInt16LE(34)).toBe(16); // bits per sample
    expect(wav.readInt16LE(44 + 6)).toBe(1000); // 4th sample
  });
});

describe('cleanWhisperOutput', () => {
  it('strips bracketed/parenthesized noise tokens and blank lines', () => {
    expect(cleanWhisperOutput('[BLANK_AUDIO]')).toBe('');
    expect(cleanWhisperOutput('(silence)')).toBe('');
    expect(cleanWhisperOutput('  turn to John 3:16  \n[BLANK_AUDIO]\n')).toBe('turn to John 3:16');
    expect(cleanWhisperOutput('hello\nworld')).toBe('hello world');
  });
});

describe('createWhisperSession', () => {
  it('transcribes once a full window has accumulated, then emits a final segment', async () => {
    const run = vi.fn<(pcm: Int16Array) => Promise<string>>(async () => 'turn to John 3:16');
    const transcripts: AsrTranscript[] = [];
    const session = createWhisperSession({
      callbacks: { onTranscript: (t) => transcripts.push(t), onError: () => {} },
      run,
      windowSamples: 4,
    });

    session.pushAudio(Int16Array.from([1, 2])); // 2 < 4 → no run yet
    expect(run).not.toHaveBeenCalled();

    session.pushAudio(Int16Array.from([3, 4])); // now 4 → one window
    await tick();

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toEqual(Int16Array.from([1, 2, 3, 4]));
    expect(transcripts).toEqual([{ text: 'turn to John 3:16', isFinal: true }]);
  });

  it('does not emit for an empty (silent) window', async () => {
    const run = vi.fn(async () => '   ');
    const transcripts: AsrTranscript[] = [];
    const session = createWhisperSession({
      callbacks: { onTranscript: (t) => transcripts.push(t), onError: () => {} },
      run,
      windowSamples: 2,
    });
    session.pushAudio(Int16Array.from([1, 2]));
    await tick();
    expect(run).toHaveBeenCalledTimes(1);
    expect(transcripts).toHaveLength(0);
  });

  it('caps the buffer (sheds oldest) when transcription stalls — no unbounded growth', async () => {
    let resolveRun: (v: string) => void = () => {};
    const run = vi.fn<(pcm: Int16Array) => Promise<string>>(
      () => new Promise<string>((res) => (resolveRun = res)),
    );
    const session = createWhisperSession({
      callbacks: { onTranscript: () => {}, onError: () => {} },
      run,
      windowSamples: 4, // maxBuffered = 12
    });

    session.pushAudio(Int16Array.from([1, 2, 3, 4])); // first window → run starts (and hangs)
    await tick();
    expect(run).toHaveBeenCalledTimes(1);

    // Flood far beyond the cap while the run is stuck — must not grow unbounded
    // and must not start a second overlapping run.
    for (let i = 0; i < 100; i++) session.pushAudio(Int16Array.from([5, 6, 7, 8]));
    expect(run).toHaveBeenCalledTimes(1);

    // Let the stuck run finish; the next window drains from the (capped) buffer.
    resolveRun('done');
    await tick();
    expect(run.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('stops processing after close()', async () => {
    const run = vi.fn(async () => 'late');
    const transcripts: AsrTranscript[] = [];
    const session = createWhisperSession({
      callbacks: { onTranscript: (t) => transcripts.push(t), onError: () => {} },
      run,
      windowSamples: 2,
    });
    session.close();
    session.pushAudio(Int16Array.from([1, 2]));
    await tick();
    expect(run).not.toHaveBeenCalled();
    expect(transcripts).toHaveLength(0);
  });
});
