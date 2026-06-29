# B7 — Plans / Service Planning re-skin (3-pane)
- **ID:** 2026-06-29_b7-plans-screen · **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin the planning feature to the design's 3-pane workspace: services list · service builder
(ordered plan items, reorder, estimate, Present) · item preview. Real data. Route stays `/services`.

## Scope
- `src/renderer/features/planning/` — `ServicesPage.tsx` + `ServiceDetail.tsx` (rework into the 3-pane
  layout; the list + the builder + preview can be one page or the existing list+detail composition).
  Do NOT change `useActiveService.ts` (A6 hook — consume it; the design's active-service ties to TopBar).
- Data: `plans.list/get/create/update/delete/estimate`; `songs.list`/`get` (add-song); `present.setDeck`.
  Shared atoms: `ScheduleRow` (plan items + service rows), `SlidePreview` (item preview), `PaneHeader`.

## Rules
§1.3 (window.api only), §5.4 (keyboard/aria + reorder operable), §5.6 (tokens + atoms, no hex), §1.9. Size to content/h-full.

## Acceptance
- [ ] Pane 1 services (`plans.list`, New); Pane 2 builder (`plans.get`, items as ScheduleRow, reorder up/down, estimate badge, Present); Pane 3 selected-item preview (SlidePreview).
- [ ] Add/remove items, reorder (`plans.update`), present (`present.setDeck`) all wired; sets the active service.
- [ ] Existing `plans.spec.ts` still passes (build, save, reload, present a plan).
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)

**Status: implemented (pending reviewer sign-off).** Re-skinned planning to the 3-pane workspace.

**Layout/routing decision.** Kept the existing nested routing (`/services` index + `/services/:id`)
so both `plans.spec.ts` (direct nav to `#/services/:id`) and `shell.spec.ts` (`#/services/999999`
not-found) flows survive unchanged. `ServicesPage.tsx` now owns the full-height 3-col grid
(`grid-cols-[1fr_1.35fr_1fr]`, `h-full min-h-0`, `bg-background p-3`) and renders Pane 1 (Services
list) + `<Outlet/>`. `ServiceDetail.tsx` renders Panes 2 (Builder) + 3 (Preview) as two `<section>`s
that fill the right two grid columns; at the index route an `EmptyBuilder` (`col-span-2`) prompts to
pick a service. Sizes to `h-full` inside the shell's scrollable `main` (no `min-h-screen`).

**Files changed:**
- `src/renderer/features/planning/ServicesPage.tsx` — 3-pane grid + Pane 1 (PaneHeader "Services" +
  sage "New"; service rows via `ScheduleRow`, selected tint; `plans.list`/`plans.create`).
- `src/renderer/features/planning/ServiceDetail.tsx` — Pane 2 builder (PaneHeader = service name as
  `<h2>` + "Total ~N min" badge + sage "Present"; items as `ScheduleRow` with drag affordance,
  up/down/remove in the trailing slot, click-to-select; dashed "Add item" popover = Custom +
  song library) and Pane 3 preview (`SlidePreview` of the selected item + details card).

**Data wiring (window.api only, §1.3).** estimate → `plans.estimate` (badge); reorder/add/remove →
`plans.update` (reindex sortOrder) + re-estimate; present → `present.setDeck` (song = multi-slide
deck via `blocksToDeck`, custom = `singleSlideDeck`); active-service → consumes `useActiveService`
read-only and calls its `setActiveService(id)` setter on select / create / deep-link load (so the
TopBar selector + Scripture schedule follow). No new channels; `useActiveService.ts` untouched.

**Tokens/atoms.** Sage `pp-accent`/`pp-accent-hover`, `pp-surface-*`, `pp-text-*`, `pp-error` tokens
only (no hex). Reused shared atoms `PaneHeader`, `ScheduleRow`, `SlidePreview`. Keyboard/aria:
ScheduleRow is a real button; reorder/remove buttons have aria-labels + stopPropagation; Add-item
popover closes on outside-click/Escape (§5.4).

**Tests.** `tsc --noEmit` 0 · `lint` 0 · `format`/`format:check` clean · unit `vitest` 170 passed.
e2e (packaged build): `plans.spec.ts` ✓ (heading "Sunday AM" preserved via the `<h2>` label),
`shell.spec.ts` ✓ ("Service not found." + back link, no "Loading…" hang). Observed render verified
at 1400px (all 3 panes correct). The 2 failing e2e specs (`media.spec.ts`, `display.spec.ts`) are
unrelated parallel-agent work (B6 Media re-skin / display) — they do not touch planning.

**Divergences for the PM batch:** none required by plans/shell specs — their selectors/flows are
preserved. Service-row meta shows the schedule date (`PlanSummary` has no item count without the
full plan); item count would need a `plans.list` shape change, left out of scope.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
