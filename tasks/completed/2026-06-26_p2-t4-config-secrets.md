# P2-T4 — Config & secrets
- **ID:** 2026-06-26_p2-t4-config-secrets
- **Phase:** 2
- **Assigned agent type:** security
- **Status:** done

## Goal
Typed app config + OS secure storage (Electron `safeStorage`) for future Bible/AI API keys, never exposed to the renderer. Make the Phase-0 CSP `connect-src` extensible so later phases add endpoints declaratively.

## Scope (files/areas)
- `src/main/infra/config.ts` — typed app config (zod-validated).
- `src/main/infra/secrets.ts` — `safeStorage` encrypt/decrypt; keys stored main-only; a `settings:*`/dedicated IPC surface that never returns raw secrets to the renderer.
- Refactor the `src/main/index.ts` CSP so `connect-src` can be extended per-domain declaratively.

## Rules that apply
- CLAUDE.md §1.7 (secrets in OS storage, never renderer/git), §5.2
- Phase brief: plan/phases/phase-2-foundation.md#t4

## Acceptance criteria
- [ ] A secret can be stored/read in main only; renderer cannot access it
- [ ] CSP `connect-src` extension mechanism in place
- [ ] **security** sign-off
- [ ] reviewer sign-off

## Outcome (filled on completion)
**2026-06-26.** `secrets.ts`: API keys encrypted with OS `safeStorage`, stored as SQLite BLOBs (migration 2), **never exposed to the renderer** (no IPC channel returns a secret; window.api = settings+present only, locked by `secrets-boundary.spec.ts`). `config.ts`: typed (zod) app config + `allowConnectSource()`. `csp.ts`: `buildCsp()` composes the policy from base + `config.connectSources` so later phases widen connect-src declaratively; main/index.ts uses it (prod stays strict `script-src 'self'`). **Verified in this env:** safeStorage available; encrypt→BLOB→decrypt round-trips and stores ciphertext.
- **Security sign-off: GRANTED.** (safeStorage needs an OS keyring — present here; absent in headless CI, where set() throws by design.)
