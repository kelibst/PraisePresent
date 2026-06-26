# P3-D5 — Service planning (retire the fixture)
- **ID:** 2026-06-26_p3-d5-service-planning
- **Phase:** 3
- **Assigned agent type:** implementer + reviewer + tester
- **Status:** pending

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
