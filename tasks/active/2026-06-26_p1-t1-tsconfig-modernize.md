# P1-T1 — TypeScript config modernization
- **ID:** 2026-06-26_p1-t1-tsconfig-modernize
- **Phase:** 1
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
The TS *version* bump (4.5→5.9.3) was already done in Phase 0 (T8, closes audit O1). This task finishes the modernization: adopt `moduleResolution: "bundler"` and `verbatimModuleSyntax: true` and fix any resulting type/import errors, keeping `tsc --noEmit` clean.

## Scope (files/areas)
- `tsconfig.json` — set `moduleResolution: "bundler"`, `verbatimModuleSyntax: true` (and `module: "ESNext"` already set). Remove now-redundant options if any.
- `src/**` — fix `verbatimModuleSyntax` fallout (type-only imports must use `import type`).

## Rules that apply
- CLAUDE.md §5.1 (strict, no `any`)
- Phase brief: plan/phases/phase-1-toolchain.md#t1

## Acceptance criteria
- [ ] `bunx tsc --noEmit` clean
- [ ] `verbatimModuleSyntax` + `moduleResolution: bundler` in effect; type-only imports use `import type`
- [ ] App still builds (`bun run package`)
- [ ] reviewer signed off

## Outcome (filled on completion)
