# P3-D5 — Service planning (retire the fixture)
- **ID:** 2026-06-26_p3-d5-service-planning
- **Phase:** 3
- **Assigned agent type:** implementer + reviewer + tester
- **Status:** done

## Goal
Replace the static `servicesData` fixture with real persisted plans of mixed elements (songs/scripture/media/custom); drag-drop reorder; recurring templates; duration estimate. **Retire `src/shared/fixtures/servicesData.ts`.**

## Scope
- `src/main/db/`: plans + plan_items migration; `planRepository`. `src/main/services/planService.ts`. plans IPC + bridge. `src/renderer/features/planning/` (ServicesPage/ServiceDetail use real data, not the fixture).

## Rules
- §1.5, §5.4, §5.5. Depends on D1/D3/D4 for rich element types (custom/text elements work standalone).

## Acceptance
- [ ] build/save/reload/present a real multi-element service
- [ ] `servicesData.ts` deleted; no static data remains; ServicesPage/ServiceDetail read from DB
- [ ] unit + e2e; reviewer sign-off

## Outcome
**2026-06-26.** Real persisted plans replace the fixture. Migration 4 (plans + plan_items, FK cascade); `planRepository` (parameterized, atomic transactions); `planService` + pure `estimateMinutes`; plans IPC (list/get/create/update/delete/estimate, zod-validated) + typed `window.api.plans` bridge. `ServicesPage` lists/creates services; `ServiceDetail` adds song + custom items, reorders (up/down), shows a ~N-min estimate, and presents each element to the audience. **DELETED** `src/shared/fixtures/servicesData.ts` + the Redux store/servicesSlice; removed `@reduxjs/toolkit` + `react-redux` (now unused). **25 unit + 7 e2e** — the plans e2e builds a plan, RESTARTS the app, confirms persistence, presents an element (audience mirrors), and renders the UI. Reviewer **PASS**; applied follow-up (wired estimate to IPC + UI badge).
- **Deferred (non-blocking, MVP):** drag-drop reorder (done as up/down buttons — brief-sanctioned); recurring templates; scripture/media item kinds (land with D1/D4); rich estimate (rough per-kind for now).
