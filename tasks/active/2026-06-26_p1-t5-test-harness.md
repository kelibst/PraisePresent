# P1-T5 — Test harness bootstrap (Vitest + Playwright-Electron)
- **ID:** 2026-06-26_p1-t5-test-harness
- **Phase:** 1
- **Assigned agent type:** tester
- **Status:** pending

## Goal
Stand up the two test runners with one real passing test each, wired into a `test` script and CI (P1-T4). This is the harness every later phase's tests build on (audit O6).

## Scope (files/areas)
- **Vitest:** config (`vitest.config.ts`), one real unit test — e.g. `src/renderer/lib/utils.test.ts` for `cn()`, or a theme reducer/util test. Colocated `*.test.ts` (§5.8).
- **Playwright-Electron:** config under `tests/e2e/`, one smoke test: launch the built app → window visible → navigate to a route. Headless via xvfb on linux.
- `package.json`: `test` (unit), `test:e2e`, and a combined script; add `@playwright/test` + `vitest` + `@vitest/*` deps.

## Rules that apply
- CLAUDE.md §5.8 (Vitest unit, Playwright e2e incl. packaged)
- Phase brief: plan/phases/phase-1-toolchain.md#t5

## Acceptance criteria
- [ ] `bun test` runs unit; ≥1 unit test passes
- [ ] Playwright-Electron smoke launches the app and asserts window/nav; passes locally
- [ ] Both wired into CI (P1-T4)
- [ ] reviewer signed off

## Outcome (filled on completion)
