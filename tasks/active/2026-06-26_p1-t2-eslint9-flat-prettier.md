# P1-T2 — ESLint 9 flat config + Prettier + security lint rules
- **ID:** 2026-06-26_p1-t2-eslint9-flat-prettier
- **Phase:** 1
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
Migrate off the legacy `.eslintrc.json` to ESLint 9 flat config with typescript-eslint 8, add react-hooks + import rules, **electron-security lint rules** that make renderer-boundary violations (CLAUDE.md §5.2) hard errors, and Prettier. (Phase 0 T8 only added the TS import-resolver on the legacy config as a minimal unblock — this is the real migration.)

## Scope (files/areas)
- Delete `.eslintrc.json`; add `eslint.config.js` (flat).
- `package.json`: `eslint` 8→9, `@typescript-eslint/*` 7→8 (or the unified `typescript-eslint` pkg), add `eslint-plugin-react-hooks`, `eslint-import-resolver-typescript` (carry over), `prettier` + `eslint-config-prettier`.
- Add custom restrictions: ban `nodeIntegration`, and `import`s of `electron`/`ipcRenderer`/`node:*`/`fs` from `src/renderer/**` + `src/shared/**` + `src/audience/**` (e.g. `no-restricted-imports`).
- Update `lint` script if needed; add `format` script.

## Rules that apply
- CLAUDE.md §5.1, §5.2 (boundary enforcement), §5.9
- Phase brief: plan/phases/phase-1-toolchain.md#t2

## Acceptance criteria
- [ ] `bun run lint` clean on flat config
- [ ] A renderer file importing `electron`/`node:*`/`ipcRenderer` produces a lint **error** (verify with a temp probe, then remove)
- [ ] Prettier configured; `bun run format` works; no churn-war with eslint
- [ ] reviewer + security signed off (security reviews the boundary rules)

## Outcome (filled on completion)
