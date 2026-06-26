# P2-T5 — Foundation test coverage
- **ID:** 2026-06-26_p2-t5-foundation-tests
- **Phase:** 2
- **Assigned agent type:** tester
- **Status:** done

## Goal
Cover the foundation with real tests so Phase 3 builds on something verified: Vitest units for the IPC validation harness, repository layer, migration runner; Playwright e2e for the audience-window mirror and settings persistence across restart.

## Scope (files/areas)
- Vitest: IPC zod-validation harness, `settingsRepository`, migration runner (idempotency).
- Playwright e2e: launch → open audience window (virtual 2nd display if available) → assert mirror; set a setting → restart → assert persisted.
- Wire into CI (P1-T4 workflow).

## Rules that apply
- CLAUDE.md §5.8
- Phase brief: plan/phases/phase-2-foundation.md#t5

## Acceptance criteria
- [ ] Vitest covers `src/main/{ipc,db}` core logic
- [ ] e2e: audience mirror + settings-persist-across-restart green
- [ ] CI green on 3 OSes (depends on P1-T4 push)
- [ ] reviewer sign-off

## Outcome (filled on completion)
**2026-06-26.** Vitest setup mocks electron/electron-log so main-process logic is testable under Node (native better-sqlite3 is Electron-ABI; the DB itself is covered by e2e). **17 units across 5 files:** ipc registry harness (Ok/Err, invalid-payload rejection, generic error on throw), settings+present schemas, migration idempotency (stateful fake db), config/allowConnectSource, cn(). **5 e2e:** smoke, ipc round-trip, settings-persist-across-restart, audience-mirror+fail-safe, secrets-boundary. Reviewer PASS.
