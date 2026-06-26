# T8 — Minimal toolchain bump (unblock tsc + lint gate)
- **ID:** 2026-06-26_t8-minimal-toolchain-bump
- **Phase:** 0 (pulled forward from Phase 1 by user decision)
- **Assigned agent type:** implementer
- **Status:** done

## Goal
Make `tsc --noEmit` and `bun run lint` actually capable of going green so the Phase 0 exit gate is satisfiable. The scaffold pins `typescript ~4.5.4`, which cannot parse modern `@types` (1439 lib parse errors), and eslint has no TS path-resolver (11 `import/no-unresolved` on `@/`). Bump the minimum set; do NOT do the full Phase 1 toolchain overhaul.

## Scope (files/areas)
- `package.json` devDeps: `typescript ~4.5.4` → `^5.x`; `@typescript-eslint/*` `^5.62` → `^7.x` (required to parse TS 5 under eslint 8); add `eslint-import-resolver-typescript`.
- `.eslintrc.json`: add `settings.import/resolver.typescript` → `./tsconfig.json`.
- Fix any genuine type errors the newer TS surfaces in `src/` (expected: few/none).

## Rules that apply
- CLAUDE.md §5.1 (strict stays on), §5.8 (CI gate: tsc+lint), §5.10 (deps)
- Phase brief: plan/phases/phase-1-toolchain.md (this is a minimal pull-forward)

## Acceptance criteria
- [ ] `tsc --noEmit` clean (0 errors)
- [ ] `bun run lint` clean (0 errors; warnings acceptable or fixed)
- [ ] `strict: true` retained
- [ ] App still builds + runs (`bun run package`)
- [ ] reviewer signed off

## Outcome (filled on completion)
**2026-06-26.** Bumped `typescript ~4.5.4 → 5.9.3`, `@typescript-eslint/{parser,eslint-plugin} ^5.62 → ^7.18.0`, added `eslint-import-resolver-typescript ^3.10`. `.eslintrc.json` gained `settings.import/resolver.typescript → ./tsconfig.json` (fixes the `@/` `import/no-unresolved` errors). `tsconfig.json` `include` += `forge.env.d.ts` (provides `MAIN_WINDOW_VITE_*` globals); added `src/main/vendor.d.ts` ambient shim for `electron-squirrel-startup`. Removed 2 redundant `: any` annotations (fixture is typed by inference). `strict: true` retained.
- **Result:** `tsc --noEmit` = **0 errors**; `bun run lint` = **0 errors, 0 warnings**. `bun run package` succeeds; binary runs. Both exit-gate blockers cleared.
- **Reviewer (general-purpose): PASS** (§9). The remaining Phase 1 toolchain work (eslint flat config, vite/electron upgrades, CI matrix) is unchanged — this was only the minimal unblock.
