# PraisePresent — Handoff Context (continue from here)

> **You are the next agent. Act as the PM (CLAUDE.md §2). Before doing ANYTHING:**
> 1. **Read [`CLAUDE.md`](../../CLAUDE.md) in full** — it is binding. Pay special attention to §1 (golden rules), §5.2 (process boundaries), §5.3 (IPC), §5.5 (DB), §6 (Definition of Done), §7 (review protocol).
> 2. Read [`plan/phases/README.md`](README.md) and the brief for whatever phase/domain you pick up.
> 3. Read [`docs/revival/01-codebase-audit.md`](../../docs/revival/01-codebase-audit.md) §6 (gap matrix) + §7 (architecture) if touching domains.
> 4. Audit `tasks/active/` and `tasks/completed/` — **do not duplicate or regress** completed work.
>
> Snapshot written 2026-06-26 after Phases 0–2 complete + part of Phase 3. **Verify against the code — don't trust this blindly.**

---

## 1. Where we are

**Branch:** `phase0/baseline-setup` (ALL work is on this one branch; nothing pushed to remote yet). **Tag:** `v0.1.0-baseline` (pre-restructure rollback point).
**Remote:** `https://github.com/kelibst/PraisePresent.git` (origin) — **nothing pushed; `gh` is NOT authenticated locally.**
**Gate is green:** `bunx tsc --noEmit` 0 errors · `bun run lint` 0 · format clean · **38 Vitest unit tests** · **8 Playwright-Electron e2e tests** all pass. Working tree clean except this file.

### Phases complete
- **Phase 0 (Stabilize & Restructure)** — ✅ DONE. Restructured to the target tree, dead code purged, `HashRouter` (B1 fixed), Electron security hardened (S1–S4). **Package manager is `bun`, not npm.**
- **Phase 1 (Toolchain)** — ✅ DONE. TS 5.9, ESLint 9 flat config + Prettier + **electron-security boundary lint rules** (renderer/shared/audience CANNOT import electron/node/fs/ipcRenderer/better-sqlite3 — enforced as lint ERRORS), Vite 7, electron 36.9.5, Vitest + Playwright-Electron harness, electron-log + renderer error boundary + crash handlers, **CI workflow authored** (`.github/workflows/ci.yml`, 3-OS matrix on bun).
- **Phase 2 (Foundation)** — ✅ DONE. Typed zod-validated **IPC + contextBridge**, **SQLite (better-sqlite3) + forward-only migrations + repository layer**, **WindowManager + audience window** (`present:*` broadcast, fails safe to black), **safeStorage secrets** (main-only) + declarative CSP, foundation tests. All security-signed-off.
- **Phase 3 (Domains)** — 🟡 **3 of 5 DONE.**
  - ✅ **D3 Songs** — full vertical slice: migration/repository/service/IPC/UI + present-to-audience. Reviewer PASS.
  - ✅ **D5 Service Planning** — real persisted plans, **retired the `servicesData` fixture + Redux entirely**, duration estimate. Reviewer PASS.
  - ✅ **D1 Scripture** — bundled **Public-Domain WEB** (`resources/bible/web.json.gz`, 1.24 MB, 66 books / 31,095 verses), migration 5 + **FTS5**, offline hydration, reference + keyword search, present-to-audience. Reviewer PASS + Security SIGN-OFF. **FTS5 ~1ms → no Rust task needed.**
  - ⬜ **D2 Presentation engine**, **D4 Media** — NOT started (see §5/§6).

---

## 2. CRITICAL environment gotchas (you WILL hit these)

1. **`ELECTRON_RUN_AS_NODE=1` is set in this shell/IDE.** It makes Electron run as plain Node, so `require('electron')` returns a path string and any app launch crashes with `Cannot read properties of undefined (reading 'on')`. The packaged app is immune (Fuse `RunAsNode:false`). **Every Playwright e2e strips it** (`delete env.ELECTRON_RUN_AS_NODE` and `ELECTRON_FORCE_IS_PACKAGED` before `electron.launch`). Copy that pattern. To launch electron manually: `env -u ELECTRON_RUN_AS_NODE node_modules/electron/dist/electron <main.js> --no-sandbox` (path FIRST, then flags — electron rejects `--no-sandbox` before the path).
2. **Native modules need the forge hook.** forge-vite ships **no `node_modules`** in the package and rollup can't bundle `.node`. Fix lives in `forge.config.ts`: `AutoUnpackNativesPlugin` + `rebuildConfig:{}` + a **`packageAfterCopy` hook** copying `better-sqlite3` + `bindings` + `file-uri-to-path` into the package. Adding another native module? Add it to that hook's `NATIVE_RUNTIME_DEPS` AND externalize it in `vite.main.config.ts` (`rollupOptions.external`).
3. **Dual-ABI problem.** `node_modules/better-sqlite3` is built for **Electron's ABI** (`bunx electron-rebuild -f -w better-sqlite3`). Node-based **Vitest cannot load it** → DB logic is e2e-tested; Vitest mocks electron/electron-log via `vitest.setup.ts`. Keep PURE logic in separate modules (`songImport.ts`, `planEstimate.ts`) so it's unit-testable without the native binary.
4. **Single display only here.** Audience window falls back to the primary display; true dual-monitor placement + hot-plug verified by inspection only.
5. **bun specifics.** `bun install`, `bun run <script>`, lockfile `bun.lock`. `trustedDependencies` in `package.json` = `["electron","better-sqlite3"]` (their postinstalls build binaries; bun blocks postinstalls otherwise). `safeStorage` IS available here (keyring present); it throws in headless CI.
6. **IDE auto-formats on save (Prettier).** Files may get reformatted between tool calls — re-Read before Edit if you see a "file modified" notice.

---

## 3. How to verify (run after any change)

```bash
bunx tsc --noEmit       # must be 0 errors
bun run lint            # 0 errors (eslint 9 flat; boundary rules are HARD errors)
bun run format          # prettier --write   (bun run format:check to verify)
bun run test            # Vitest units (currently 25)
bun run package         # builds .vite/build + out/  — REQUIRED before e2e
bun run test:e2e        # Playwright-Electron (currently 7); needs a prior `bun run package`
```
**Definition of Done (§6):** tsc/lint/format clean, unit/e2e pass, **a SEPARATE reviewer agent signs off** (spawn via the Agent tool; a `security` reviewer too for anything touching main/IPC/secrets/Electron config — §7), CAMS task moved to `tasks/completed/` with an outcome note.

---

## 4. The domain "vertical slice" pattern (how to add Scripture/Media)

Songs and Plans are the reference. To add domain `X`, copy this exact shape:

1. **Migration** — append `{ id: N, name, up }` to `src/main/db/migrations/index.ts` (FORWARD-ONLY; never edit a shipped migration). FK child tables: `... REFERENCES parent(id) ON DELETE CASCADE` (the `foreign_keys` pragma is ON in `connection.ts`).
2. **Schema** — `src/shared/schemas/<x>.ts`: zod + `z.infer` types (`xCreate = x.omit({id:true})`, `xId = z.object({id})`, etc.).
3. **Channels** — add `x: { list, get, create, ... }` to `src/shared/constants/channels.ts`.
4. **Repository** — `src/main/db/repositories/<x>Repository.ts`: parameterized queries ONLY (no string interpolation), atomic transactions for parent+children, map snake_case rows → camelCase.
5. **Service** — `src/main/services/<x>Service.ts`: thin. Put PURE logic (parsers, estimators, search ranking) in a SEPARATE module so Vitest can test it without the native DB.
6. **Handlers** — `src/main/ipc/<x>Handlers.ts`: `handle(CHANNELS.x.foo, zodSchema, fn)` per channel. The `handle` registry (`src/main/ipc/registry.ts`) does zod validation → typed `Result`, and returns a GENERIC error string so no stack/path leaks to the renderer. Register in `src/main/ipc/index.ts`. Use `z.undefined()` for no-input channels (e.g. `list`).
7. **Bridge** — add the `x` surface to BOTH `src/preload/api.d.ts` (the `Api` interface) and `src/preload/index.ts` (forwarders to `ipcRenderer.invoke(CHANNELS.x.foo, payload)`). FIXED channels only; never expose a generic invoke. For main→renderer push, wrap `ipcRenderer.on` like `present.onState` does (returns an unsubscribe).
8. **Renderer** — `src/renderer/features/<x>/`: function components calling `window.api.x.*` ONLY (no electron/node — lint blocks it). Add a route in `src/renderer/app/router.tsx` (under `<AppLayout>` for chrome, or top-level like `/audience` for full-screen). The Sidebar already links `/scripture`, `/songs`, `/media`, `/presentations`, `/services`, `/settings`.
9. **Present to audience** — reuse Phase 2: `window.api.present.setState({ mode:'slide', slide:{ text } })`. Main owns live state in `src/main/windows/windowManager.ts`, broadcasts `present:state`; `AudienceView.tsx` subscribes via `window.api.present.onState` and fails safe to black.
10. **Tests** — Vitest for pure logic + schemas (electron mocked in `vitest.setup.ts`); Playwright e2e driving `window.api` through the real bridge AND asserting the UI renders. Strip `ELECTRON_RUN_AS_NODE`; use an isolated `--user-data-dir=` for persistence/restart tests.

**Read these first as the reference:** `src/main/ipc/registry.ts`, `src/main/ipc/songHandlers.ts`, `src/main/db/repositories/songRepository.ts`, `src/preload/index.ts`, `src/renderer/features/songs/SongsPage.tsx`, `tests/e2e/songs.spec.ts`, `tests/e2e/plans.spec.ts`.

**Current migrations:** 1 settings · 2 secrets · 3 songs+song_sections · 4 plans+plan_items · 5 bible_translations+bible_books+bible_verses+FTS5.
**Current `window.api`:** `settings` · `present` · `songs` · `plans` · `scripture`.
**Scripture note:** dataset is bundled via forge `extraResource: ['resources/bible']` (NOT in the asar — `process.resourcesPath/bible/` packaged, repo-root in dev). Regenerate with `node scripts/generate-bible-data.mjs` (dev-time fetch from getbible; hard-fails unless license is Public Domain). To add a translation, generalize the generator + repo's `translation_id` (already keyed) — the schema is multi-translation-ready.

---

## 5. Open tasks (`tasks/active/`)

- ✅ **`2026-06-26_p3-d1-scripture.md`** — **DONE** (moved to `tasks/completed/`). Bundled WEB, FTS5, offline search, present-to-audience. FTS5 ~1ms so no Rust task filed.
- **`2026-06-26_p3-d2-presentation-engine.md`** — NOT started. ⭐ now the top domain. Slide model + transitions (≥30 fps) + presenter preview + keyboard live controls. **Verification limit:** fps/visual smoothness need observed/visual verification + ideally a 2nd monitor. **Inherits two D1 follow-ups (see §7):** multi-verse scripture slide chunking + chapter-browse get-chapter path.
- **`2026-06-26_p3-d4-media.md`** — NOT started. Media library + image/video/audio on the audience window. **Verification limit:** needs sample media files + observed playback.
- **`2026-06-26_p1-t4-ci-pipeline.md`** — CI workflow authored + committed; **blocked on a GitHub push** (gh not authed). Trial-PR-green + branch protection are USER steps. Closing it also closes `t7`.
- **`2026-06-26_t7-cross-platform-packaging-verify.md`** — Linux verified; Windows/macOS pending CI.
- **`2026-06-26_p1-followup-electron-38-bump.md`** — electron 36.9.5 fixed the ASAR-integrity CVE; 3 other moderate advisories need electron **38.8.6+** (major bump). Low practical risk; do when a major-bump window is acceptable.

---

## 6. Recommended next steps (in order)

1. **PUSH THE BRANCH and let CI validate everything on Windows/macOS/Linux before building more.** A lot rides on the foundation now and this is a single-Linux env — CI is the safety net it can't be. (User must push / `gh auth`. Local `bun run make` installers also need `rpmbuild`/`dpkg` which aren't installed — CI handles per-OS via `package`/`make`.)
2. ✅ **D1 Scripture** — DONE.
3. **D2 Presentation engine**, then **D4 Media** — buildable but need visual/asset verification; coordinate observed runs with the user. D2 should absorb the two D1 follow-ups in §7.
4. After all 5 domains: run the **Phase 3 MVP exit gate** in `plan/phases/phase-3-domains.md`, then Phase 4 (AI scripture detection — `plan/ai-scripture-detection-spec.md`) and Phase 5 (hardening/release).

---

## 7. Non-blocking follow-ups (reviewer-noted; opportunistic)
- **Scripture → belongs to D2 (presentation engine):** (a) multi-verse passage projection needs slide chunking + next/prev navigation (the pure chunker `chunkForProjection` was REMOVED at D1 close as premature dead code — §1.9 — rebuild it in D2 context); (b) chapter-browse UI (the `getChapter` stack was likewise removed; re-add a `scripture:get-chapter` path when the browse UI lands). `bibleRepository`/schema are multi-translation-ready (`translation_id` keyed) but only WEB is bundled; a translation picker would consume the already-wired `listTranslations`/`listBooks`.
- Songs: no edit/delete UI yet; no OpenLyrics/CCLI import; CCLI reporting hook (R17) later.
- Plans: drag-drop reorder is up/down buttons (brief-sanctioned); recurring templates deferred; scripture/media item kinds land with D1/D4.
- IPC registry `handle(channel: string, ...)` could be typed against a `CHANNELS` union for compile-time safety.
- CSP: `onHeadersReceived` may not fire for `file://` in prod; the `<meta>` floor still default-denies. Consider tightening the meta to the strict prod policy + dev-server override later.
- `@reduxjs/toolkit`/`react-redux` were REMOVED in D5 (unused after retiring the fixture). Re-add if a real UI cache is needed (§5.4 still sanctions Redux as a view-cache only).

---

## 8. Commit/PR discipline (CLAUDE.md §5.10)
- Branch per task normally; **all work so far is on `phase0/baseline-setup`** — confirm with the user whether to keep going there or branch per phase.
- Conventional Commits; END every commit message with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Commit/push only when the user asks.** (They've approved each phase with "go ahead".)
- Every implementation task gets a **separate reviewer agent** sign-off before its CAMS task closes (§7) — spawn via the Agent tool with the commit range + rules to check.

---

## 9. Full commit history this session (newest first, on `phase0/baseline-setup`)
```
a8bb5ad feat(phase3): surface plan duration estimate (plans:estimate + UI); close P3-D5
cada7c7 feat(phase3): Service planning domain; retire servicesData fixture + Redux (P3-D5)
d55e5d5 fix(phase3): CRLF-normalize song import; close P3-D3 (reviewer PASS)
96a32c4 feat(phase3): Songs domain — schema, repository, IPC, UI, present-to-audience (P3-D3)
60bcc29 chore(phase2): close DB on before-quit; close CAMS T1-T5 (reviews + security sign-offs)
3c74b57 test(phase2): foundation unit coverage — ipc harness, schemas, migrations, config (P2-T5)
6b56995 feat(phase2): config + safeStorage secrets (main-only) + declarative CSP (P2-T4)
dd07784 feat(phase2): WindowManager + audience window, present:* broadcast, fail-safe to black (P2-T3)
83cabcf feat(phase2): SQLite + migrations + repository layer, settings persist (P2-T2)
191e567 harden(phase2): generic IPC error to renderer + close P2-T1 (security sign-off)
8fda21a feat(phase2): typed zod-validated IPC contract + contextBridge (P2-T1)
1d2f395 docs(phase1): close CAMS tasks; correct T3 CVE record; file electron-38 follow-up
45ffe3b style(phase1): format package.json + add format:check to CI
4f40844 ci(phase1): GitHub Actions 3-OS matrix — typecheck/lint/unit/build/e2e on bun (P1-T4)
01d944d test(phase1): Vitest + Playwright-Electron harness with passing tests (P1-T5)
ae23aaa feat(phase1): observability — electron-log, renderer error boundary, crash handlers (P1-T6)
2958be5 build(phase1): bump electron 36.2->36.9.5 (CVEs); add electron-log, vitest, playwright
3c9ea28 build(phase1): bump lucide-react, radix, postcss, autoprefixer (P1-T3)
e51d788 build(phase1): bump Vite 5 -> 7 (P1-T3)
f688210 build(phase1): modernize tsconfig + migrate to ESLint 9 flat config + Prettier (P1-T1/T2)
9518315 feat(phase0): HashRouter fix (B1), Electron hardening (S1-S4), toolchain bump
02c0bed refactor(phase0): restructure repo to target tree; purge dead code (T3, T6)
914955b chore(phase0): establish bun baseline, planning scaffold, and CAMS tasks
e3255d3 refactor: add thememing   <- last commit BEFORE this session
```
