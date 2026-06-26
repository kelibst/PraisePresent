# P1-T6 — Observability bootstrap (logging, error boundary, crash handling)
- **ID:** 2026-06-26_p1-t6-observability
- **Phase:** 1
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
Make failures visible and survivable: disk logging in main, a renderer error boundary (no white screen / no raw stack on the projector), and main-process crash handlers. (audit O6; CLAUDE.md §5.7.)

## Scope (files/areas)
- `src/main/infra/logger.ts` — `electron-log` setup (file transport); use it in `src/main/index.ts`.
- `src/renderer/app/` — top-level React **error boundary** wrapping `<AppRouter/>`; actionable fallback UI, not a stack trace.
- `src/main/index.ts` — handle `render-process-gone` / `child-process-gone`; never let an unhandled rejection kill a live service.
- Add `electron-log` dependency.

## Rules that apply
- CLAUDE.md §5.7 (electron-log, error boundary, crash handling, audience path fails safe)
- Phase brief: plan/phases/phase-1-toolchain.md#t6

## Acceptance criteria
- [ ] Logs write to disk (verify path/output)
- [ ] A thrown renderer error shows the boundary fallback, not a white screen
- [ ] Main survives a simulated renderer crash (logged, not fatal)
- [ ] `tsc`/lint clean; reviewer signed off

## Outcome (filled on completion)
