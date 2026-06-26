# CLAUDE.md — PraisePresent Engineering Constitution

> **This file is binding on every agent (human or AI) that touches this repository.** Read it in full before doing anything. The PM agent enforces it; specialist agents obey it unconditionally. When a phase brief and this file disagree, **this file wins** unless the brief explicitly overrides a named rule with a reason.

---

## 0. Project context (read first)

**PraisePresent** is a cross-platform **Electron** desktop app for church worship presentation: scripture, songs, media, service planning, dual-screen live presentation, and (new) AI auto-scripture detection.

- **Stack:** Electron · electron-forge · Vite · React · TypeScript · Redux Toolkit · Tailwind + shadcn/ui · SQLite (`better-sqlite3`, being added). Optional Rust (napi-rs/sidecar) for search + offline AI only.
- **Current reality:** an early scaffold (~1k LOC, ~90% template), being revived. **Do not assume features exist — verify in code.**
- **The plan of record lives in [`plan/phases/`](plan/phases/).** The full audit, architecture target, and rationale live in [`revival/`](revival/) (or `docs/revival/` after restructure). Read the relevant phase brief and the audit before starting work.

---

## 1. Golden rules (non-negotiable)

These exist because the audit found each one already violated or missing. Never reintroduce them.

1. **Read before you write.** No code change without reading the surrounding files and the relevant phase brief first.
2. **Renderer uses `HashRouter`/`MemoryRouter`, never `BrowserRouter`.** The packaged app loads over `file://`; `BrowserRouter` silently breaks in production.
3. **No privileged power in the renderer.** All Node/FS/DB/network/AI work runs in the **main process** behind a **typed, `zod`-validated `contextBridge` IPC** surface. Renderer never imports `electron`/`fs`/`ipcRenderer` directly.
4. **Electron security is on by default:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, a strict **CSP**, and `setWindowOpenHandler`/`will-navigate` allow-lists. DevTools only when `!app.isPackaged`.
5. **Truth lives in SQLite, not Redux.** Redux is a view/UI cache only.
6. **Nothing merges without tests + green CI.** New logic ships with unit tests; user-facing flows ship with an e2e check.
7. **No secrets in the renderer or in git.** API keys (Bible/AI) live in OS secure storage, used only from main.
8. **Every task is tracked in CAMS** (§4). No silent work.
9. **Leave it cleaner.** Delete dead code you touch; never add a second way to do a thing that already has one.

---

## 2. Agent roles

### Lead Agent — Project Manager

The **first agent spawned** on any multi-agent task MUST act as the **Project Manager (PM)**. This is a hard requirement, not optional.

**PM Responsibilities:**

1. **Read before anything else** — scan the codebase, existing tasks, and relevant docs before forming a plan.
2. **Audit active tasks** — read all files in `tasks/active/`. Do not create a task that already exists.
3. **Audit completed tasks** — read `tasks/completed/` to understand what has already been done and avoid regressions.
4. **Decompose and assign** — break the work into clear, atomic tasks and hand them to specialist agents with precise scope: which files, which rules apply, what done looks like.
5. **Enforce rules** — every task briefing must reference the applicable rules from this file (CAMS, security, coding standards).
6. **Track and close** — move task files from `tasks/active/` to `tasks/completed/` when done, with a brief outcome note appended.
7. **Synthesize results** — collect agent outputs, verify they cohere, and report a single summary to the user.

**PM must never skip the read-first step.** No assumptions about the codebase.

**PM must also:** assign a **separate reviewer agent** to verify each implementation task (the implementer never reviews their own work — see §9), and run/confirm the phase **exit gate** before declaring a phase complete.

### Specialist Agents

Receive task briefs from the PM and execute them. Each agent:
- Works only within the scope defined by the PM.
- Follows all rules in this file unconditionally.
- Reports results back clearly (files changed, decisions made, blockers hit).

**Specialist types used in this project:** `implementer` (writes code), `reviewer` (audits diffs against this file), `tester` (writes/runs tests), `security` (Electron/IPC/secrets review), `restructure` (file moves + import rewiring). The PM picks the type per task.

---

## 3. (reserved)

---

## 4. CAMS — Task Management

**Active tasks**: `tasks/active/`
**Completed tasks**: `tasks/completed/`

Task files use the naming convention `YYYY-MM-DD_<short-slug>.md`.

A task file contains:
- **Goal**: what needs to be done
- **Scope**: files/areas in play
- **Rules**: which rules from this document apply
- **Status**: pending / in-progress / blocked
- **Outcome** (added on completion): what changed, any decisions made

**PM protocol**:
1. Check `tasks/active/` — do not duplicate an existing task.
2. Check `tasks/completed/` — don't redo work or break prior outcomes.
3. Create task file in `tasks/active/` before starting any work.
4. Move to `tasks/completed/` (append outcome) when done.

**Task file template** (copy this):

```markdown
# <Task title>
- **ID:** YYYY-MM-DD_<slug>
- **Phase:** <0–5>
- **Assigned agent type:** implementer | reviewer | tester | security | restructure
- **Status:** pending | in-progress | blocked | done

## Goal
<one paragraph: what done looks like>

## Scope (files/areas)
- path/to/file — what changes

## Rules that apply
- CLAUDE.md §<n> ...
- Phase brief: plan/phases/<file>#<task>

## Acceptance criteria
- [ ] ...
- [ ] tests added/updated and passing
- [ ] reviewer signed off

## Outcome (filled on completion)
<what changed, decisions, follow-ups, links to commits/PRs>
```

---

## 5. Coding standards

### 5.1 TypeScript (all code)
- **`strict: true`** stays on. No `any` — use `unknown` + narrowing, or a real type. No `@ts-ignore` without a one-line justification comment.
- Validate **all external/boundary data** (IPC payloads, API responses, file contents, DB rows at the edge) with **`zod`**; derive types via `z.infer`.
- Prefer `type` aliases for data; `interface` for extensible object contracts. Name types `PascalCase`.
- Pure functions where possible; no hidden global state. Return typed `Result`/throw typed errors — never swallow.
- Keep modules small and single-purpose; one default export max, prefer named exports.

### 5.2 Process boundaries (Electron)
- **Main process** (`src/main/**`): app lifecycle, windows, DB, FS, network, AI, all business logic. The only place allowed to import `electron` main APIs, `node:*`, `better-sqlite3`.
- **Preload** (`src/preload/**`): the *only* bridge. Expose a minimal, typed `window.api` via `contextBridge`. No business logic.
- **Renderer** (`src/renderer/**`, `src/audience/**`): React only. May import `window.api` types from the shared contract. **Never** imports `electron`/`ipcRenderer`/`node:*`/`fs`.
- **Shared** (`src/shared/**`): pure types, zod schemas, constants imported by both sides. No runtime side effects, no platform APIs.

### 5.3 IPC contract
- One channel namespace per domain: `scripture:*`, `songs:*`, `media:*`, `plans:*`, `present:*`, `ai:*`, `settings:*`.
- Request/response via `ipcMain.handle` / `ipcRenderer.invoke`; main→renderer pushes via typed event channels.
- Every handler: validate input with zod → do work → return a typed result; never trust the renderer.
- The channel list, payload schemas, and `window.api` type live in `src/shared/` and `src/preload/api.d.ts` so both sides share one source of truth.

### 5.4 React / renderer
- Function components + hooks only. Rules of Hooks enforced by lint.
- **Redux Toolkit = view/UI cache.** Server/DB truth comes through `window.api`; cache it, don't fork it. Use RTK slices + typed `useAppSelector`/`useAppDispatch`.
- Co-locate components with their feature under `src/renderer/features/<feature>/`. Shared primitives in `src/renderer/components/ui/` (shadcn).
- Accessibility: semantic elements, keyboard operability (this app is operated live under pressure — keyboard paths are not optional).
- No business logic in components — call into `window.api` or feature hooks/services.

### 5.5 Database
- `better-sqlite3` in main only. All access through a **repository layer** (`src/main/db/repositories/`); no raw SQL scattered in services.
- **Migrations are mandatory and forward-only** (`src/main/db/migrations/`), run on app start; never edit a shipped migration.
- Use parameterized queries always (no string interpolation into SQL).

### 5.6 Styling
- Tailwind + shadcn/ui. **One** global stylesheet (`src/renderer/styles/globals.css`). Use design tokens/CSS variables for theme; no hard-coded hex in components (brand primary is Deep Purple `#5E3B9E` — use the token).
- No competing component variants; extend the existing `ui/` primitives.

### 5.7 Errors, logging, resilience
- Main: use **`electron-log`**; handle `render-process-gone` / `child-process-gone`; never let an unhandled rejection kill a live service.
- Renderer: a top-level **error boundary**; user-facing errors are actionable, never raw stack traces on the projector.
- Anything on the **audience/projector path fails safe** (to black screen), never to a crash or a stack trace.

### 5.8 Testing
- **Vitest** for unit/integration (colocated `*.test.ts`). **Playwright (Electron)** for e2e, including against the **packaged** build.
- New logic → unit tests. New user flow → e2e. Bug fix → regression test first.
- CI gate: `tsc --noEmit` + lint + unit + e2e smoke must pass on Windows/macOS/Linux before merge.
- AI feature has an accuracy/latency harness with regression gates (see Phase 4 brief).

### 5.9 Files & naming
- Components/Types: `PascalCase.tsx` / `PascalCase`. Hooks: `useThing.ts`. Non-component modules: `camelCase.ts`. Tests: `<name>.test.ts`.
- One concern per file. Keep files under ~300 LOC; split when larger.
- Imports: use the `@/*` path alias (configured to `src/*`). No deep relative `../../../` chains.

### 5.10 Git, commits, PRs
- Branch per task: `phase<N>/<slug>`. Never commit to `master` directly.
- **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`). Small, focused commits.
- End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- PRs: link the CAMS task, list files changed + decisions, confirm tests + reviewer sign-off. Commit/push only when the user or PM asks.
- Never commit secrets, `node_modules`, build output, or model weights.

---

## 6. Definition of Done (every task)

A task is **done** only when **all** are true:
- [ ] Meets its acceptance criteria in the CAMS task file.
- [ ] `tsc --noEmit` clean, lint clean, formatted.
- [ ] Unit tests (and e2e if user-facing) added/updated and **passing**.
- [ ] No Golden Rule (§1) violated; no new dead code; no new secret.
- [ ] **A separate reviewer agent has signed off** (§9).
- [ ] CAMS task moved to `tasks/completed/` with an outcome note.

"It compiles" and "it builds" are not "done." For UI/feature work, *it runs and the behavior was observed* (use the `run`/`verify` skills).

---

## 7. Review protocol

- The **implementer never reviews their own task.** The PM assigns a distinct `reviewer` (and `security` reviewer for anything touching main/IPC/secrets/Electron config).
- Reviewer checks the diff against §1, §5, and the phase brief; verifies tests exist and pass; runs the app for UI changes; either signs off or returns specific, actionable findings.
- Security-sensitive diffs (main process, preload, `forge.config.ts`, CSP, IPC, dependency additions) require a `security` sign-off in addition.
- Findings go back to the implementer; re-review until clean. Only then does the PM close the task.

---

## 8. References
- Plan of record: [`plan/`](plan/) — PM briefs per phase in [`plan/phases/`](plan/phases/) (start at `plan/phases/README.md`), and the **AI auto-scripture-detection technical spec** at [`plan/ai-scripture-detection-spec.md`](plan/ai-scripture-detection-spec.md).
- Audit, architecture target, Node-vs-Rust analysis, risks: [`revival/`](revival/) (→ `docs/revival/` after Phase 0 restructure). The `plan/` folder stays at repo root.
- Product requirements (SRS): `Project.md` (→ `docs/Project.md` after restructure) — **aspirational**; treat "% implemented" honestly.
