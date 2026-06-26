# P2-T1 — IPC contract & typed contextBridge (do first)
- **ID:** 2026-06-26_p2-t1-ipc-contract-bridge
- **Phase:** 2
- **Assigned agent type:** security + implementer
- **Status:** done

## Goal
Stand up the typed, zod-validated IPC surface that every later feature hangs off. A demo `settings:get/set` round-trips renderer → `window.api` → preload → IPC → main → back, fully typed, with invalid payloads rejected. Security sign-off on the bridge surface.

## Scope (files/areas)
- `src/shared/constants/` — channel-name registry (`scripture:*`, `songs:*`, `media:*`, `plans:*`, `present:*`, `ai:*`, `settings:*`).
- `src/shared/schemas/` — zod schemas per payload; `src/shared/types/` — `z.infer` types + a shared `Result<T>` type.
- `src/preload/index.ts` — minimal typed `window.api` via `contextBridge` (no business logic); `src/preload/api.d.ts` — the type the renderer imports.
- `src/main/ipc/` — registration harness wrapping `ipcMain.handle` with zod validation → typed `Result`; a `settings` handler as the reference.

## Rules that apply
- CLAUDE.md §1.3 (typed zod IPC), §5.2 (boundaries), §5.3 (channel-per-domain, validate→work→typed result)
- Phase brief: plan/phases/phase-2-foundation.md#t1

## Acceptance criteria
- [ ] `settings:get/set` round-trips fully typed renderer↔main
- [ ] Invalid payloads rejected by zod at the main boundary (never trust renderer)
- [ ] Renderer imports only the `window.api` type, never electron/ipcRenderer (lint-enforced)
- [ ] No business logic in preload
- [ ] reviewer + **security** sign-off on the bridge

## Outcome (filled on completion)
**2026-06-26.** Shipped the typed IPC contract: `src/shared/constants/channels.ts` (registry), `src/shared/schemas/settings.ts` (zod), `src/shared/types/result.ts` (`Result<T>` + `ok`/`err`). Preload exposes a minimal `window.api` (fixed channels only — no generic invoke, no business logic). `src/main/ipc/registry.ts` wraps `ipcMain.handle` with `safeParse` → typed Result; `settingsHandlers.ts` is the reference (in-memory; T2 swaps to SQLite). `@` alias added to vite main/preload. Added zod 4.4.3. `tests/e2e/ipc.spec.ts` proves the renderer↔main round-trip and zod rejection of an empty-key payload.
- **Security sign-off: GRANTED** (independent agent) — bridge is minimal/fixed-channel, renderer boundary holds (lint-enforced), contextIsolation/sandbox intact.
- **Applied** review follow-up #2: handler errors now return a generic `"<channel> failed"` to the renderer (detail logged in main) so no internal paths/stacks cross the bridge (§5.7).
- **Deferred follow-ups:** type `channel` against a `CHANNELS` union (compile-time); per-channel payload size caps when media/AI land; remove the in-memory Map in T2.
