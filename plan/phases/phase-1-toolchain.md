# Phase 1 — Toolchain Modernization (PM Brief)

> **Goal:** modernize the dev toolchain on the clean, restructured baseline so every later phase has a fast, safe, automated feedback loop. **No product features.**

**Effort:** ~1 week · **Branch prefix:** `phase1/`

---

## Entry gate
- Phase 0 exit gate green: restructured tree, packaged build works, security hardened, `tsc`/lint clean.

## PM start sequence
1. Read this brief, `CLAUDE.md` §5 (standards), `revival/01-codebase-audit.md` §4 (O1–O6), `revival/03-nodejs-vs-rust.md` §5.1.
2. Audit `tasks/active/` + `tasks/completed/`.
3. Create CAMS tasks; assign; **one dependency-bump per PR** (CLAUDE.md §5.10) to keep regressions attributable.

---

## Task breakdown

### T1 — TypeScript 4.5 → 5.x `[implementer]`
- **Scope:** `package.json` (`typescript`), `tsconfig.json`. Bump to TS 5.x; adopt `moduleResolution: "bundler"`, `verbatimModuleSyntax: true`; fix any new type errors.
- **Rules:** §5.1. **Done:** `tsc --noEmit` clean on TS 5; no `any` introduced.

### T2 — ESLint 8 → 9 flat config `[implementer]`
- **Scope:** delete `.eslintrc.json`; add `eslint.config.js` (flat); bump `eslint` 9 + `typescript-eslint` 8; add `eslint-plugin-react-hooks`, import rules, and **electron-security lint rules** (ban `nodeIntegration`, direct `ipcRenderer`/`node:*` in renderer — enforces CLAUDE.md §5.2). Add Prettier + config.
- **Rules:** §5.1, §5.2, §5.9. **Done:** `npm run lint` clean; renderer-boundary violations are lint errors.

### T3 — Dependency bumps `[implementer + security]`
- **Scope:** bump Vite (6/7), `lucide-react`, radix, autoprefixer/postcss as needed; remediate any `npm audit` findings from Phase 0 T1. **Plan** (don't force) React 19 — file a Phase-3 follow-up task if it needs codemods.
- **Rules:** §5.10, §1.7. **Done:** `npm audit` clean (or documented exceptions); app still builds + runs.

### T4 — CI pipeline `[implementer]`
- **Scope:** `.github/workflows/ci.yml` — on PR: install → `tsc --noEmit` → lint → unit tests → `npm run make` smoke build, matrixed on **ubuntu/windows/macos**. Cache `node_modules`. Add status-check gating to `master`.
- **Rules:** §5.8, §5.10. **Done:** CI green on a trial PR across all 3 OSes; merge blocked on failure.

### T5 — Test harness bootstrap `[tester]`
- **Scope:** add **Vitest** (config + one real unit test, e.g. for `cn()`/theme) and **Playwright-Electron** (config + one smoke e2e: launch → window visible → navigate). Wire both into `npm test` and CI (T4).
- **Rules:** §5.8. **Done:** `npm test` runs unit + e2e locally and in CI; both green.

### T6 — Observability bootstrap `[implementer]`
- **Scope:** add `electron-log` in `src/main/infra/logger.ts`; add a renderer top-level **error boundary**; handle `render-process-gone`/`child-process-gone` in main.
- **Rules:** §5.7. **Done:** logs write to disk; a thrown renderer error shows the boundary, not a white screen; main survives a simulated renderer crash.

---

## Verification & review
- PM confirms: `tsc`/lint/test all green locally **and** in CI on 3 OSes; app launches; logger writes; error boundary catches.
- `reviewer` checks configs against CLAUDE.md §5; `security` reviews the lint rules + any dep additions.

## Exit gate (advance to Phase 2 when ALL true)
- [ ] TS 5, ESLint 9 flat + Prettier, deps bumped, `npm audit` clean/documented.
- [ ] CI green on ubuntu/windows/macos with the full gate (typecheck/lint/unit/e2e/make).
- [ ] Vitest + Playwright harness in place with ≥1 passing test each.
- [ ] `electron-log` + error boundary + crash handling working.
- [ ] CAMS tasks closed with outcomes; PM synthesis reported.

## Risks (`docs/revival/06-risk-assessment.md`)
- **R7** bump regressions → one bump per PR, green CI gate. **R16** invisible regressions → this phase *is* the fix; nothing else proceeds until CI is real. **R18** CVEs → resolved/triaged here.
