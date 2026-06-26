# Phase 0 — Stabilize, Secure & Restructure (PM Brief)

> **Goal:** turn the scaffold into a clean, correctly-packaged, security-hardened baseline **and reorganize the entire repository into a collaboration-ready structure** so every later phase builds on solid ground. **No new product features in this phase.**

**Effort:** ~1–2 weeks (1–2 devs) · **Branch prefix:** `phase0/`

---

## Entry gate
- None — this is the first phase. The repo is the audited scaffold (see `revival/01-codebase-audit.md`).

## PM start sequence (do not skip — CLAUDE.md §2)
1. Read this brief, `CLAUDE.md`, `revival/01-codebase-audit.md` (§2 security, §5 dead code, §7 architecture), and `revival/04-implementation-timeline.md` §1 (target tree).
2. Read `tasks/active/` and `tasks/completed/` — confirm nothing here is already done.
3. Run the **baseline reality check** before assigning anything: `npm install`, then `npm run lint`, `npm start`, and `npm run make`. Record what works/breaks. This grounds the tasks in fact, not assumption.
4. Create the CAMS task files below in `tasks/active/`, assign, review, gate, close.

---

## Task breakdown

> Order matters: **T1 → T2 (baseline green) → T3 (restructure) → T4–T6 (fixes on the new tree) → T7 (verify)**. Restructuring on a known-good baseline means any breakage is attributable to the move, not pre-existing rot.

### T1 — Dependency install & audit `[implementer + security]`
- **Scope:** `package.json`, `package-lock.json`. Run `npm install`; run `npm audit --omit=dev` and `npm audit`.
- **Rules:** CLAUDE.md §1.7, §5.10.
- **Done:** install succeeds; audit results recorded in the task outcome and folded into `revival/01-codebase-audit.md` §2. No remediation yet (that's Phase 1) unless a **critical** runtime CVE exists — then patch now.

### T2 — Establish a green baseline build `[implementer]`
- **Scope:** confirm `npm start` (dev) launches the window and `npm run make` produces a runnable package on the dev OS. Document any failure precisely.
- **Rules:** §1.1.
- **Done:** dev app launches; `make` output runs. Tag the commit `v0.1.0-baseline` **before** restructuring, so there is a rollback point.

### T3 — Full repository restructure `[restructure]` ⭐ the centerpiece
- **Scope:** move every file to its target location per the **Restructure Map** below; update all imports, the `@/*` alias, `index.html` entry, `forge.config.ts` entries, and vite configs accordingly.
- **Rules:** §5.2 (process boundaries), §5.9 (files/naming), §1.9 (delete dead code).
- **Done:** tree matches the map; `tsc --noEmit` clean; `npm start` and `npm run make` still work identically; no dead files remain. **Use `git mv`** so history is preserved.

### T4 — Fix production router bug (B1) `[implementer]`
- **Scope:** renderer entry — replace `BrowserRouter` with `HashRouter` (or `MemoryRouter`); centralize routing in `src/renderer/app/router.tsx`.
- **Rules:** §1.2.
- **Done:** routing works in **both** `npm start` and the **packaged** `make` build (deep links + reload survive). Covered by the Phase 2 e2e later; for now verify manually and note it.

### T5 — Electron security hardening (S1–S4) `[security]`
- **Scope:** `src/main/index.ts`, `index.html`, `forge.config.ts`.
  - Set `webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }` explicitly.
  - Add a strict **Content-Security-Policy** (meta tag + `session.defaultSession` header). Default-deny; `connect-src` will be widened per-domain in later phases.
  - Guard `openDevTools()` behind `if (!app.isPackaged)`.
  - Add `webContents.setWindowOpenHandler` (deny by default) and a `will-navigate` allow-list.
  - Keep the existing Fuses config (it's good — §S6) and `asar: true`.
- **Rules:** §1.4, §5.2, §5.7.
- **Done:** all four items in place; app still launches; security reviewer signs off; CSP has no console violations in normal use.

### T6 — Dead code & duplication purge (D1–D5) `[restructure]` (folds into T3)
- **Scope:** delete `src/renderer.ts`, `src/pages/Home.tsx`; keep **one** sidebar (delete the other two); consolidate the two CSS entry points into one `globals.css`.
- **Rules:** §1.9, §5.6.
- **Done:** only one sidebar and one global stylesheet remain; no references to deleted files; `tsc` clean.

### T7 — Cross-platform packaging verification `[tester]`
- **Scope:** run `npm run make` and launch the artifact on Linux + Windows (macOS if available); confirm window opens, theme applies, routing works, no DevTools in packaged build.
- **Rules:** §6 (done = it runs), §5.8.
- **Done:** packaged app verified on ≥2 OSes; results in the task outcome.

---

## Restructure Map (complete, file-by-file)

> Target layout per `revival/01-codebase-audit.md` §7.3. **Build-tool configs stay at repo root** (electron-forge/Vite/Tailwind/PostCSS expect them there). Source is reorganized under `src/`; docs are de-cluttered into `docs/`.

### Move / rename (`git mv`)

| Current | → Target | Notes |
|---|---|---|
| `src/main.ts` | `src/main/index.ts` | update `forge.config.ts` entry to `src/main/index.ts` |
| `src/preload.ts` | `src/preload/index.ts` | update `forge.config.ts` preload entry; will gain real `contextBridge` in Phase 2 |
| `src/renderer.tsx` | `src/renderer/index.tsx` | update `index.html` `<script src>` to `/src/renderer/index.tsx` |
| `src/renderer/App.tsx` | `src/renderer/app/App.tsx` | router extracted to `app/router.tsx` (T4); providers to `app/providers.tsx` |
| `src/lib/store.ts` | `src/renderer/store/index.ts` | |
| `src/lib/servicesSlice.ts` | `src/renderer/store/slices/servicesSlice.ts` | |
| `src/lib/theme.tsx` | `src/renderer/lib/theme.tsx` | |
| `src/lib/utils.ts` | `src/renderer/lib/utils.ts` | shadcn `cn()` helper |
| `src/lib/servicesData.ts` | `src/shared/fixtures/servicesData.ts` | temporary seed; replaced by DB in Phase 3 |
| `src/dashboard/AppLayout.tsx` | `src/renderer/components/layout/AppLayout.tsx` | |
| `src/dashboard/Sidebar.tsx` | `src/renderer/components/layout/Sidebar.tsx` | **keep this one** |
| `src/dashboard/Homepage.tsx` | `src/renderer/features/home/HomePage.tsx` | |
| `src/dashboard/ServicesPage.tsx` | `src/renderer/features/planning/ServicesPage.tsx` | services = service-planning feature |
| `src/dashboard/ServiceDetail.tsx` | `src/renderer/features/planning/ServiceDetail.tsx` | |
| `src/dashboard/SettingsPage.tsx` | `src/renderer/features/settings/SettingsPage.tsx` | |
| `src/components/ui/*.tsx` | `src/renderer/components/ui/*.tsx` | shadcn primitives, unchanged |
| `src/index.css` + `src/styles/globals.css` | `src/renderer/styles/globals.css` | **consolidate into one** (T6) |
| `Project.md`, `development-plan.md`, `activities.md`, `Progress1.md`, `Progress-old.md`, `SystemDiagram.md`, `PraisePresent_Diagrams.mermaid`, `design.png` | `docs/` | de-clutter root |
| `revival/` | `docs/revival/` | keep deliverables together under `docs/` (update links in CLAUDE.md §8) |

### Delete (dead/duplicate — T6)

| File | Reason |
|---|---|
| `src/renderer.ts` | leftover Forge template entry; real entry is `renderer.tsx` |
| `src/pages/Home.tsx` | unreferenced |
| `src/dashboard/AnimatedSidebar.tsx` | duplicate sidebar |
| `src/dashboard/SidebarDrawer.tsx` | duplicate sidebar (drawer already "removed" per `activities.md`) |

### Create (empty skeleton dirs with a `.gitkeep` + short `README.md`, filled in later phases)

```
src/main/windows/        # WindowManager (Phase 2)
src/main/ipc/            # IPC handlers, channel-per-domain (Phase 2)
src/main/db/             # connection, migrations/, repositories/ (Phase 2)
src/main/services/       # domain services (Phase 2–4)
src/main/infra/          # logger, config, auto-update, errors (Phase 2)
src/preload/             # api.d.ts contract (Phase 2)
src/renderer/features/scripture/    # (Phase 3)
src/renderer/features/songs/        # (Phase 3)
src/renderer/features/media/        # (Phase 3)
src/renderer/features/presentation/ # (Phase 3)
src/shared/types/  src/shared/schemas/  src/shared/constants/  # (Phase 2)
src/audience/            # audience-window renderer entry (Phase 2)
tests/e2e/               # Playwright (Phase 1–2)
```

### Resulting top-level layout

```
PraisePresent/
├── CLAUDE.md                ← engineering constitution
├── plan/phases/             ← PM briefs (this folder)
├── tasks/{active,completed} ← CAMS
├── docs/                    ← SRS, design docs, revival/ deliverables, diagrams
├── src/{main,preload,renderer,audience,shared}/
├── tests/
├── index.html               ← Vite renderer root (entry → src/renderer/index.tsx)
├── package.json  forge.config.ts  vite.*.config.ts  tailwind.config.js
├── postcss.config.js  tsconfig.json  components.json  eslint config
└── ...
```

### Config files to update during the move (do not miss these)
- **`forge.config.ts`** — `entry: 'src/main/index.ts'` and `entry: 'src/preload/index.ts'`.
- **`index.html`** — `<script type="module" src="/src/renderer/index.tsx">`.
- **`vite.renderer.config.ts`** — `@` alias still → `./src` (path-alias imports keep working).
- **`tsconfig.json`** — `paths` `@/*` → `./src/*` unchanged; verify `include` still covers `src/**`.
- **`components.json`** (shadcn) — update `aliases` if the ui/utils paths moved.

---

## Verification & review (PM runs before declaring done)
1. `tsc --noEmit` clean; `npm run lint` clean.
2. `npm start` launches; navigation works; theme toggles.
3. `npm run make` produces an artifact that runs on ≥2 OSes (T7); **routing works in the packaged build**; **no DevTools** in packaged build.
4. `git status` shows moves as renames (history preserved); no orphaned imports.
5. A `reviewer` confirms the tree matches the map and CLAUDE.md §5.2/§5.9; a `security` agent signs off on T5.

## Exit gate (advance to Phase 1 only when ALL true)
- [ ] Repo matches the Restructure Map; dead code deleted; one sidebar, one stylesheet.
- [ ] `BrowserRouter` removed; routing verified in **packaged** build (B1 closed).
- [ ] Security hardening S1–S4 in place; security sign-off recorded.
- [ ] `tsc`/lint clean; `npm start` and `npm run make` both work; packaged app verified on ≥2 OSes.
- [ ] `npm audit` results recorded.
- [ ] All Phase 0 CAMS tasks moved to `tasks/completed/` with outcomes; PM synthesis reported to user.

## Risks (see `docs/revival/06-risk-assessment.md`)
- **R1** packaged-routing breakage → T4 + T7 close it. **R3** native-module/build → keep `auto-unpack-natives`. **R16** no tests yet → acceptable in Phase 0 (harness lands Phase 1–2); **do not** add features here. Restructure risk is mitigated by the `v0.1.0-baseline` tag (T2) — roll back if a move breaks the build and re-do incrementally.
