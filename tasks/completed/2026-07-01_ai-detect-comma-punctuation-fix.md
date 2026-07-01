# Fix: offline scripture detector misses comma-punctuated spoken references
- **ID:** 2026-07-01_ai-detect-comma-punctuation-fix
- **Phase:** 4
- **Assigned agent type:** implementer
- **Status:** done

## Goal
While standing up the whisper.cpp local ASR backend for live testing, discovered that
`detectReferences()` (`src/main/services/scriptureDetect.ts`) fails to detect references in
naturally-punctuated whisper transcripts, e.g. "Turn with me to the book of John, chapter 3,
verse 16." (commas around the "chapter"/"verse" keywords broke the regex). Verified via a
synthesized-speech round trip: Windows SAPI TTS → built `whisper-cli` (whisper.cpp v1.9.1,
`small` model) → `detectReferences()` → zero matches, vs. the same text with commas stripped
→ correct `John 3:16` match at confidence 0.9.

## Scope (files/areas)
- `src/main/services/scriptureDetect.ts` — `REF_RE`: allow optional commas around the
  "chapter"/"verse" keyword separators (`[\s.]*` → `[\s.,]*`, and `\s+verses?\s+` →
  `[\s,]*verses?\s+`).
- `src/main/services/scriptureDetect.fixtures.ts` — added regression case
  `pos-whisper-punctuated-chapter-verse`.

## Rules that apply
- CLAUDE.md §5.8 (bug fix → regression test first), §5.1 (pure function, no `any`)
- Phase brief: plan/phases/phase-4-ai-scripture-detection.md#T3/T5 (offline explicit-recall
  bar ≥ 0.85 — natural punctuation in real transcripts was silently costing recall)

## Acceptance criteria
- [x] Regression fixture added reproducing the exact whisper-transcribed sentence.
- [x] `scriptureDetect.test.ts` (17), `scriptureAccuracy.test.ts` (8) pass.
- [x] Full unit suite: 335/336 pass — the 1 failure (`modelManager.test.ts` path-separator
      assertion) is pre-existing and unrelated (confirmed via `git stash` + rerun against
      HEAD before this change).
- [x] `tsc --noEmit` clean, eslint clean on changed files.
- [ ] reviewer sign-off (not yet assigned — flag for PM/user before merge)

## Outcome
Small, targeted regex fix + regression test. Not committed (per §5.10, commit only on
request). Root cause confirmed empirically end-to-end: built whisper.cpp v1.9.1 from source
(MinGW-w64 + CMake, no prebuilt binary trusted), downloaded the `small` GGUF model, and fed a
synthesized "chapter N, verse M" utterance through the full local pipeline before finding the
gap in the deterministic extractor — not the ASR.
