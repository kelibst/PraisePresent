# Deck/cursor channel split + client reconciler + rev
- **ID:** 2026-06-29_b1-deck-cursor-split
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer (security review REQUIRED — §7)
- **Status:** done

## Goal
Make transport actions O(cursor), not O(whole deck). Split the single
`present:state` push into `present:deck` (full deck + `rev`, sent only on
setDeck/setBackground/updateText/black) and `present:cursor`
(`{rev,index,mode,transition}`, sent on next/prev/goto/black/blank/clear/
setTransition). A pure client reconciler caches the deck by `rev` and applies cursor
deltas locally, re-exposing the SAME unified `PresentState` so `usePresentDeck`/
`AudienceView` change minimally. Add a `setTransition` action so changing a
transition no longer round-trips the whole deck (fixes audit #2).

## Scope (files/areas)
- src/shared/constants/channels.ts — add `deck`,`cursor`,`setTransition`; drop `state`
- src/shared/schemas/present.ts — add `rev` to presentState/FAILSAFE; deck/cursor payloads
- src/shared/present/reconciler.ts (+ .test.ts) — pure merge w/ rev ordering guard
- src/main/services/presentEngine.ts — bump `rev` on deck-changing actions; `setTransition`
- src/main/windows/windowManager.ts — split broadcast (deck-first ordering)
- src/main/ipc/presentHandlers.ts — `present:set-transition` handler
- src/preload/index.ts — reconciler-backed `onState` + `setTransition`
- src/preload/api.d.ts — add `setTransition`

## Rules that apply
- CLAUDE.md §1.3/§1.4 (no privileged power in renderer; security on), §5.2 (preload =
  thin bridge — reconciler is pure merge glue, no DB/network/validation), §5.3 (main is
  source of truth, re-clamps), §5.7 (fail safe to black). Phase brief: prompt.md §3 (B1).

## Acceptance criteria
- [x] Transport (next/prev/goto/blank/clear/setTransition) broadcasts cursor only.
- [x] Deck broadcast only on deck-changing actions; `rev` bumped; deck sent before cursor.
- [x] Reconciler ignores a superseded cursor (rev < cached) and buffers a future cursor.
- [x] `onState` API unchanged for consumers; getState seeds a late subscriber.
- [x] zod re-validation no longer on the per-cursor hot path.
- [x] Unit tests for reducer rev + reconciler; tsc clean; existing tests green.
- [x] security reviewer sign-off (§7)

## Outcome (filled on completion)
Implemented as scoped. `rev` distinguishes deck vs cursor broadcasts in
`dispatchPresent`. Reconciler is pure + unit-tested (ordering guard via rev; 9 cases).
Preload keeps a single deck/cursor subscription and fans out unified `PresentState`;
consumers untouched. `setTransition` is now a cursor-only action.
**Review:** security reviewer SIGNED OFF (no findings — no privileged power in renderer,
main re-clamps, fail-safe-to-black + locked-slide preserved, CSP/sandbox untouched).
Correctness reviewer verified the reconciler ordering logic. Perf harness measured
advance latency p95 ≈ 5–9 ms on a 200-slide deck (was O(deck)). 218 unit + 18 e2e green.
