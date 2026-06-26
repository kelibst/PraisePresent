# T3 — Full repository restructure ⭐ centerpiece
- **ID:** 2026-06-26_t3-repository-restructure
- **Phase:** 0
- **Assigned agent type:** restructure
- **Status:** done

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
**2026-06-26.** Restructure complete; `src/` tree matches the Restructure Map. All source moves done via `git mv` (history preserved as renames). Docs consolidated to `docs/` + `docs/revival/` per user decision ("follow the map"); progress docs that the user had pre-organized under `plan/progressfiles/` were moved on into `docs/`.
- **Imports rewired:** `@/lib/*`→`@/renderer/...`, `@/dashboard/*`→`@/renderer/features|components/...`, `@/components/ui`→`@/renderer/components/ui`, css→`./styles/globals.css`, servicesData→`@/shared/fixtures`. Grep confirms zero stale paths.
- **AppLayout** rewired to the kept static `Sidebar` (AnimatedSidebar/SidebarDrawer deleted in T6). Unused `sidebarOpen` state dropped.
- **Configs:** forge entries → `src/main/index.ts` + `src/preload/index.ts`; index.html → `/src/renderer/index.tsx`; `vite.main/preload.config.ts` pin `entryFileNames` to `main.js`/`preload.js` (prevents `index.js` collision; keeps `package.json` main + main's `preload.js` path working — verified `.vite/build/` emits exactly `main.js` + `preload.js`); components.json css/aliases updated; CLAUDE.md §0/§8 links → `docs/revival/`, `docs/Project.md`.
- **Skeleton dirs** created for Phases 2–4 (each tracked via `README.md` rather than a redundant `.gitkeep` — minor, intentional deviation from the brief's "`.gitkeep` + README").
- **Verification:** `tsc --noEmit` = **0 errors in `src/`** (1439 errors are all `node_modules/@types` — TS 4.5.5 cannot parse modern @types; pre-existing toolchain, Phase 1). `lint` = 11 errors, all `import/no-unresolved` on `@/` alias (eslint TS-resolver not configured; pre-existing, Phase 1) + 3 pre-existing warnings; **no new code errors**. `bun run package` succeeds; packaged 188 MB binary launches and renders.
- **Reviewer sign-off:** separate reviewer agent (general-purpose) — **PASS** on all 8 audit items (§9 satisfied; implementer ≠ reviewer).
- **Follow-ups (non-blocking):** (1) `BrowserRouter` still present → T4. (2) Theme-toggle UI lost with AnimatedSidebar; `SettingsPage` exists but is NOT wired into `App.tsx` routes — re-home theme toggle + add `/settings` route in a later UI task. (3) **Phase 0 exit-gate conflict:** "tsc clean" + "lint clean" cannot be met without the Phase 1 TS bump + eslint TS-resolver — flagged to PM/user.
