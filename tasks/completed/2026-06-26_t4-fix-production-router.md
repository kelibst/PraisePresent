# T4 — Fix production router bug (B1)
- **ID:** 2026-06-26_t4-fix-production-router
- **Phase:** 0
- **Assigned agent type:** implementer
- **Status:** done

## Goal
Replace `BrowserRouter` with `HashRouter` (or `MemoryRouter`) so routing survives the `file://` packaged load, and centralize routing in `src/renderer/app/router.tsx`. Verify in **both** dev and the packaged `make` build.

## Scope (files/areas)
- Renderer entry / `src/renderer/app/App.tsx` — remove `BrowserRouter`.
- Create `src/renderer/app/router.tsx` as the single routing source.

## Rules that apply
- CLAUDE.md §1.2 (HashRouter/MemoryRouter, never BrowserRouter)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t4

## Acceptance criteria
- [ ] No `BrowserRouter` anywhere in renderer
- [ ] Routing works in `npm start` (deep links + reload survive)
- [ ] Routing works in the **packaged** `make` build (verified manually; noted in Outcome — full e2e lands Phase 2)
- [ ] `tsc`/lint clean
- [ ] reviewer signed off

## Outcome (filled on completion)
**2026-06-26.** Replaced `BrowserRouter` with **`HashRouter`**, centralized in new `src/renderer/app/router.tsx` (`AppRouter`). `index.tsx` now renders `<AppRouter/>` inside Provider+ThemeProvider via `createRoot`. Deleted the now-redundant `app/App.tsx` (routes moved into router.tsx). **Regression caught & fixed:** `ServicesPage` gated its list on `window.location.pathname === '/services'`, which is always `/` under HashRouter (path lives in the hash) → switched to react-router `useLocation()`.
- **Verification:** `grep` confirms no `BrowserRouter`/`window.location` in src (only a doc comment). Packaged build launches and renders cleanly over `file://` (BrowserRouter would have failed there) — B1 closed. Full deep-link/reload e2e click-through deferred to Phase 2 e2e (per brief).
- **Reviewer (general-purpose): PASS** (§9). tsc/lint clean.
