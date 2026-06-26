# T6 — Dead code & duplication purge (D1–D5)
- **ID:** 2026-06-26_t6-dead-code-purge
- **Phase:** 0
- **Assigned agent type:** restructure (folds into T3)
- **Status:** pending

## Goal
Remove leftover template/duplicate files so there is exactly one sidebar and one global stylesheet, with no references to anything deleted. Executed as part of the T3 restructure pass.

## Scope (files/areas)
- Delete `src/renderer.ts` (leftover Forge template entry; real entry is `renderer.tsx`).
- Delete `src/pages/Home.tsx` (unreferenced).
- Delete `src/dashboard/AnimatedSidebar.tsx` (duplicate sidebar).
- Delete `src/dashboard/SidebarDrawer.tsx` (duplicate sidebar).
- Consolidate `src/index.css` + `src/styles/globals.css` → one `src/renderer/styles/globals.css` (with T3).

## Rules that apply
- CLAUDE.md §1.9 (delete dead code), §5.6 (one global stylesheet)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t6

## Acceptance criteria
- [ ] All four files deleted; no remaining imports/references to them
- [ ] Exactly one sidebar and one `globals.css` remain
- [ ] `tsc` clean
- [ ] reviewer confirmed no orphaned references

## Outcome (filled on completion)
<files removed, css merge notes>
