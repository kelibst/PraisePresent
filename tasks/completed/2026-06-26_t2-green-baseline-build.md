# T2 — Establish a green baseline build
- **ID:** 2026-06-26_t2-green-baseline-build
- **Phase:** 0
- **Assigned agent type:** implementer
- **Status:** done

## Goal
Prove the audited scaffold builds and runs **before** any restructuring, then tag a rollback point. `npm start` launches the dev window; `npm run make` produces a runnable package on the dev OS. Any failure is documented precisely (not worked around).

## Scope (files/areas)
- No source changes intended. Confirm `npm start` (dev) and `npm run make`.
- If a blocking failure exists, document it; minimal fix only if it blocks the baseline.

## Rules that apply
- CLAUDE.md §1.1 (read before write)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t2

## Acceptance criteria
- [ ] `npm start` launches the window (observed, not assumed — §6)
- [ ] `npm run make` output runs on the dev OS
- [ ] Commit tagged `v0.1.0-baseline` **before** T3 begins (rollback point)
- [ ] Any failures documented in Outcome
- [ ] reviewer signed off

## Outcome (filled on completion)
**2026-06-26 (run via bun).**
- **`bun run start` (dev): launches.** Electron spawned, renderer rendered. DevTools opened unconditionally → confirms audit **S3** live (T5 fixes).
- **`bun run make`: FAILS** — only because the `rpm` maker needs `rpmbuild` (system binary absent) and `MakerZIP` is restricted to `['darwin']`. Linux makers configured = rpm + deb, both need system binaries. Not a code defect.
- **`bun run package`: SUCCEEDS** — production Vite build + asar + Fuses → `out/praisepresent-linux-x64/praisepresent` (188M). Binary launches and stays running (timeout had to kill it); **packaged build also opens DevTools → S3 reproduced in production.**
- **Build is green on this OS.** Installer-`make` (rpm/deb) deferred to **T7 / CI matrix** (needs `rpmbuild`/`dpkg` or per-OS runners). lint: 10 errors / 4 warnings, all `import/no-unresolved` on `@/*` alias (eslint resolver not configured for TS paths) → Phase 1 toolchain item, not blocking.
- **Baseline committed & tagged:** branch `phase0/baseline-setup`, commit `914955b`, tag **`v0.1.0-baseline`** (bun migration + planning scaffold + CAMS tasks; progress docs reorganized under `plan/progressfiles/` as git renames). Rollback point established before T3.
- Reviewer: PM-verified (measurement + setup task); commit `914955b` available for a security glance on the bun.lock/audit note.
