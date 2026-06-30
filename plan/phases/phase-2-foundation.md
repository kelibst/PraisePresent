# Phase 2 — Foundation Skeleton (PM Brief)

> **Goal:** build the missing architectural skeleton — **typed IPC, SQLite persistence, dual-window management, and the test harness in anger** — so Phase 3 features hang off a tested foundation instead of accreting in components. ⭐ Critical path.

**Effort:** ~4–5 weeks · **Branch prefix:** `phase2/`

---

## Entry gate
- Phase 1 exit gate green: modern toolchain, real CI, test harness bootstrapped.

## PM start sequence
1. Read this brief, `CLAUDE.md` §5.2/§5.3/§5.5, `revival/01-codebase-audit.md` §7.3 (target architecture), `revival/04-implementation-timeline.md` §Phase 2.
2. Audit CAMS. 3. Decompose into the tasks below (these have **ordering dependencies** — T1 contract first).

---

## Task breakdown

### T1 — IPC contract & typed `contextBridge` `[security + implementer]` (do first)
- **Scope:** `src/shared/{types,schemas,constants}` — define channel names (`scripture:*`, `songs:*`, `media:*`, `plans:*`, `present:*`, `ai:*`, `settings:*`) and **zod schemas** per payload. `src/preload/index.ts` — expose minimal typed `window.api`; `src/preload/api.d.ts` — the type the renderer imports. `src/main/ipc/` — a registration harness wrapping `ipcMain.handle` with **zod validation + typed Result**.
- **Rules:** §1.3, §5.2, §5.3. **Done:** a demo `settings:get/set` round-trips renderer → preload → IPC → main → back, fully typed, with invalid payloads rejected; security sign-off on the bridge surface.

### T2 — SQLite + migrations + repository layer `[implementer]`
- **Scope:** `src/main/db/` — `better-sqlite3` connection (userData path), forward-only `migrations/` runner on app start, `repositories/` base + a `settingsRepository` as the reference implementation. Demote Redux to view-cache (CLAUDE.md §5.4): wire the `settings` slice to read through `window.api`, not from seed data.
- **Rules:** §1.5, §5.5. **Done:** DB file created on first run; migrations apply + are idempotent; settings persist across restart; parameterized queries only; native module rebuilds in CI (R3) via `auto-unpack-natives`.

### T3 — WindowManager + audience window `[implementer]`
- **Scope:** `src/main/windows/windowManager.ts` — presenter window (sized for authoring, not 800×600) + a second **audience BrowserWindow** placed on the secondary `screen` display; `src/audience/` renderer entry. Live state owned by main; broadcast slide/black/blank/clear to the audience window via typed events (CLAUDE.md §5.3). Handle display connect/disconnect gracefully.
- **Rules:** §1.4, §5.2, §5.7. **Done:** launching opens presenter on display 1; an audience window targets display 2 and mirrors a hard-coded test slide; black/blank works; **fails safe to black**, never a crash (R4); hot-plug a monitor without breaking.

### T4 — Config & secrets `[security]`
- **Scope:** `src/main/infra/config.ts` — typed app config; **OS secure storage** (Electron `safeStorage`) for future Bible/AI API keys; never expose keys to the renderer. Extend the Phase-0 CSP `connect-src` policy mechanism so later phases can add endpoints declaratively.
- **Rules:** §1.7, §5.2. **Done:** a secret can be stored/read in main only; renderer cannot access it; security sign-off.

### T5 — Foundation test coverage `[tester]`
- **Scope:** Vitest units for the IPC validation harness, repository layer, and migration runner; Playwright e2e: launch → open audience window on a virtual 2nd display → assert mirror; settings persist across an app restart.
- **Rules:** §5.8. **Done:** coverage gate on `src/main/{ipc,db,windows}` met; e2e green in CI.

---

## Verification & review
- PM confirms an **end-to-end round-trip**: a renderer action → `window.api` → IPC (validated) → service → SQLite → response, **and** a main-side state change broadcasts to the audience window.
- `security` reviews T1/T3/T4 (bridge, windows, secrets). `reviewer` checks repository/migration patterns. No business logic leaked into preload/renderer.

## Exit gate (advance to Phase 3 when ALL true)
- [ ] Typed, zod-validated IPC surface live; renderer has zero direct `electron`/`node:*`/`ipcRenderer` imports (lint-enforced).
- [ ] SQLite + migrations + repository layer working; settings persist across restart; Redux is view-cache only.
- [ ] Presenter + audience windows on separate displays; live state broadcasts; fails safe to black; survives display hot-plug.
- [ ] Secrets stored in OS secure storage, main-only.
- [ ] Unit + e2e cover the foundation; CI green on 3 OSes.
- [ ] CAMS tasks closed; PM synthesis reported.

## Risks (`docs/revival/06-risk-assessment.md`)
- **R2** insecure ad-hoc IPC → T1 lands the contract *before* features (this is why Phase 2 precedes Phase 3). **R3** native module → CI builds `better-sqlite3` on all OSes. **R4** multi-display flakiness → test on real hardware + virtual displays now, not at release.
