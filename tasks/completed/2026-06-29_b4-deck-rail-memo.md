# Deck-rail thumbnail memoization
- **ID:** 2026-06-29_b4-deck-rail-memo
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer
- **Status:** done

## Goal
The cockpit deck rail re-creates every `DeckStripThumb` on each live-state push. Memoize
the thumb and give it a stable click handler (pass `index` + a stable `onSelect`) so a
cursor move only re-renders the two thumbs whose `live`/`selected` actually changed.
Virtualization deferred until decks exceed ~100 slides (not needed for verse decks).

## Scope (files/areas)
- src/renderer/components/common/DeckStripThumb.tsx — `React.memo`; `index`+`onSelect`
- src/renderer/features/present/LiveCockpit.tsx — stable `onSelect`, pass `index`

## Rules that apply
- CLAUDE.md §5.4, §1.9 (one canonical contract). prompt.md §3,§5 (B4 — coordinate w/ ux1).

## Acceptance criteria
- [x] `DeckStripThumb` is `React.memo` with a stable handler contract (no per-row closure).
- [x] e2e deck-strip assertions (goto on click) stay green; tsc clean.

## Outcome (filled on completion)
`DeckStripThumb` is memoized and takes `index` + `onSelect(index)`; LiveCockpit passes a
single stable `onSelect` (= onGoto). Per-row closures removed, so a cursor move only
repaints the changed cards.
