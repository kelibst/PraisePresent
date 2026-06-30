# A5 — Text-level accuracy harness (Phase-4 T5 seed)
- **ID:** 2026-06-28_a5-text-accuracy-harness
- **Phase:** 4
- **Assigned agent type:** tester (separate reviewer to follow)
- **Status:** done

## Goal
Build the **text-level** half of the Phase-4 accuracy harness (P4-T5): a labeled fixture corpus + a
metrics function (precision / recall / F1 / false-positives-per-unit) over the existing deterministic
`scriptureDetect` extractor, wired as a **Vitest regression gate**. The full 5–10h labeled *audio*
corpus + book-name WER stays deferred (needs real recordings) — this seeds it. Zero overlap with the
A1 orchestrator files.

## Scope (files/areas)
- `src/main/services/scriptureDetect.eval.ts` (or `tests/fixtures/scriptureDetectCorpus.ts`) — a
  labeled fixture set: `{ text, expected: Reference[] }[]` covering explicit digit refs, spoken-number
  forms ("John three sixteen"), ordinal/roman books, multiword books, ranges, punctuation noise, and
  an **adversarial/near-miss set** (book-like English words, junk → expect no refs).
- `src/main/services/scriptureAccuracy.ts` — PURE metrics: given detector output vs labels, compute
  precision/recall/F1 + false-positive count. Reuse the extractor from `scriptureDetect.ts`; do not
  re-implement extraction.
- `src/main/services/scriptureAccuracy.test.ts` — runs the corpus through the extractor + asserts
  metrics meet a **floor** (e.g. recall ≥ 0.9, FP = 0 on the adversarial set) so regressions fail CI.

## Rules that apply
- CLAUDE.md §5.8 (Vitest, regression test gate), §5.2 (pure logic, no native DB needed), spec §6.3.
- Reuse the existing `scriptureDetect` extractor + its `BOOKS` table — no duplication.

## Acceptance criteria
- [ ] Corpus has ≥ 20 labeled cases incl. an adversarial no-false-positive subset.
- [ ] Metrics function unit-tested; the gate asserts floors and fails on regression.
- [ ] tsc 0 · lint 0 · unit green.
- [ ] reviewer sign-off.

## Outcome (2026-06-28 — DONE, reviewer SIGN OFF)
Added `scriptureDetect.fixtures.ts` (31-case labeled corpus: 20 positive incl. spoken hundreds/roman-ordinal/
multiword/ranges/clamp, 11 adversarial no-FP), pure `scriptureAccuracy.ts` (precision/recall/F1 + FP, no native
deps), and `scriptureAccuracy.test.ts` gate (floors: recall ≥0.9, precision ≥0.95, F1 ≥0.9, adversarial FP=0 hard
+ a clean-sweep lock). Live extractor scores P/R/F1 = 1.000 (TP=22, FP=0, FN=0). Reviewer verified metric math +
label correctness by hand. Gate: tsc 0 · lint 0 · 106 unit. Full audio corpus + book-name WER stay deferred (P4-T5).
**Non-blocking nit:** drop the two unused exported helper types in the fixtures file (`ReferenceLabel`,
`_LabeledReference`) in a later cleanup pass (§1.9).
