# P3-D2 — Presentation engine
- **ID:** 2026-06-26_p3-d2-presentation-engine
- **Phase:** 3
- **Assigned agent type:** implementer + reviewer + tester
- **Status:** in-progress

## Goal
Slide model + renderer; transitions (fade/cut/dissolve) at ≥30 fps; presenter preview (current + next); live controls + keyboard shortcuts (§5.4); black/blank/clear from main.

## Scope
- Extend the Phase 2 present:* model: slide deck, transitions, presenter preview pane, keyboard live controls. `src/renderer/features/presentation/`.

## Rules
- §5.4 (keyboard, operated under pressure), §5.7 (fail safe to black). Perf budget in CI (transition fps).

## Acceptance
- [ ] a deck presents dual-screen with transitions ≥30 fps
- [ ] keyboard navigation covers all live controls
- [ ] audience fails safe to black
- [ ] reviewer sign-off; UI **observed running**

## VERIFICATION LIMIT
- Transition fps + visual smoothness need observed/visual verification (and ideally a 2nd display).

## Design decisions (PM, 2026-06-26)
- **Single source of truth stays in MAIN** (windowManager `liveState`, §5.3). Extend `PresentState` from a single slide to a **live deck**: `{ mode, deck: Slide[], index, transition }`. Main broadcasts ONE `present:state` to BOTH windows; audience renders `deck[index]` (or black/blank/clear), presenter renders `deck[index]` (current) + `deck[index+1]` (next). Both are views (§5.4).
- **Slide model (MVP):** `Slide = { id, lines: string[], reference?: string }` (text + optional reference label; media backgrounds are D4). `Transition = { type: 'cut'|'fade'|'dissolve', durationMs }`.
- **New IPC (additive to present namespace):** `present:set-deck` (deck+startIndex), `present:next`, `present:prev`, `present:goto` (index), plus `present:black`/`present:blank`/`present:clear`. Each mutates main's live state + re-broadcasts. Keep `present:set-state` working or migrate callers — whichever is cleaner; MUST update ALL existing callers (songs/scripture/plans present buttons) so tsc stays green.
- **Transitions** are renderer-side CSS opacity/compositor transitions in AudienceView (GPU-composited → inherently ≥60fps; `cut` = 0ms). fps/visual smoothness is OBSERVED-verified (single display here); e2e captures screenshots as rendering evidence. A CI fps gate is aspirational — note it, don't build a flaky harness.
- **Keyboard live controls** (presenter, operated under pressure §5.4): →/Space next, ← prev, `B` black, `.`/`Esc` clear, `Home`/`End` first/last. Visible, accessible, no focus traps.
- **Closes D1 follow-up (a):** scripture present builds a MULTI-VERSE deck (one slide per verse/chunk). D1 follow-up (b) chapter-browse stays deferred.
- **Fail-safe preserved:** audience still defaults to + falls back to black; empty deck / out-of-range index → black, never a crash (§5.7).

## Outcome (impl DONE 2026-06-26 — one hardware-gated acceptance item pending)
Presentation engine shipped. **Reviewer PASS + Security SIGN-OFF** (separate agents; implementer did not self-review — §7).

**Built:** live model extended from a single slide to a **deck** — `PresentState = { mode, deck: Slide[], index, transition }`, `Slide = { id, lines[], reference? }`, `Transition = { type: 'cut'|'fade'|'dissolve', durationMs: 0..2000 }`. Source of truth stays in MAIN (`windowManager`); a PURE reducer (`src/main/services/presentEngine.ts`, Vitest-tested) handles next/prev/goto with clamping + empty-deck fail-safe; `broadcastState()` now pushes to BOTH presenter + audience windows. New zod-validated IPC: `present:set-deck/next/prev/goto/black/blank/clear/get-state` (removed `present:set-state`). `AudienceView` renders `deck[index]` with compositor opacity transitions, **provably fails safe to black** (reviewer traced every branch). New presenter `PresentationPage.tsx` (`/present`): current+next preview, thumbnail goto, transition picker, live buttons, **keyboard controls** (→/Space next, ← prev, b black, ./Esc clear, Home/End) that don't hijack typing and clean up on unmount (§5.4).

**Migrated all present callers off the old single-slide model:** scripture → multi-verse deck (closes D1 follow-up a); songs → section deck; plans → deck/single-slide. **Reviewer should-fix applied:** `blocksToDeck` made index-stable (was dropping empty sections → click index desync) with a label placeholder + a proving unit test. Nit: End-key uses a clamp sentinel (main is truth). "blank = dim" is intentional (smooth resume), confirmed.

**Gate:** tsc 0 · lint 0 · format clean · **62 Vitest unit** (was 38) · **10 Playwright-Electron e2e** (was 8; e2e drives the real bridge, asserts deck nav / black / blank / clear / empty-deck-fail-safe + screenshots a presented slide) · package OK.

**REMAINING ACCEPTANCE ITEM (hardware-gated, brief VERIFICATION LIMIT):** human observed dual-monitor run to confirm transition **fps/visual smoothness (≥30fps)** and true second-screen placement/fullscreen + hot-plug. Cannot be verified in this single-display headless env. Transition approach is correct (opacity-only on `will-change:opacity`, compositor-driven, keyed by slide id). **Pending with the user.** Code/review/auto-tests are complete; this item is perceptual + needs the user's hardware.
