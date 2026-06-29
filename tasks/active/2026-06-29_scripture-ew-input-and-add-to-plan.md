# EasyWorship-style reference input + add-to-plan (T1–T3, T5)
- **ID:** 2026-06-29_scripture-ew-input-and-add-to-plan
- **Phase:** 3 (D1 Scripture)
- **Assigned agent type:** implementer (+ reviewer + security — both signed off)
- **Status:** in-progress (implementation + tests done; reviewer + security PASS; pending commit)

## Goal
Make the Scripture reference field feel like EasyWorship 2009: never blank (defaults to Genesis
1:1), single-keystroke nearest-book selection, Space completes the book and advances to
chapter/verse, the space form ("John 3 16") resolves with no Enter, invalid complete references
show a quiet inline hint, and a staged passage can be added to the active service.

## Scope (files/areas)
- `src/main/services/scriptureReference.ts` (+ test) — verse separator now accepts ":" OR
  whitespace, so "John 3 16" / "1 John 2 5" / "Gen 1 1-3" parse. Backward-compatible (colon still
  works; AI detector callers unaffected). (T1)
- `src/renderer/features/scripture/bookMatch.ts` (+ test) — pure nearest-book matching over the
  loaded book list (name/abbreviation prefix, canonical order). No main-process import (§5.2). (T1)
- `src/renderer/features/scripture/ReferenceMode.tsx` — rewritten: never-empty/Genesis 1:1 default
  (restored on blur), nearest-book auto-select + dropdown, Space-completes-book, debounced live
  resolve (request-id race guard), quiet validation hint on zero-result complete refs. (T2/T3)
- `src/renderer/features/scripture/SearchPane.tsx` — stable onResolve callback (reviewer fix).
- `src/renderer/features/scripture/PreviewSchedulePane.tsx` — enabled "Add to service" button. (T5)
- `src/renderer/features/present/PresentPage.tsx` — addStagedToPlan: append one scripture PlanItem
  (existing kind), plans.update, then refresh. (T5)
- `src/renderer/features/planning/useActiveService.ts` — added refresh(). (T5)
- `src/renderer/features/present/LiveCockpit.tsx` — isTextEntry now also returns true for SELECT, so
  a focused translation switcher never lets 'b' black the projector (live-safety). 
- `tests/e2e/scripture.spec.ts` — new EW-input e2e; updated default-reference expectation.

## Rules that apply
- §1.3 window.api only · §5.2 process boundaries (pure renderer matcher) · §5.4 hooks
- §5.5 reuse repository/service, no duplicated Bible logic · §1.9 one way · §5.8 tests
- §5.7 projector fails safe (empty results, never throws; switch never auto-projects)

## Acceptance criteria
- [x] Field never blank; defaults to Genesis 1:1 and auto-stages it.
- [x] "j" selects nearest J book; Space completes book; "John 3 16" resolves with no Enter.
- [x] Invalid complete reference shows a quiet hint, not a blank/crash.
- [x] Staged passage adds to the active service as a scripture item; schedule refreshes.
- [x] Focused SELECT no longer triggers transport shortcuts (no accidental black).
- [x] tsc 0 · lint 0 · prettier clean · 257 unit tests · scripture e2e 3/3.
- [x] Reviewer sign-off — PASS. Security sign-off — PASS.
- [ ] Commit (shared with the multi-translation task; PM has unrelated in-flight work).

## Outcome (filled on completion)
Implemented and verified locally; reviewer + security both PASS. Renderer-only for T2/T3/T5 (plus the
pure parser regex tweak in main, covered by unit tests). No new IPC channel (add-to-plan reuses
plans.update; translation/active-service reuse settings IPC). No PM-owned files touched. Remaining:
fold into the commit alongside the Bible bundles.
