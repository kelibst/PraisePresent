# T1 — Dependency install & audit
- **ID:** 2026-06-26_t1-dependency-install-audit
- **Phase:** 0
- **Assigned agent type:** implementer + security
- **Status:** done

## Goal
`npm install` succeeds cleanly and the dependency security posture is recorded. No remediation in this phase unless a **critical runtime** CVE is found — patch only that one now. This task grounds the baseline in fact before any code moves.

## Scope (files/areas)
- `package.json`, `package-lock.json` — install only; no version bumps unless a critical runtime CVE forces one.

## Rules that apply
- CLAUDE.md §1.7 (no secrets), §5.10 (deps/commits)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t1

## Acceptance criteria
- [ ] `npm install` completes without errors
- [ ] `npm audit` and `npm audit --omit=dev` output captured verbatim in Outcome
- [ ] Findings folded into `revival/01-codebase-audit.md` §2 (→ `docs/revival/` after T3)
- [ ] Any critical runtime CVE patched and noted; everything else deferred to Phase 1
- [ ] reviewer (security) signed off

## Outcome (filled on completion)
**2026-06-26.** Package manager switched npm → **bun 1.3.6** (user decision). Removed `package-lock.json`, added `bun.lock`. `bun install` = 786 pkgs in 14s (npm baseline was 3m).
- **`bun audit --production` (runtime/shipped): 0 vulnerabilities.** Bun resolved newer non-vulnerable versions (`react-router-dom@7.18.0`) where npm pulled vulnerable ranges.
- **`bun audit` (all incl. dev): 31 (12 high / 14 mod / 5 low)** — all dev-only `vite`/`esbuild` dev-server advisories that do not ship.
- **Decision:** no critical *runtime* CVE → no remediation in Phase 0 (per brief §T1). Dev-only vite/esbuild issues → Phase 1 toolchain upgrade; `react-router` fix overlaps T4.
- Results folded into `revival/01-codebase-audit.md` §2.
- **Doc follow-up:** CLAUDE.md §5.10 and Phase 0 brief still say npm/`package-lock.json` — update to bun once baseline commit lands.
