# P1-T4 — CI pipeline (GitHub Actions, 3-OS matrix)
- **ID:** 2026-06-26_p1-t4-ci-pipeline
- **Phase:** 1
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
Author a CI workflow that, on every PR, runs the full gate (install → typecheck → lint → unit → e2e smoke → packaged build) matrixed on ubuntu/windows/macos, with bun. Gate `master` on it. **This also closes Phase 0 T7** (Windows/macOS packaging verification).

## Scope (files/areas)
- `.github/workflows/ci.yml` — `oven-sh/setup-bun`; jobs: `bun install` → `bunx tsc --noEmit` → `bun run lint` → `bun test` (Vitest, from P1-T5) → Playwright-Electron smoke (xvfb on linux) → `bun run package` (use `package`, not installer `make`, to avoid per-OS system binaries; or `make` per-OS where runners support it). Matrix `os: [ubuntu-latest, windows-latest, macos-latest]`. Cache bun.
- Branch-protection note for `master` (requires repo admin).

## Rules that apply
- CLAUDE.md §5.8, §5.10
- Phase brief: plan/phases/phase-1-toolchain.md#t4

## Acceptance criteria
- [ ] `ci.yml` authored + committed
- [ ] CI green on a trial PR across all 3 OSes — **requires GitHub auth/push (USER step: remote is `kelibst/PraisePresent`, `gh` not authed locally)**
- [ ] Merge to `master` blocked on failure (branch protection — user/admin)
- [ ] reviewer signed off on the workflow

## Outcome (filled on completion)
