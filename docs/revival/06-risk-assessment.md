# Deliverable 5 — Risk Assessment & Mitigation

**Date:** 2026-06-26
**Purpose:** ensure project stability throughout the revival. Likelihood (L) and Impact (I): Low / Med / High. **Exposure** = L×I.

---

## 1. Why overall risk is *lower* than a typical "revival"

The codebase is a small, recently-created scaffold, not a fragile legacy system with hidden production dependencies. There is **almost nothing in production to destabilize** — the dominant risk is not *breaking what exists* but *building the large missing surface correctly*. That shifts the risk profile from "regression" to "scope, sequencing, and new-tech adoption."

---

## 2. Risk register

### Technical / architecture

| ID | Risk | L | I | Exposure | Mitigation |
|---|---|---|---|---|---|
| R1 | **Packaged-build routing breakage** (`BrowserRouter` over `file://`, Audit B1) ships unnoticed | High | High | 🔴 | Fix in Phase 0; add a Playwright e2e that runs against the **packaged** app, not just dev. |
| R2 | **Insecure IPC** introduced ad hoc before the typed boundary exists (Audit S5) | Med | High | 🔴 | Build the `contextBridge`+zod surface in Phase 2 *before* any feature needs main-process power; lint-ban `nodeIntegration`/direct `ipcRenderer` in renderer. |
| R3 | **SQLite/native-module pain** (`better-sqlite3` rebuilds per Electron/OS/arch) | Med | Med | 🟠 | Use `@electron-forge/plugin-auto-unpack-natives` (already present); pin Electron; CI builds native modules on all 3 OSes; consider prebuilds. |
| R4 | **Dual-window / multi-display flakiness** on real church hardware | Med | High | 🔴 | Abstract via `WindowManager`; test on multi-monitor + projector early (Phase 2); handle display hot-plug/disconnect (SRS §3.7.3). |
| R5 | **Performance misses** (startup <10 s, ≥30 fps transitions, 8 h stability — SRS §5) | Med | Med | 🟠 | Set perf budgets in CI; profile each domain; reserve Phase 5 perf pass; lean on Chromium/FFmpeg for media. |
| R6 | **Rust module integration risk** (napi-rs/sidecar build, packaging, signing) | Low | Med | 🟡 | Keep Rust optional and profile-gated ([03](03-nodejs-vs-rust.md)); each module behind a stable IPC interface so it's removable; CI cross-compiles. |
| R7 | **Toolchain bump regressions** (TS 4.5→5, ESLint 8→9, React 18→19) | Low | Med | 🟡 | Sequence in Phase 1 on a clean baseline; one bump per PR; green CI gate. |

### AI feature

| ID | Risk | L | I | Exposure | Mitigation |
|---|---|---|---|---|---|
| R8 | **Wrong verse projected** to the congregation (false positive) | Med | High | 🔴 | Human-in-the-loop by default; auto-project only above a high confidence threshold; tune for precision over recall; track false-positive/min as a release gate (Deliverable 4 §6). |
| R9 | **Offline accuracy below usable bar** (ASR/extraction on low-end PCs) | Med | Med | 🟠 | Selectable model profiles (tiny/base/small); deterministic extractor covers the high-value explicit path without a model; publish min-spec; field-pilot before GA. |
| R10 | **Live latency too high** to keep up with speech | Med | Med | 🟠 | Streaming/interim ASR; rolling windows; fast model tier online; latency budget in the test harness. |
| R11 | **Privacy/consent breach** (audio leaves device in online mode) | Low | High | 🟠 | Offline default for sensitive deployments; explicit opt-in + on-screen indicator + kill-switch; transcript-only option; assert zero-egress in offline tests. |
| R12 | **Cloud AI/STT cost or availability** spikes during live use | Low | Med | 🟡 | Cost ceilings + VAD-gated capture; auto-degrade online→offline on failure (no operator action). |

### Project / process

| ID | Risk | L | I | Exposure | Mitigation |
|---|---|---|---|---|---|
| R13 | **Scope explosion** — the SRS is ~850 requirements; < 5% built | High | High | 🔴 | Ruthless MVP at end of Phase 3; treat SRS Phases 2–3 as post-v1; the timeline already defers cloud sync, mobile, collab. |
| R14 | **Vision-vs-reality drift** — docs describe a finished product that doesn't exist; risks misleading stakeholders | High | Med | 🟠 | This revival pack is the corrective; keep `Progress*.md`/`activities.md` honest and current; track "% of SRS" explicitly. |
| R15 | **Bus factor / Rust skills** if Rust modules adopted | Low | Med | 🟡 | Keep Rust surface tiny and well-documented; don't adopt unless profiling demands; prefer pure-Node first. |
| R16 | **No tests/CI today** → regressions invisible | High | High | 🔴 | Phase 1–2 establish Vitest + Playwright + CI before feature work; coverage gate on core modules. |
| R17 | **Content licensing** — Bible translations & CCLI songs have copyright/redistribution terms | Med | High | 🔴 | Verify each translation's license before bundling; ship only permissively-licensed texts (e.g. WEB/KJV) by default; integrate CCLI reporting (SRS §5.5); legal review before GA. |
| R18 | **Dependency CVEs** not yet assessed (`node_modules` never installed) | Med | Med | 🟠 | Run `npm audit` in Phase 0; add Dependabot/automated audit to CI; fold results into the audit report. |

---

## 3. Stability-preserving principles during revival

1. **Stabilize before building** — Phase 0 makes the app correctly packageable *first*; no feature work on a broken baseline (mitigates R1, R16).
2. **Foundation before features** — typed IPC, SQLite, windowing, and CI (Phase 2) land before any domain, so features build on a tested skeleton (R2, R3, R16).
3. **One concern per PR, green CI to merge** — especially for toolchain bumps and native modules (R3, R7).
4. **Everything reversible** — Rust modules and the (not-recommended) Tauri path are incremental and behind stable interfaces; nothing is a one-way door (R6, R15).
5. **Precision over recall for anything that reaches the projector** — a missed detection is recoverable; a wrong verse on screen is not (R8).
6. **Offline-first, privacy-first** — the Bible and resolver are always local; cloud is additive and opt-in (R11, R12).
7. **Keep the docs honest** — track real "% of SRS implemented" so stakeholders aren't misled by the aspirational SRS (R14).

---

## 4. Go/no-go gates (tie risks to the timeline)

| Gate | Must be true | Guards |
|---|---|---|
| End Phase 0 | `electron-forge make` produces a runnable, correctly-routed app; `npm audit` reviewed | R1, R18 |
| End Phase 2 | Typed IPC + SQLite round-trip works; audience window drives display 2; CI runs unit+e2e | R2, R3, R4, R16 |
| End Phase 3 (MVP) | Build/present/persist a real service dual-screen; perf budgets met; Bible licensing cleared | R5, R13, R17 |
| End Phase 4 | AI accuracy/latency/false-positive bars met in both modes; privacy/kill-switch verified | R8, R9, R10, R11 |
| End Phase 5 | Signed, auto-updating v1.0.0; 8 h stability; backup/restore working | R5 |

No phase proceeds until its predecessor's gate is green.
