# P4-T1 — AI scripture detection: deterministic extractor + text path + Live Detect panel
- **ID:** 2026-06-27_p4-t1-detection-core-text
- **Phase:** 4
- **Assigned agent type:** implementer + reviewer + security
- **Status:** in-progress

## Goal
The buildable-now core of Phase 4: detect scripture references from TEXT (typed/pasted), resolve them through the existing Phase 3 `scriptureService`, and surface them in an operator review queue that stages to the audience on one click. Human-in-the-loop by default — never auto-project (R8). No network, no audio, no secrets — fully offline + unit/e2e verifiable here. ASR (online + offline) and the accuracy harness are separate, dependency-gated tasks.

## Scope (files)
- `src/main/services/scriptureDetect.ts` — PURE extractor: spoken-number normalization, book-alias matching (REUSE the book table from `scriptureReference.ts`, don't duplicate), reference grammar → `DetectedReference[]`. + `scriptureDetect.test.ts`.
- `src/shared/schemas/ai.ts` — `detectedReference`, `submitText` input zod schemas.
- `src/shared/constants/channels.ts` — `ai: { submitText }`.
- `src/main/services/aiScriptureDetector.ts` — orchestrator (text path): extract → resolve via `scriptureService` → candidates.
- `src/main/ipc/aiHandlers.ts` + register in `ipc/index.ts`.
- `src/preload/index.ts` + `api.d.ts` — `window.api.ai.submitText`.
- `src/renderer/features/ai/LiveDetectPage.tsx` (+ route + sidebar) — textarea → candidate queue → present.

## Rules
- §1.3/§5.2 (detection/resolve in main; renderer calls window.api only), §5.3 (zod IPC), §5.5/§5.8 (pure logic in its own module, unit-tested without native DB), §5.7 (fail safe; never crash on junk input), §5.4 (keyboard/accessible — operated live). Spec §4.2/§5. **Reuse `scriptureService` — no duplicated Bible logic.** Security sign-off (new IPC).

## Acceptance
- [ ] Typed text with explicit refs (digits + common spoken forms) → correct references in the review queue.
- [ ] One click stages a detected verse to the audience (existing present deck). Default never auto-projects.
- [ ] Extractor unit-tested (digits-in-prose, chapter/verse phrasing, ordinal books, basic spoken numbers, junk → no false refs).
- [ ] e2e: submitText via window.api → candidates → present → audience mirrors.
- [ ] reviewer + security sign-off; UI observed (e2e).

## Outcome (2026-06-27 — DONE, reviewer PASS + security SIGN-OFF)
Built the buildable-now core of Phase 4: detect scripture references in TEXT → resolve through the existing scripture domain → operator review queue → one-click project (never auto, R8). Fully offline, no secrets.
- **Deterministic extractor** (`scriptureDetect.ts`, PURE/unit-tested): spoken-number normalization ("John three sixteen"→3:16, "Romans eight twenty-eight"→8:28, "one hundred nineteen"→119), book matching REUSING the exported `BOOKS` table (§1.9 — no duplicate Bible data), ordinal/roman prefixes (first/second/third, i/ii/iii), multiword books, ranges (`-`/to/through), punctuation tolerance, range/chapter clamping, dedup. A `DETECTOR_STOPWORDS` set excludes ambiguous 2-letter English-word aliases (is/so/am/ex/re/…) from DETECTION only (parser keeps them). `MAX_CANDIDATES=100` cap bounds DB fan-out.
- **Pipeline:** `ai:submit-text` zod IPC → `aiScriptureDetector` → `scriptureService.resolve(ref)` (new structured resolver reusing the repo); candidates that don't resolve to real verses are dropped (resolution precision). Bridge `window.api.ai.submitText`.
- **UI:** `LiveDetectPage` (`/detect` route + sidebar "Live Detect"): textarea → "Detect references" → review queue with High/Medium/Low confidence, preview, matched span → click to project.
- **Tests:** `scriptureDetect.test.ts` 17 cases (spoken/digit/ordinal/multiword/ranges/punctuation/junk/false-positive guards); `tests/e2e/ai-detect.spec.ts` (digit+spoken detect, resolution-precision drop of John 99:99, UI detect→project); shell.spec +/detect. All green: tsc 0 · lint 0 · **82 unit · 14 e2e**.
- **Reviews:** reviewer PASS (after fixing the English-word-alias false-positive finding + adding regression tests), security SIGN-OFF (renderer boundary clean, zod-bounded input, no ReDoS [20k cap, no nested quantifiers], zero network egress, fail-safe). Open non-blocking nits: 3+ trailing spoken numbers; coarse confidence — deferred.
- **Deferred Phase-4 tasks filed (dependency-gated):** T2 online STT+Claude tool-use (keys), T3 offline whisper.cpp (binaries/models), T4 auto-degrade/privacy/kill-switch (depends T2+T3), T5 accuracy/latency harness (sermon corpus).
</content>
</invoke>
