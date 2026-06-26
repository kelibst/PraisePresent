# P2-T2 — SQLite + migrations + repository layer
- **ID:** 2026-06-26_p2-t2-sqlite-migrations-repos
- **Phase:** 2
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
Truth lives in SQLite (§1.5). `better-sqlite3` connection at the userData path, a forward-only migration runner on app start, a repository base + `settingsRepository` reference. Wire the `settings` IPC handler (T1) to read/write through the repo; demote Redux to a view-cache fed by `window.api`.

## Scope (files/areas)
- `src/main/db/connection.ts` — better-sqlite3 at `app.getPath('userData')`.
- `src/main/db/migrations/` — forward-only, idempotent runner on startup; `0001_init.sql` (settings table).
- `src/main/db/repositories/` — base + `settingsRepository` (parameterized queries only).
- `src/main/services/settingsService.ts` — used by the T1 settings handler.
- Renderer `settings` slice reads through `window.api` (not seed data).

## Rules that apply
- CLAUDE.md §1.5 (truth in SQLite), §5.5 (repository layer, forward-only migrations, parameterized)
- Phase brief: plan/phases/phase-2-foundation.md#t2

## Acceptance criteria
- [ ] DB file created on first run; migrations apply + are idempotent
- [ ] Settings persist across an app restart
- [ ] Parameterized queries only; no SQL string interpolation
- [ ] `better-sqlite3` rebuilds for Electron's ABI; `auto-unpack-natives` packages it (R3)
- [ ] reviewer sign-off

## Outcome (filled on completion)
