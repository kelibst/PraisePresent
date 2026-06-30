# PraisePresent Revival Plan

**Prepared:** 2026-06-26
**Scope:** End-to-end audit, modernization-vs-rewrite analysis, restructuring roadmap, and an AI auto-scripture-detection technical specification.

---

## 0. Read this first — what the project actually is

The brief framed PraisePresent as a *"neglected Node.js project in disrepair."* The audit found something different, and the distinction drives every recommendation below:

> **PraisePresent is not a decayed legacy codebase. It is an early-stage scaffold.** It has **3 git commits (all from one day), ~1,031 lines of TS/TSX, no `node_modules` ever installed, and zero tests.** Roughly **90% of the code is the unmodified Electron-Forge + Vite template**, plus a thin dashboard shell (sidebar, theme toggle, a static list of three hard-coded "services").

The "disrepair" is real but it is a **vision-vs-implementation gap**, not rot:

| | |
|---|---|
| **Documented vision (`Project.md` SRS)** | A full church-presentation suite: scripture DB + search, song & media management, dual-screen live presentation, service planning, templates, multi-display, remote control, cloud sync, mobile companion. ~850 numbered requirements. |
| **Actual implementation** | Routing, a theme provider, three competing sidebar components, and a Redux slice that holds 3 hard-coded service rows and has **no reducers**. |
| **Estimated completion vs SRS** | **< 5%.** None of the core product (scripture, presentation engine, persistence, IPC) exists. |

**Consequence for the "rewrite in Rust" question:** there is essentially nothing built to *rewrite*. The decision is not *migrate vs. keep* — it is *what to build the foundation in*. That reframing is covered in detail in [03-nodejs-vs-rust.md](03-nodejs-vs-rust.md), and the short answer is **retain Electron/Node/React, modernize the toolchain, and introduce Rust surgically (native module or sidecar) only for the two hot paths that justify it: Bible full-text search and offline AI inference.** A wholesale Rust rewrite is *not* recommended and would destroy the small amount of working investment for no product benefit.

---

## 1. Deliverables index

| # | Deliverable | File |
|---|---|---|
| 1 | **Full codebase audit** — technical debt, outdated deps, security gaps, dead code, functional gaps, **+ architecture analysis** | [01-codebase-audit.md](01-codebase-audit.md) |
| 2 | **Node.js modernization vs. Rust rewrite** — options A/B/C, cost-benefit, recommendation | [03-nodejs-vs-rust.md](03-nodejs-vs-rust.md) |
| 3 | **Implementation timeline** — restructuring blueprint + phased roadmap (and conditional migration path) | [04-implementation-timeline.md](04-implementation-timeline.md) |
| 4 | **AI auto-scripture-detection technical spec** — offline + online modes, models, data, training, testing | [../plan/ai-scripture-detection-spec.md](../plan/ai-scripture-detection-spec.md) |
| 5 | **Risk assessment & mitigation** — all proposed changes, stability during revival | [06-risk-assessment.md](06-risk-assessment.md) |

> Deliverables 1 and the requested *architecture analysis* are combined in `01` (audit § 7). Deliverable numbering above matches the brief's "Deliverables" list; file numbering is sequential.

---

## 2. Top findings at a glance

**Must-fix before building anything (latent/structural):**
1. **`BrowserRouter` will break the packaged app.** It depends on HTML5 history + a server; the production renderer loads over `file://` via `loadFile`. Works in dev, **breaks on `electron-forge make`**. → switch to `HashRouter`/`MemoryRouter`. ([01](01-codebase-audit.md) B1)
2. **No secure IPC layer exists** (empty `preload.ts`, no `contextBridge`). Every SRS feature (DB, Bible API, file system, second display) needs IPC that has not been designed. ([01](01-codebase-audit.md) S5/A-gaps)
3. **No persistence layer.** SRS mandates SQLite; there is none. State is a static seed array.
4. **DevTools opens unconditionally**, no Content-Security-Policy, no navigation guards — three items off the Electron security checklist. ([01](01-codebase-audit.md) S2–S4)

**Toolchain rot (low effort, high leverage):**
5. **TypeScript `~4.5.4`** (Nov 2021, ~4.5 yrs stale) and **ESLint 8 / typescript-eslint 5** (EOL config style). ([01](01-codebase-audit.md) O1–O2)

**Dead weight to delete:** `src/renderer.ts`, `src/pages/Home.tsx`, and 2 of 3 sidebar components are unused. ([01](01-codebase-audit.md) D1–D5)

**The good news:** the *foundation choices are sound* — Electron + Vite + React + Redux Toolkit + Tailwind/shadcn is the right stack for this product, Electron Fuses are configured securely, and the SRS is thorough. The project doesn't need rescue from bad decisions; it needs a disciplined build-out on top of a clean, modernized base.

---

## 3. Recommended path (one sentence)

**Keep the stack, modernize the toolchain, harden Electron security, add the missing foundation (typed IPC + SQLite + tests/CI), then build the product domains in SRS-priority order — adding Rust only for Bible search and offline AI inference once profiling proves it's needed.**

See [04-implementation-timeline.md](04-implementation-timeline.md) for the phased schedule.
