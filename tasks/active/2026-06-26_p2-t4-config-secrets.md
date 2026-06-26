# P2-T4 — Config & secrets
- **ID:** 2026-06-26_p2-t4-config-secrets
- **Phase:** 2
- **Assigned agent type:** security
- **Status:** pending

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
