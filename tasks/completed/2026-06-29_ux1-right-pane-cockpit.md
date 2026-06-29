# Rebuild the Live Output right pane to the design (deck → horizontal strip, single column)
- **ID:** 2026-06-29_ux1-right-pane-cockpit
- **Phase:** 3 (UX fidelity)
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
The right pane must become a SINGLE vertical column matching `PraisePresent.dc.html` lines 482–548:
`ON SCREEN NOW` preview → **horizontal Live Deck thumbnail strip** → `NEXT →` preview → transport
footer. Today `LiveCockpit.tsx` splits the pane into a 180px vertical deck rail + a cockpit column,
so the operator sees a visual 4th column and the deck reads as a side rail (design wants a
horizontal `overflow-x` strip of ~110px cards UNDER the live preview). Done = the right pane renders
as one column, the deck is a horizontal strip with a `LIVE` badge on the current card, clicking a
card still `goto`s that slide, and all keyboard transport + the e2e flow keep working.

## Scope (files/areas)
- `src/renderer/features/present/LiveCockpit.tsx` — remove the `<aside w-[180px]>` vertical rail
  (lines 126–154); restructure `<main>` into the single-column flow: header (`Display 2 · 1080p ·
  <Transition>`), `ON SCREEN NOW` preview + `Scripture · read-only` / `Edit locked` badges,
  horizontal deck strip, `NEXT →` (≈62% width), transport footer (Prev / Next Space / Black B /
  Blank / Clear Esc) with the Cut/Fade/Dissolve segmented control pushed right.
- `src/renderer/components/common/` — add a horizontal deck-thumb variant (or extend
  `MiniSlideThumb`) sized ~110px wide, 16:9 inner, `LIVE` badge top-left (design lines 512–523).
  Keep `SlidePreview` for the ON SCREEN NOW + NEXT cards. Update the `common/index.ts` barrel.
- `src/renderer/features/present/PresentPage.tsx` — adjust grid to `grid-cols-[1.3fr_1fr_1.15fr]`
  (design pane ratios). (Full-bleed divider styling is `ux2`'s job — keep the wrapper minimal here.)

## Rules that apply
- CLAUDE.md §5.4 (keyboard-first; one `present.onState` subscription stays in `usePresentDeck`),
  §5.6 (tokens/atoms only — sage `pp-accent`/`pp-success`, no hard-coded hex), §5.9 (<300 LOC/file).
- §1.9 leave-it-cleaner: no second deck-rail component left behind.
- Design source of truth: `PraisePresent.dc.html` lines 482–548 (esp. 507–523 the Live Deck strip).

## Acceptance criteria
- [ ] Right pane is ONE column; no 180px vertical rail; user sees 3 columns total on Present.
- [ ] Live Deck is a horizontal `overflow-x-auto` strip of ~110px cards; current card shows `LIVE`.
- [ ] Clicking a deck card calls `onGoto(i)`; current slide highlighted with sage tokens.
- [ ] Keyboard transport (Space/←/→/B/Esc/Home/End) unchanged and still ignores text fields.
- [ ] `tsc --noEmit` + lint clean; tests updated/passing (e2e selectors handled in `ux6`).
- [ ] reviewer signed off.

## Outcome (filled on completion)
Done. The right pane is now a single column (`LiveCockpit.tsx`): header → ON SCREEN NOW → horizontal
Live Deck strip → NEXT → transport footer. New `DeckStripThumb` atom (110px card, 16:9 thumb, LIVE
badge) replaces the deleted `MiniSlideThumb` (and its test); the 180px vertical rail is gone. Grid
ratio set to `minmax(0,1.3fr)/minmax(0,1fr)/minmax(0,1.15fr)`. `TransportButton` later extracted to
its own file to keep `LiveCockpit` < 300 LOC (279). Keyboard transport preserved. Verified by e2e
(`scripture.spec` deck-strip + LIVE badge + click-to-goto; `presentation.spec` aria-current nav).
Reviewer approved (§7), no blockers. tsc/lint/199 unit/17 e2e green.
