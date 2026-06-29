# Convert Present panes to full-bleed hairline-divider cockpit
- **ID:** 2026-06-29_ux2-fullbleed-pane-chrome
- **Phase:** 3 (UX fidelity)
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
The design (`PraisePresent.dc.html` lines 107–549) is a dense, full-bleed cockpit: three flex panes
separated by 1px `border-right` hairline dividers, NO gaps, NO rounded floating cards. The current
`PresentPage` uses `gap-3 p-3` with each pane wrapped in `rounded-lg border` (floating cards). Done =
the Present screen reads as one seamless cockpit with hairline dividers between panes, edge-to-edge,
matching the mockup, while keeping the panes' internal scroll regions and `min-h-0` behaviour.

## Scope (files/areas)
- `src/renderer/features/present/PresentPage.tsx` — replace `grid … gap-3 p-3` with a full-height
  flex row (or gapless grid); panes separated by `border-r border-pp-border-soft`; remove the outer
  `bg-background p-3` padding so panes go edge-to-edge.
- `src/renderer/features/scripture/SearchPane.tsx`, `PreviewSchedulePane.tsx`,
  `src/renderer/features/present/LiveCockpit.tsx` — drop the per-pane `rounded-lg border bg-pp-…`
  outer wrappers (they become full-bleed columns); keep internal headers/sections. The right pane
  uses the slightly darker `pp-surface-live` (`#090d1a`) per design line 482.
- Confirm `PaneHeader` and section borders still divide content correctly without the card frame.

## Rules that apply
- CLAUDE.md §5.6 (one stylesheet, tokens only — `pp-surface-1/2/live`, `pp-border-soft`),
  §5.4 (no behaviour change), §1.9 (no competing layout variants left behind).
- Design source of truth: `PraisePresent.dc.html` lines 107–114 (pane flex ratios + `border-right`),
  482 (right pane `#090d1a`).

## Acceptance criteria
- [ ] No `gap-3`/per-pane `rounded-lg` floating cards on Present; panes are full-bleed with 1px
      `border-r` dividers; content reaches the screen edges.
- [ ] Pane scroll regions and `min-h-0` still work (no overflow/clipping regressions).
- [ ] Right pane uses `pp-surface-live`; left/middle use `pp-surface-1`; tokens only, no hex.
- [ ] `tsc --noEmit` + lint clean; reviewer signed off.

## Outcome (filled on completion)
Done. `PresentPage` grid is gapless/edge-to-edge; the three panes are full-bleed columns separated by
1px `border-r` hairlines. Removed the per-pane `rounded-lg border` card wrappers from `SearchPane`,
`PreviewSchedulePane`, and `LiveCockpit`; right pane uses `pp-surface-live`, left/middle `pp-surface-1`.
Added `min-w-0` + `overflow-hidden` to each pane so a child can never spill into a neighbour (this fixed
a real cross-pane click-interception bug found via e2e at cramped widths). Tokens only. Reviewer
approved.
