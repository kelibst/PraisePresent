# Update e2e + unit tests for the re-laid-out Present screen
- **ID:** 2026-06-29_ux6-e2e-unit-test-update
- **Phase:** 3 (UX fidelity)
- **Assigned agent type:** tester
- **Status:** pending

## Goal
The layout changes in `ux1`–`ux5` move/rename controls the e2e suite targets (the deck rail becomes a
horizontal strip; the scripture mode control may change from a `Keyword` tab to an icon toggle; pane
wrappers change). Done = `tests/e2e/scripture.spec.ts` and `tests/e2e/ai-detect.spec.ts` are updated
to the new DOM, all unit tests pass, and the full suite is green — proving the re-layout did not
break the live scripture flow (stage → Send to Live → audience shows verse → deck navigation).

## Scope (files/areas)
- `tests/e2e/scripture.spec.ts` — update selectors: `Send to Live` button, the keyword search
  affordance (`tab "Keyword"` → whatever `ux3` lands), deck-card click → `goto`, audience text
  assertion. Add an assertion that the deck renders as a horizontal strip with a `LIVE` badge.
- `tests/e2e/ai-detect.spec.ts` — update any Present-screen selectors touched by the re-layout.
- Re-run colocated unit tests (`presentEngine.test.ts`, `scriptureDeck.test.ts`,
  `present.test.ts`) — no source logic changed here, so they should pass unchanged; fix only if a
  shared atom signature moved.
- Coordinate selector contracts with the `ux1`/`ux3` implementers (don't invent selectors they
  didn't ship).

## Rules that apply
- CLAUDE.md §5.8 (e2e for user-facing flows; bug fix → regression test), §6 (DoD — observed running,
  not just compiling), §1.9 (delete dead/duplicated assertions).

## Acceptance criteria
- [ ] `scripture.spec.ts` + `ai-detect.spec.ts` pass against the re-laid-out screen.
- [ ] An e2e assertion covers the horizontal deck strip + `LIVE` badge + click-to-`goto`.
- [ ] All unit tests pass; full `tsc --noEmit` + lint + unit + e2e smoke green.
- [ ] reviewer signed off.

## Outcome (filled on completion)
Done. `scripture.spec` adds horizontal-deck-strip assertions (group role, LIVE badge, click-to-goto
on a 3-slide deck → audience reference changes). `presentation.spec` navigation now asserts the deck
strip's `aria-current` LIVE marker instead of the removed "Slide N/3" counter. `common.test.tsx`
swapped MiniSlideThumb tests for `DeckStripThumb`. Added `deckPassageLabel.test.ts` (5 cases). Full
suite green: 199 unit, 17/17 e2e (entire suite, not just the two touched specs). Reviewer approved.
