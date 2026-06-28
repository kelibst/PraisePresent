import { detectReferences } from './scriptureDetect';
import { scriptureService } from './scriptureService';
import type { AiCandidate } from '@/shared/schemas/ai';

// AI scripture detector — orchestrates the text path (CLAUDE.md §5, spec §5):
// detect candidate references (pure) → resolve each through the Phase 3
// scriptureService (reuse, no duplicated Bible logic). Candidates that don't
// resolve to real verses are dropped — that's where resolution precision comes
// from. The operator reviews and projects (human-in-the-loop, never auto).
//
// ASR (online cloud + offline whisper) feeds this same pipeline later via a
// transcript; only the audio front-end + an event stream are added then.

export const aiScriptureDetector = {
  submitText(text: string): AiCandidate[] {
    const detected = detectReferences(text);
    const candidates: AiCandidate[] = [];
    for (const d of detected) {
      const verses = scriptureService.resolve(d.ref);
      if (verses.length === 0) continue; // not a real passage → not a candidate
      candidates.push({
        reference: d.canonical,
        type: d.type,
        confidence: d.confidence,
        triggerText: d.triggerText,
        verses,
      });
    }
    return candidates;
  },
};
