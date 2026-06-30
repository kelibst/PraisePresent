# Deliverable 1 — Full Codebase Audit & Architecture Analysis

**Project:** PraisePresent (Electron desktop church-presentation app)
**Date:** 2026-06-26
**Method:** Manual end-to-end review of every source, config, and doc file in the repo (`git ls-files`), cross-referenced against the SRS in `Project.md`. `node_modules` was not installed, so dependency CVEs are assessed from `package.json` versions rather than a live `npm audit`.

---

## 1. Snapshot

| Metric | Value |
|---|---|
| Source code | ~1,031 LOC across 16 `.tsx` + 12 `.ts` files |
| Git history | 3 commits (`initial setup`, homepage/service page, theming) — all dated 2026-06-26 |
| Dependencies installed | **None** (`node_modules` absent; never `npm install`-ed) |
| Tests | **0** (no test runner, no `*.test.*`/`*.spec.*`) |
| CI / release pipeline | None configured/validated |
| Stack | Electron 36.2.0 · electron-forge 7.8 · Vite 5.4.19 · React 18.2 · react-router-dom 7.5.3 · Redux Toolkit 2.8 · Tailwind 3.4 + shadcn/ui · TypeScript 4.5.4 · ESLint 8.57 |
| SRS scope vs. built | ~850 requirements documented; **< 5% implemented** |

**Verdict:** healthy foundational choices, near-zero product surface, a handful of latent defects that will bite at packaging time, and a stale toolchain. This is a *build-out*, not a *rescue*.

---

## 2. Security findings (Electron checklist)

Severity: 🔴 high · 🟠 medium · 🟡 low · 🟢 good (kept for credit)

| ID | Sev | Finding | Evidence | Fix |
|---|---|---|---|---|
| **S1** | 🟠 | `BrowserWindow` sets no explicit `contextIsolation` / `sandbox` / `nodeIntegration`. Relies on Electron 36 secure *defaults* (isolation on, node off, sandbox on). Safe today, but undocumented and one careless edit from regression. | `src/main.ts:12-18` | Set them explicitly: `contextIsolation:true, sandbox:true, nodeIntegration:false`. Add an ESLint/CI guard. |
| **S2** | 🟠 | **No Content-Security-Policy** (no `<meta http-equiv>` and no `session.defaultSession.webRequest` CSP header). | `index.html`, `src/main.ts` | Add a strict CSP; deny remote script, restrict `connect-src` to the configured Bible/AI endpoints. |
| **S3** | 🟠 | `mainWindow.webContents.openDevTools()` runs **unconditionally** — DevTools ship open in production builds. | `src/main.ts:28` | Guard with `if (!app.isPackaged)` / `MAIN_WINDOW_VITE_DEV_SERVER_URL`. |
| **S4** | 🟡 | No `webContents.setWindowOpenHandler` and no `will-navigate` handler → no protection against navigation hijacking or arbitrary `window.open`. | `src/main.ts` | Deny/allow-list navigation and new windows. |
| **S5** | 🟠 | **Preload is empty** — no `contextBridge` surface. There is no secure, typed IPC boundary, so the first feature that needs main-process power (DB, FS, API) is likely to be wired insecurely. | `src/preload.ts` (2 comment lines) | Build a typed `contextBridge` API now, before features land (see § 7). |
| **S6** | 🟢 | **Electron Fuses configured well**: `RunAsNode:false`, `EnableNodeOptionsEnvironmentVariable:false`, `EnableNodeCliInspectArguments:false`, `OnlyLoadAppFromAsar:true`, `EnableEmbeddedAsarIntegrityValidation:true`, `EnableCookieEncryption:true`, `asar:true`. Keep. | `forge.config.ts:42-50` | — |

**Dependency-CVE note:** with `node_modules` absent, no live audit was possible. The versions pinned are recent enough that no *known critical* CVE is expected, **except** the toolchain staleness in § 4. **Action:** run `npm install && npm audit --omit=dev` as the first task of Phase 1 and fold results into this table.

**Live audit result — 2026-06-26 (Phase 0 / T1, run with `bun` per user decision):**
- Package manager switched from npm → **bun 1.3.6** (`bun install` 14s vs npm 3m; `package-lock.json` removed, `bun.lock` is now the lockfile). Doc impact: update CLAUDE.md §5.10 and the Phase 0 brief to name bun once baseline is green.
- **`bun audit --production` (runtime/shipped deps): 0 vulnerabilities.** Bun resolved newer, non-vulnerable versions (e.g. `react-router-dom@7.18.0`) where npm's resolution had pulled vulnerable ranges (npm `--omit=dev` had reported 10: 6 high / 3 mod / 1 low, mostly react-router/turbo-stream — SSR-only vectors, not reachable in a client-only Electron SPA).
- **`bun audit` (all, incl. dev): 31 (12 high / 14 mod / 5 low)** — all dev-only: `vite`/`esbuild` dev-server path-traversal & SSRF advisories that **do not ship** in the packaged app.
- **Decision (per brief §T1):** no critical *runtime* CVE → **no remediation in Phase 0.** Dev-only vite/esbuild issues fold into Phase 1's toolchain upgrade; the `react-router` `bun audit fix` overlaps T4.

---

## 3. Correctness / functional defects

| ID | Sev | Finding | Evidence | Impact |
|---|---|---|---|---|
| **B1** | 🔴 | **`BrowserRouter` in an Electron renderer.** It needs HTML5 history + a server origin. The packaged app loads `index.html` via `loadFile` over `file://`, where deep links and reloads break. Works in the dev server, **fails after `electron-forge make`.** | `src/renderer.tsx:14`, `src/main.ts:24` | App routing silently broken in production — the kind of bug that ships. **Use `HashRouter` or `MemoryRouter`.** |
| **B2** | 🔴 | **No audience/projector window.** A single 800×600 `BrowserWindow` (template default). The product's central feature — dual-screen presenter + audience output on a second display — has zero implementation. | `src/main.ts:12-13` | Core feature absent; window size also unsuited to an authoring tool. |
| **B3** | 🟠 | **Redux slice has no reducers** and holds static seed data; no persistence, no async thunks. State cannot actually change. | `src/lib/servicesSlice.ts`, `servicesData.ts` | The "state management" is decorative. Theme persists only via `localStorage` (renderer-only). |
| **B4** | 🟡 | No global error boundary, no main-process `crashed`/`render-process-gone` handling, no logging. | repo-wide | SRS §5.4.1 demands 8h-stable, crash-recoverable operation; nothing supports it yet. |

---

## 4. Outdated / unmaintained dependencies

| ID | Sev | Package | Current in repo | Issue / target |
|---|---|---|---|---|
| **O1** | 🔴 | `typescript` | `~4.5.4` (Nov 2021) | **~4.5 years stale.** Blocks `satisfies`, modern `node16`/`bundler` resolution, and is mismatched with React 18 types and current libs. → **TS 5.x.** |
| **O2** | 🟠 | `eslint` + `@typescript-eslint/*` | 8.57 + 5.62 | ESLint 8 line is EOL; legacy `.eslintrc.json`. → **ESLint 9 flat config + typescript-eslint 8.** |
| **O3** | 🟡 | `react` / `react-dom` / types | 18.2 | React 19 is GA; not urgent, but plan the bump (concurrent features, `use`, actions). |
| **O4** | 🟡 | `vite` | 5.4.19 | Vite 6/7 current. Minor; bump during toolchain pass. |
| **O5** | 🟡 | `lucide-react` | 0.344 | Far behind current (~0.5xx). Low risk, easy bump. |
| **O6** | 🟠 | *(missing)* persistence/test/IPC deps | — | No `better-sqlite3`/Drizzle, no Vitest/Playwright, no `electron-log`, no `zod`. The foundation libs the SRS requires aren't present yet. |

`react-router-dom@7` itself is current and fine — the problem is *how* it's used (B1), not its version.

---

## 5. Dead code & technical debt

| ID | Item | Evidence | Action |
|---|---|---|---|
| **D1** | `src/renderer.ts` — leftover Forge template entry; real entry is `renderer.tsx`. | `index.html:18` references `renderer.tsx`; nothing imports `renderer.ts`. | Delete. |
| **D2** | `src/pages/Home.tsx` — not referenced anywhere. | no import of `pages/Home` in `src/`. | Delete or wire intentionally. |
| **D3** | **Three sidebar components** — `Sidebar.tsx`, `AnimatedSidebar.tsx`, `SidebarDrawer.tsx`. `activities.md` says the drawer was "removed," but the file remains; competing implementations. | `src/dashboard/*` | Keep one, delete the rest. |
| **D4** | **Two CSS entry points** — `src/index.css` and `src/styles/globals.css` (duplicate Tailwind base). | both present | Consolidate to one. |
| **D5** | Stub pages — `SettingsPage.tsx` (14 LOC), `ServiceDetail.tsx` (23 LOC). | line counts | Acceptable as stubs; track as "not implemented," don't mistake for done. |

No `TODO`/`FIXME`/`HACK` markers exist — consistent with "freshly scaffolded," not "long-neglected."

---

## 6. Functional-gap analysis (implemented vs. SRS)

| SRS domain | Required (Project.md) | Implemented | Gap |
|---|---|---|---|
| Scripture (DB, search, display) | §3.2 — multi-translation DB, reference/keyword/**topic** search, projection formatting | **Nothing** | 100% |
| Presentation engine | §3.1 / §3.5 — slide editor, rendering, transitions, dual-screen | Nothing | 100% |
| Songs | §3.3 — DB, import (CCLI/OpenLyrics), editor | Nothing | 100% |
| Media | §3.4 — library, formats, playback, backgrounds | Nothing | 100% |
| Service planning | §3.6 — ordered elements, templates, drag-drop | **Static list of 3 rows** | ~98% |
| Live controls / multi-display | §3.5 / §4.2 | Nothing | 100% |
| Data mgmt (backup, import/export) | §3.8 | Nothing | 100% |
| Settings / profiles | §3.7 | 14-LOC stub | ~99% |
| Persistence (SQLite) | §6.2 | Nothing | 100% |
| App shell (routing, theme, layout) | §4.1 | **Working** | ~done |

**The product's defining feature — topic-based scripture search (the stated differentiator vs. EasyWorship) — has no code.** The new AI auto-scripture-detection feature (Deliverable 4) builds directly on this absent scripture layer, so the scripture domain is the critical-path dependency for both the SRS and the AI work.

---

## 7. Architecture analysis

### 7.1 Current architecture (as-built)

```
index.html ── renderer.tsx ── <Provider store> ── <ThemeProvider> ── <BrowserRouter>
                                                                          └── <App> Routes
                                                                                ├── / Homepage
                                                                                └── AppLayout
                                                                                      └── /services (+ :id)
Redux store ── servicesSlice (no reducers) ── servicesData.ts (3 hard-coded rows)
main.ts ── one 800×600 BrowserWindow ── loadURL(dev) / loadFile(prod) ── DevTools always open
preload.ts ── (empty)
```

**Characterization:** a **renderer-centric React SPA inside a default Electron shell.** All logic lives in the renderer; the main process does nothing but open a window; the preload bridge is empty; there is no persistence and no external integration. The only data flow is `servicesData.ts → slice → store → component`.

### 7.2 Architectural flaws (maintainability & scalability)

1. **No process separation of concerns.** Domain logic belongs in the main process (DB access, file I/O, Bible API, AI inference, window orchestration) behind IPC. Today there is no place for it, so it will accrete in React components.
2. **No IPC contract.** Empty preload means no typed, validated boundary. Without it, features will either (a) be wired insecurely, or (b) get blocked entirely.
3. **No persistence boundary.** Redux is being used as a fake database. Real data needs SQLite in main + a query/repository layer; Redux should cache view state, not own truth.
4. **No domain/module structure.** `dashboard/` mixes layout, navigation, state, and seed data. There's no feature-sliced layout to absorb scripture/songs/media/presentation engines without turning into a ball of mud.
5. **Single-window assumption** baked into `main.ts`. The presenter/audience dual-window model — the heart of the product — has no home in the current structure.
6. **No cross-cutting infrastructure:** logging, error handling, config/secrets, migrations, telemetry, update channel — all absent.

### 7.3 Target architecture (recommended)

A layered, three-tier Electron architecture with explicit IPC and a dedicated audience window:

```
┌─────────────────────────── MAIN PROCESS (Node) ───────────────────────────┐
│  WindowManager (presenter window + audience/projector window + stage)      │
│  IPC handlers (ipcMain.handle, channel-per-domain, zod-validated)          │
│  Domain services:                                                          │
│    • ScriptureService  ── SQLite (better-sqlite3) + FTS5 / Rust FTS module  │
│    • SongService · MediaService · ServicePlanService · SettingsService     │
│    • PresentationController (live state, slide queue, black/blank)          │
│    • BibleApiClient (online) + offline cache                               │
│    • AIScriptureDetector (online cloud + offline local engine) ── Deliv.4  │
│  Infra: db/migrations · electron-log · config · auto-update                │
└───────────────▲───────────────────────────────────────────────────────────┘
                │  contextBridge (typed, allow-listed API surface)
┌───────────────┴──────────── PRELOAD (isolated) ────────────────────────────┐
│  window.api = { scripture, songs, media, plans, present, ai, settings }    │
└───────────────▲───────────────────────────────────────────────────────────┘
                │  invoke/handle + event streams
┌───────────────┴──────── RENDERER(S) (React + Vite) ────────────────────────┐
│  Presenter UI (authoring + live control)   │  Audience UI (projection out) │
│  Feature modules: scripture · songs · media · planning · presentation      │
│  Redux Toolkit = view/UI cache only (truth lives in main/SQLite)           │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key moves:**
- **Two BrowserWindows** (presenter + audience), orchestrated by a `WindowManager`; audience window targets the secondary `screen` display, BlackScreen/transition state driven from main.
- **SQLite in main** via `better-sqlite3` (synchronous, fast, well-suited to Electron) with a thin repository layer + a migrations runner; optional Drizzle for typed queries.
- **One IPC channel namespace per domain**, every payload validated with `zod`; preload exposes a minimal typed `window.api`.
- **Feature-sliced renderer** (`src/features/{scripture,songs,media,planning,presentation}`), shared UI in `src/components/ui` (already started with shadcn).
- **Rust insertion points (optional, profile-gated):** `ScriptureService` FTS/fuzzy resolver and `AIScriptureDetector` offline inference are the only two places where a Rust native module (napi-rs) or sidecar earns its keep — see [03-nodejs-vs-rust.md](03-nodejs-vs-rust.md).

### 7.4 Data flows (target)

- **Authoring:** Renderer → `window.api.scripture.search(q)` → IPC → ScriptureService → SQLite FTS → results back to renderer → Redux view cache.
- **Live present:** Presenter UI → `present.show(slide)` → PresentationController updates canonical live state → broadcasts to **audience window** + presenter preview via IPC events.
- **AI detect (online):** mic/text → ASR/parse → cloud model → reference → `ScriptureService.resolve` → auto-queue slide (operator-confirmed). **(offline):** same pipeline, local ASR + local resolver. (Full design in Deliverable 4.)
- **Offline-first:** BibleApiClient hydrates SQLite once; thereafter scripture works with no network. AI online mode degrades to offline mode on connectivity loss.

---

## 8. Prioritized remediation backlog (feeds the timeline)

| Priority | Items | Why |
|---|---|---|
| **P0 — stabilize** | Install deps + `npm audit`; fix B1 (router); S2/S3/S4 (CSP, DevTools, nav guards); make `electron-forge make` produce a working build | Stop shipping latent breakage |
| **P1 — modernize toolchain** | O1 (TS5), O2 (ESLint9 flat), delete D1–D4, consolidate CSS | Cheap, high leverage, unblocks everything |
| **P2 — foundation** | Typed contextBridge IPC (S5), SQLite + migrations, WindowManager + audience window (B2), Vitest + Playwright + CI, electron-log + error boundaries (B4) | The missing skeleton every feature hangs on |
| **P3 — product domains** | Scripture (DB + topic search) → Presentation engine → Songs → Media → Service planning | SRS core, in dependency order |
| **P4 — AI feature** | Auto-scripture detection (online then offline) | Builds on P3 scripture layer |

Sequenced with estimates in [04-implementation-timeline.md](04-implementation-timeline.md). Risks for each in [06-risk-assessment.md](06-risk-assessment.md).
