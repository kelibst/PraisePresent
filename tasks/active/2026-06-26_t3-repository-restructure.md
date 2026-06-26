# T3 — Full repository restructure ⭐ centerpiece
- **ID:** 2026-06-26_t3-repository-restructure
- **Phase:** 0
- **Assigned agent type:** restructure
- **Status:** pending

## Goal
Move every file to its target location per the Restructure Map, preserving git history (`git mv`), and rewire all imports/config so `tsc --noEmit`, `npm start`, and `npm run make` behave identically. Folds in T6 (dead-code deletion). This is the gate every later phase builds on.

## Scope (files/areas)
- Moves per the Restructure Map table (verified accurate against current tree):
  - `src/main.ts` → `src/main/index.ts`
  - `src/preload.ts` → `src/preload/index.ts`
  - `src/renderer.tsx` → `src/renderer/index.tsx`
  - `src/renderer/App.tsx` → `src/renderer/app/App.tsx` (router → `app/router.tsx` in T4; providers → `app/providers.tsx`)
  - `src/lib/store.ts` → `src/renderer/store/index.ts`
  - `src/lib/servicesSlice.ts` → `src/renderer/store/slices/servicesSlice.ts`
  - `src/lib/theme.tsx` → `src/renderer/lib/theme.tsx`
  - `src/lib/utils.ts` → `src/renderer/lib/utils.ts`
  - `src/lib/servicesData.ts` → `src/shared/fixtures/servicesData.ts`
  - `src/dashboard/AppLayout.tsx` → `src/renderer/components/layout/AppLayout.tsx`
  - `src/dashboard/Sidebar.tsx` → `src/renderer/components/layout/Sidebar.tsx` (**keep**)
  - `src/dashboard/Homepage.tsx` → `src/renderer/features/home/HomePage.tsx`
  - `src/dashboard/ServicesPage.tsx` → `src/renderer/features/planning/ServicesPage.tsx`
  - `src/dashboard/ServiceDetail.tsx` → `src/renderer/features/planning/ServiceDetail.tsx`
  - `src/dashboard/SettingsPage.tsx` → `src/renderer/features/settings/SettingsPage.tsx`
  - `src/components/ui/*.tsx` → `src/renderer/components/ui/*.tsx`
  - `src/index.css` + `src/styles/globals.css` → `src/renderer/styles/globals.css` (**consolidate**, T6)
  - root docs (`Project.md`, `development-plan.md`, `activities.md`, `Progress1.md`, `Progress-old.md`, `SystemDiagram.md`, `PraisePresent_Diagrams.mermaid`, `design.png`) → `docs/`
  - `revival/` → `docs/revival/`
- Config updates (do not miss): `forge.config.ts` (`src/main/index.ts`, `src/preload/index.ts`), `index.html` (`/src/renderer/index.tsx`), `vite.renderer.config.ts` (`@`→`./src`), `tsconfig.json` (`@/*`→`./src/*`, `include` covers `src/**`), `components.json` (`css` → `src/renderer/styles/globals.css`; aliases if ui/utils moved).
- Create skeleton dirs with `.gitkeep` + short `README.md` per the brief's "Create" list (main/{windows,ipc,db,services,infra}, preload, renderer/features/{scripture,songs,media,presentation}, shared/{types,schemas,constants}, audience, tests/e2e).
- Update CLAUDE.md §8 links pointing at `revival/` → `docs/revival/`.

## Rules that apply
- CLAUDE.md §5.2 (process boundaries), §5.9 (files/naming), §1.9 (delete dead code)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t3

## Acceptance criteria
- [ ] Tree matches the Restructure Map; resulting top-level layout matches the brief
- [ ] `git status` shows moves as renames (history preserved)
- [ ] `tsc --noEmit` clean; `npm run lint` clean; no orphaned/`../../../` imports
- [ ] `npm start` and `npm run make` work identically to the `v0.1.0-baseline` tag
- [ ] T6 deletions done (see T6 task); only one sidebar, one stylesheet remain
- [ ] reviewer confirms tree vs map; reviewer signed off

## Outcome (filled on completion)
<final tree notes, config edits, any deviations>
