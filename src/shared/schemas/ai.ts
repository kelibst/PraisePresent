import { z } from 'zod';
import { bibleVerse } from './scripture';

// AI scripture-detection schemas (CLAUDE.md §5.1/§5.3). Phase 4 text path: the
// renderer submits free text (typed/pasted/transcribed) and gets back resolved
// candidate references for the operator to review and project (human-in-the-loop
// — never auto-projected here). ASR (audio) and online LLM modes land later.

export const aiSubmitText = z.object({
  text: z.string().min(1).max(20000),
});

export const detectionType = z.enum(['explicit', 'book_chapter']);

// A detected reference that resolved to real verses, ready for the review queue.
export const aiCandidate = z.object({
  reference: z.string(), // canonical label, e.g. "John 3:16"
  type: detectionType,
  confidence: z.number().min(0).max(1),
  triggerText: z.string(), // the span in the source text that triggered it
  verses: z.array(bibleVerse),
});

export type AiSubmitText = z.infer<typeof aiSubmitText>;
export type DetectionType = z.infer<typeof detectionType>;
export type AiCandidate = z.infer<typeof aiCandidate>;
