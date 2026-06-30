import { z } from 'zod';
import { scriptureService } from './scriptureService';
import { parseReference } from './scriptureReference';
import log from '../infra/logger';
import type { AiCandidate, DetectionType } from '@/shared/schemas/ai';

// Online (cloud) scripture reference extractor — MAIN PROCESS ONLY (CLAUDE.md
// §1.3/§5.2). Sends a rolling transcript window to Claude with TOOL USE so the
// model returns *structured* references (not prose), then resolves each raw ref
// through the existing scriptureService (NO duplicated Bible logic). References
// that don't resolve to real verses are dropped — that's the precision gate.
//
// The Anthropic transport is injected behind the `AnthropicClient` interface so
// unit tests pass a MOCK and never touch the network. The real client
// (`createAnthropicClient`) uses main-side `fetch` against the Anthropic
// Messages API; the API key lives in OS secure storage and is read here only —
// it never crosses to the renderer (§1.7).

// Cost-appropriate model for live extraction. Spec §3.2 calls for a Haiku-class
// model for speed; escalation to a larger model on ambiguous segments is a
// later optimization. Exact id per the claude-api reference.
export const EXTRACTION_MODEL = 'claude-haiku-4-5';

// The Anthropic API host — added to the CSP connect-src allow-list (main only).
export const ANTHROPIC_API_HOST = 'https://api.anthropic.com';
const ANTHROPIC_MESSAGES_URL = `${ANTHROPIC_API_HOST}/v1/messages`;

// A raw reference as the model reports it: a free-text label plus the type and
// the model's confidence. Resolution happens here, not in the model.
export const rawRef = z.object({
  reference: z.string().min(1), // e.g. "John 3:16", "Romans 8"
  type: z.enum(['explicit', 'book_chapter']),
  confidence: z.number().min(0).max(1),
  triggerText: z.string().default(''),
});
export type RawRef = z.infer<typeof rawRef>;

// The structured output the model must emit. We validate the tool input at the
// boundary (untrusted external data, §5.1) and tolerate a partial/garbled tool
// call by dropping the offending entries rather than throwing.
export const reportScriptureInput = z.object({
  references: z.array(rawRef).default([]),
});

// The injected transport. `extract` takes a transcript window and returns the
// raw references the model found. Implementations: the real fetch-based client,
// or a test mock. Throwing is allowed — the caller fails safe to [].
export type AnthropicClient = {
  extract(transcript: string): Promise<RawRef[]>;
};

// The tool definition handed to Claude. A single tool the model MUST call to
// report what it found; tool use guarantees a structured payload, not prose.
export const REPORT_SCRIPTURE_TOOL = {
  name: 'report_scripture_references',
  description:
    'Report every scripture reference mentioned in the transcript. Include explicit ' +
    'references (e.g. "John 3:16", "first Corinthians thirteen") and book/chapter ' +
    'mentions (e.g. "the book of Romans, chapter 8"). Do NOT invent references that ' +
    'were not spoken. Confidence is your certainty the reference was actually cited.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      references: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            reference: { type: 'string', description: 'Canonical-ish label, e.g. "John 3:16"' },
            type: {
              type: 'string',
              enum: ['explicit', 'book_chapter'],
              description: 'explicit = book+chapter+verse; book_chapter = book+chapter only',
            },
            confidence: { type: 'number', description: '0..1 certainty this was cited' },
            triggerText: { type: 'string', description: 'The spoken span that triggered it' },
          },
          required: ['reference', 'type', 'confidence'],
        },
      },
    },
    required: ['references'],
  },
} as const;

const SYSTEM_PROMPT =
  'You extract Bible scripture references from a live sermon transcript. ' +
  'Call the report_scripture_references tool with every reference you find. ' +
  'If none are present, call it with an empty array. Never reply with prose.';

// Map a raw model ref to a resolved candidate via the EXISTING resolver. Returns
// null when the reference does not resolve to real verses (drop it — precision).
function resolveRawRef(raw: RawRef): AiCandidate | null {
  const ref = parseReference(raw.reference);
  if (!ref) return null;
  const verses = scriptureService.resolve(ref);
  if (verses.length === 0) return null;
  return {
    reference: raw.reference,
    type: raw.type as DetectionType,
    confidence: raw.confidence,
    triggerText: raw.triggerText,
    verses,
  };
}

export const onlineScriptureExtractor = {
  // Extract + resolve. Pure orchestration over the injected client: get raw refs,
  // resolve each through scriptureService, drop the unresolvable ones. Never
  // throws — a transport failure yields [] so the live service stays up (§5.7).
  async extract(client: AnthropicClient, transcript: string): Promise<AiCandidate[]> {
    if (!transcript.trim()) return [];
    let raws: RawRef[];
    try {
      raws = await client.extract(transcript);
    } catch (e) {
      log.error('Online extraction failed:', e);
      return [];
    }
    const out: AiCandidate[] = [];
    for (const raw of raws) {
      const candidate = resolveRawRef(raw);
      if (candidate) out.push(candidate);
    }
    return out;
  },
};

// --- real transport (main only) -------------------------------------------
// A thin Anthropic Messages-API client over main-side fetch. Tool use forces a
// structured response; we parse the tool_use input and validate it with zod
// (untrusted external data). The key is passed in by the caller (read from
// secure storage in main) — it is NEVER logged and NEVER returned to the
// renderer. Streaming is omitted: the extraction call is short and a rolling
// window is small, so a single non-streaming request is simplest and well under
// any timeout. (Real-time streaming STT audio capture stays deferred — P4-T2.)
export function createAnthropicClient(apiKey: string): AnthropicClient {
  return {
    async extract(transcript: string): Promise<RawRef[]> {
      const res = await fetch(ANTHROPIC_MESSAGES_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: EXTRACTION_MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: [REPORT_SCRIPTURE_TOOL],
          tool_choice: { type: 'tool', name: REPORT_SCRIPTURE_TOOL.name },
          messages: [{ role: 'user', content: transcript }],
        }),
      });

      if (!res.ok) {
        // Don't leak the body (could echo request detail); surface status only.
        throw new Error(`Anthropic request failed: ${res.status}`);
      }

      const body: unknown = await res.json();
      return parseToolUse(body);
    },
  };
}

// Pull the report_scripture_references tool input out of a Messages-API
// response and validate it. Exported for unit testing the parser in isolation.
export function parseToolUse(body: unknown): RawRef[] {
  const message = z
    .object({
      content: z.array(z.unknown()).default([]),
    })
    .safeParse(body);
  if (!message.success) return [];

  for (const block of message.data.content) {
    const tu = z
      .object({
        type: z.literal('tool_use'),
        name: z.string(),
        input: z.unknown(),
      })
      .safeParse(block);
    if (!tu.success || tu.data.name !== REPORT_SCRIPTURE_TOOL.name) continue;

    const parsed = reportScriptureInput.safeParse(tu.data.input);
    if (!parsed.success) return [];
    return parsed.data.references;
  }
  return [];
}
