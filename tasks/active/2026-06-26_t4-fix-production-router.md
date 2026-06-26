# T4 — Fix production router bug (B1)
- **ID:** 2026-06-26_t4-fix-production-router
- **Phase:** 0
- **Assigned agent type:** implementer
- **Status:** pending

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
<router approach chosen, packaged verification notes>
