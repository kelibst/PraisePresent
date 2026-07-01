# Double-buffer cross-fade in AudienceView
- **ID:** 2026-06-29_b2-double-buffer-crossfade
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer
- **Status:** done

## Goal
Replace the single fade-from-black opacity toggle with a true two-layer cross-fade so
`dissolve` blends directly (both layers animate together) and `fade` goes through black
(out then in) — they must look different. `cut` is instant. The outermost backdrop
stays solid black so the projector always fails safe to black (§5.7). Black/Blank/Clear
take effect immediately (operator safety).

## Scope (files/areas)
- src/renderer/styles/globals.css — `@keyframes` ppLayerIn/ppLayerOut (opacity only, GPU)
- src/renderer/features/presentation/AudienceView.tsx — layer model + transition timing

## Rules that apply
- CLAUDE.md §5.6 (one global stylesheet, tokens), §5.7 (fail safe to black), §5.4 (a11y).
  Phase brief: prompt.md §3 (B2).

## Acceptance criteria
- [x] Two layers; incoming fades in while outgoing fades out (dissolve) or after (fade).
- [x] `fade` ≠ `dissolve`; `cut` is 0ms; black/blank/clear are immediate.
- [x] Black backdrop always present beneath layers (fail-safe).
- [x] e2e scripture audience assertions stay green; tsc clean.

## Outcome (filled on completion)
AudienceView now renders ≤2 absolutely-positioned slide layers over a permanent black
backdrop, animated with opacity-only keyframes (`ppLayerIn`/`ppLayerOut`). `fade` uses a
half-duration out then a half-duration in (through black); `dissolve` overlaps; `cut` is
instant; black/blank/clear take effect immediately. Bounded to 2 layers under rapid
advance (spacebar mashing).

**Bug found in review + fixed (root cause):** the first cut shared a React key between
the outgoing and incoming layer when the operator navigated BACK to the slide still
fading out (both keyed by the same slide id) → React desynced and ORPHANED a DOM node
that never unmounted, so the audience stayed visible after `black()` even though React
state was correctly black. This broke `presentation.spec.ts`. Fixed by deriving
`renderedOutgoing = outgoing && outgoing.id !== slideId ? outgoing : null` so the two
layer keys are ALWAYS distinct (also avoids a pointless same-slide cross-fade). Root
cause confirmed via DOM-level diagnostics; the exact failing e2e now pass. A regression
assertion (settle-to-single-copy) was added to `scripture.spec.ts`. All 18 e2e green.
