# P2-T1 — IPC contract & typed contextBridge (do first)
- **ID:** 2026-06-26_p2-t1-ipc-contract-bridge
- **Phase:** 2
- **Assigned agent type:** security + implementer
- **Status:** pending

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
