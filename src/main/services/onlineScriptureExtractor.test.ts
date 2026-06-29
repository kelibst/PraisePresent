import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  onlineScriptureExtractor,
  parseToolUse,
  createAnthropicClient,
  REPORT_SCRIPTURE_TOOL,
  EXTRACTION_MODEL,
  type AnthropicClient,
  type RawRef,
} from './onlineScriptureExtractor';
import { scriptureService } from './scriptureService';
import type { BibleVerse } from '@/shared/schemas/scripture';

// Unit tests for the online extractor. The Anthropic transport is MOCKED — no
// real network is ever exercised here (CLAUDE.md §5.8). We stub the resolver so
// the test is independent of the SQLite Bible: "John 3:16" / "Romans 8" resolve,
// everything else does not, which exercises the drop-unresolved precision gate.

const JOHN_316: BibleVerse = {
  bookNumber: 43,
  bookName: 'John',
  chapter: 3,
  verse: 16,
  text: 'For God so loved the world...',
};

const ROMANS_8_1: BibleVerse = {
  bookNumber: 45,
  bookName: 'Romans',
  chapter: 8,
  verse: 1,
  text: 'There is therefore now no condemnation...',
};

beforeEach(() => {
  vi.spyOn(scriptureService, 'resolve').mockImplementation((ref) => {
    if (ref.bookNumber === 43 && ref.chapter === 3 && ref.verseStart === 16) return [JOHN_316];
    if (ref.bookNumber === 45 && ref.chapter === 8) return [ROMANS_8_1];
    return [];
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockClient(refs: RawRef[]): AnthropicClient {
  return { extract: vi.fn(async () => refs) };
}

describe('onlineScriptureExtractor.extract (mocked client)', () => {
  it('maps a tool call to resolved candidates', async () => {
    const client = mockClient([
      { reference: 'John 3:16', type: 'explicit', confidence: 0.95, triggerText: 'john 3 16' },
    ]);
    const out = await onlineScriptureExtractor.extract(client, 'turn to john three sixteen');
    expect(out).toHaveLength(1);
    expect(out[0].reference).toBe('John 3:16');
    expect(out[0].type).toBe('explicit');
    expect(out[0].confidence).toBe(0.95);
    expect(out[0].verses).toEqual([JOHN_316]);
  });

  it('drops references that do not resolve to real verses (precision)', async () => {
    const client = mockClient([
      { reference: 'John 3:16', type: 'explicit', confidence: 0.9, triggerText: '' },
      { reference: 'Hesitations 9:99', type: 'explicit', confidence: 0.8, triggerText: '' },
      { reference: 'Genesis 99:99', type: 'explicit', confidence: 0.7, triggerText: '' },
    ]);
    const out = await onlineScriptureExtractor.extract(client, 'some transcript');
    expect(out.map((c) => c.reference)).toEqual(['John 3:16']);
  });

  it('resolves a book/chapter mention', async () => {
    const client = mockClient([
      { reference: 'Romans 8', type: 'book_chapter', confidence: 0.6, triggerText: 'romans eight' },
    ]);
    const out = await onlineScriptureExtractor.extract(client, 'the book of romans chapter eight');
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('book_chapter');
    expect(out[0].verses).toEqual([ROMANS_8_1]);
  });

  it('returns [] for empty/whitespace transcript without calling the client', async () => {
    const client = mockClient([]);
    const out = await onlineScriptureExtractor.extract(client, '   ');
    expect(out).toEqual([]);
    expect(client.extract).not.toHaveBeenCalled();
  });

  it('fails safe to [] when the transport throws (resilience §5.7)', async () => {
    const client: AnthropicClient = {
      extract: vi.fn(async () => {
        throw new Error('network down');
      }),
    };
    const out = await onlineScriptureExtractor.extract(client, 'john 3:16');
    expect(out).toEqual([]);
  });
});

describe('parseToolUse', () => {
  it('extracts references from a well-formed tool_use response', () => {
    const refs = parseToolUse({
      content: [
        { type: 'text', text: 'ignored' },
        {
          type: 'tool_use',
          name: REPORT_SCRIPTURE_TOOL.name,
          input: {
            references: [{ reference: 'John 3:16', type: 'explicit', confidence: 0.9 }],
          },
        },
      ],
    });
    expect(refs).toHaveLength(1);
    expect(refs[0].reference).toBe('John 3:16');
    expect(refs[0].triggerText).toBe(''); // defaulted
  });

  it('returns [] when no matching tool_use block is present', () => {
    expect(parseToolUse({ content: [{ type: 'text', text: 'hi' }] })).toEqual([]);
    expect(parseToolUse({ content: [] })).toEqual([]);
    expect(parseToolUse({})).toEqual([]);
    expect(parseToolUse('garbage')).toEqual([]);
  });

  it('returns [] for a tool_use whose input fails schema validation', () => {
    const refs = parseToolUse({
      content: [
        {
          type: 'tool_use',
          name: REPORT_SCRIPTURE_TOOL.name,
          input: { references: [{ reference: 'John 3:16', confidence: 'high' }] },
        },
      ],
    });
    expect(refs).toEqual([]);
  });
});

describe('createAnthropicClient — offline / no network in unit tests', () => {
  it('the OFFLINE path makes zero network calls (fetch is never invoked)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    // The offline orchestration path uses only the injected (mock) client and
    // the resolver — it must never touch fetch.
    const client = mockClient([
      { reference: 'John 3:16', type: 'explicit', confidence: 0.95, triggerText: '' },
    ]);
    await onlineScriptureExtractor.extract(client, 'john three sixteen');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('the real client sends a tool-use request to the Anthropic API with the key', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              type: 'tool_use',
              name: REPORT_SCRIPTURE_TOOL.name,
              input: {
                references: [{ reference: 'John 3:16', type: 'explicit', confidence: 0.9 }],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const client = createAnthropicClient('sk-test-secret');
    const refs = await client.extract('turn to john 3:16');
    expect(refs).toHaveLength(1);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('api.anthropic.com');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-test-secret');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe(EXTRACTION_MODEL);
    expect(body.tool_choice).toEqual({ type: 'tool', name: REPORT_SCRIPTURE_TOOL.name });

    fetchSpy.mockRestore();
  });

  it('throws (not leaking the body) on a non-OK response', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('unauthorized detail', { status: 401 }));
    const client = createAnthropicClient('bad-key');
    await expect(client.extract('john 3:16')).rejects.toThrow(/401/);
    fetchSpy.mockRestore();
  });
});
