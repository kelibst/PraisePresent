# P1-T3 — Dependency bumps + audit remediation
- **ID:** 2026-06-26_p1-t3-dependency-bumps
- **Phase:** 1
- **Assigned agent type:** implementer + security
- **Status:** pending

## Goal
Bring runtime/build deps current and clear the dev-only audit advisories carried from Phase 0 T1. One logical bump per commit (§5.10) so regressions stay attributable. React 19 is **planned, not forced** here.

## Scope (files/areas)
- `package.json`: Vite 5→6/7 (closes the dev-only `vite`/`esbuild` advisories), `lucide-react` 0.344→current (O5), radix packages, `autoprefixer`/`postcss` as needed (O4/O5).
- Re-run `bun audit` / `bun audit --production`; document any residual.
- **Do NOT** force React 19 (O3) — file a Phase-3 follow-up task if it needs codemods.

## Rules that apply
- CLAUDE.md §5.10 (one bump per PR), §1.7
- Phase brief: plan/phases/phase-1-toolchain.md#t3

## Acceptance criteria
- [ ] `bun audit` clean or documented exceptions
- [ ] App builds + runs after each bump (`bun run package`)
- [ ] `tsc`/lint still clean
- [ ] React 19 follow-up task filed if deferred
- [ ] reviewer + security signed off

## Outcome (filled on completion)
