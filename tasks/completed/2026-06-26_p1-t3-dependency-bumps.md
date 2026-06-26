# P1-T3 — Dependency bumps + audit remediation
- **ID:** 2026-06-26_p1-t3-dependency-bumps
- **Phase:** 1
- **Assigned agent type:** implementer + security
- **Status:** done

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
**2026-06-26.** Bumps, each its own commit: Vite 5→7 (clears the dev-only vite/esbuild advisories), lucide-react 0.344→1.21 (major; icon imports still resolve), radix dialog/slot, postcss/autoprefixer, **electron 36.2.0→36.9.5**. Added `trustedDependencies: ["electron"]` so bun runs electron's (binary) postinstall. App builds + runs after each; tsc/lint green.
- **Audit posture:** `bun audit --production` = **0** (runtime/shipped clean). Full `bun audit` = 26 (all dev/build-tooling: forge → tar/tmp, plus electron flagged as a devDependency).
- **CVE accuracy correction (per security review):** the electron bump resolves the **ASAR integrity bypass** (GHSA-vmqv-hx8q-j7mg) — the load-bearing one for our `EnableEmbeddedAsarIntegrityValidation`/`OnlyLoadAppFromAsar` fuses. It does **NOT** resolve 3 other moderate advisories (AppleScript injection, SW IPC spoof, iframe-origin), which need **electron 38.8.6+** (a major bump). The "4 CVEs" framing in commit 2958be5 overstated it. → filed follow-up **2026-06-26_p1-followup-electron-38-bump**.
- **Accepted exceptions (dev-only, not shipped):** `tar`/`tmp` via @electron-forge build tooling. React 19 (O3) deferred — not forced; revisit with the electron-38 follow-up.
- Reviewer + security sign-off GRANTED (§7/§9).
