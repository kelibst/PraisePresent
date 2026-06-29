# B-shared — Shared screen atoms (SlidePreview, PaneHeader, rows)
- **ID:** 2026-06-28_bshared-screen-atoms
- **Phase:** UX-revival (Stage B)
- **Assigned agent type:** implementer (+ reviewer)
- **Status:** done (pending reviewer)

## Goal
Build the recurring presentational atoms the design reuses across Scripture/Songs/Plans/Present/
Live-Detect so the screen re-skins (B3–B11) consume ONE canonical version (§1.9), not nine forks.
Pure presentational components on B1 tokens — no `window.api` calls, no business logic.

## Scope (files/areas) — new dir `src/renderer/components/common/`
- `SlidePreview.tsx` — the design's 16:9 slide box: radial-gradient bg, centered balanced text
  (container-query sizing via `cqi`), optional reference (bottom-right), optional media (image/video),
  optional corner badge (e.g. "Scripture · read-only" / "Editable"), `size` variant (lg live / sm next),
  optional sage focus-ring for "staged/live". Props are plain data (`{ lines?, reference?, media?, badge?,
  variant }`) — it renders, it does not fetch. This is the SAME visual the AudienceView shows, scaled.
- `PaneHeader.tsx` — the recurring pane header: uppercase tracked label + optional right-side meta/슬ot.
- `ScheduleRow.tsx` — the schedule/plan item row (drag handle slot, type icon, title+meta, duration,
  selected/live state) reused by Scripture's Schedule pane, Plans builder, and Home recent list.
- `MiniSlideThumb.tsx` — the small deck thumbnail (index + first line + reference) used by Present's deck rail.
- `index.ts` — re-exports.

## Rules that apply
- §5.6 (tokens not hex — use B1's `pp-*`/shadcn tokens; container-queries fine), §5.4 (semantic,
  keyboard where interactive), §1.9 (canonical, no competing variant), §5.9 (PascalCase components),
  §1.3 (no electron/node; no `window.api` — these are dumb presentational atoms).

## Acceptance criteria
- [ ] `SlidePreview` renders text/media/reference/badge at lg + sm, 16:9, balanced text, tokenized.
- [ ] `PaneHeader`, `ScheduleRow`, `MiniSlideThumb` exist, tokenized, reusable, prop-driven.
- [ ] No `window.api`/electron/node imports; no hard-coded hex.
- [ ] tsc 0 · lint 0 · format clean · unit green · package builds. Reviewer sign-off.

## Outcome (filled on completion)

## Outcome (2026-06-29 — built; reviewer pending, batched with screens)
Added src/renderer/components/common/: SlidePreview (16:9 cqi-sized scaled twin of AudienceView, media/badge/reference, lg|sm, active ring), PaneHeader, ScheduleRow (type icon+title/meta+duration+selected/live, button when onClick), MiniSlideThumb, index barrel + common.test.tsx. Pure presentational, no window.api/hex. Container-queries via arbitrary utilities (no new dep). Gate: tsc 0 · lint 0 · 162 unit · package OK. Prop signatures handed to B3-B11.
