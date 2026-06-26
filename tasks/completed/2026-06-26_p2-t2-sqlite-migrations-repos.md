# P2-T2 — SQLite + migrations + repository layer
- **ID:** 2026-06-26_p2-t2-sqlite-migrations-repos
- **Phase:** 2
- **Assigned agent type:** implementer
- **Status:** done

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
**2026-06-26.** better-sqlite3 connection at userData (WAL, FK on); forward-only idempotent migration runner (`_migrations` table) on startup with migrations 1 (settings) + 2 (secrets); `settingsRepository` (parameterized queries, UPSERT) backs the settings IPC handler — truth lives in SQLite (§1.5). **Native-module packaging solved** (the hard part): externalize better-sqlite3 in the main vite build; AutoUnpackNativesPlugin + rebuildConfig (Electron ABI) + a `packageAfterCopy` hook copying better-sqlite3+bindings+file-uri-to-path — forge-vite ships no node_modules otherwise. Verified in **dev (e2e persist-across-restart) AND packaged** (logs 'SQLite opened'+'Migration 1 applied', DB created; .node unpacked). `before-quit` closes the WAL connection. Reviewer PASS.
- **Scope note (intentional divergence):** wired the settings handler directly to the repository — the planned thin `settingsService.ts` was unnecessary indirection. No renderer settings *slice* (settings flow renderer→window.api→SQLite, so Redux never forks settings truth); the `servicesSlice` seed fixture is Phase-3 domain work.
