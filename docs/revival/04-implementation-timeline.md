# Deliverable 3 — Restructuring Blueprint & Implementation Timeline

**Date:** 2026-06-26
**Chosen path:** Option A+ — modernize Electron/Node, build the SRS on top, add Rust surgically ([03-nodejs-vs-rust.md](03-nodejs-vs-rust.md)).
**Assumption for sizing:** 1–2 developers. Durations are *engineering weeks*; scale by team size. Phases overlap only where noted.

---

## 1. Restructuring blueprint (target repo shape)

```
src/
  main/                    # Node main process — all privileged logic
    index.ts               # app bootstrap (was main.ts)
    windows/               # WindowManager: presenter + audience + stage
    ipc/                   # one module per domain; zod-validated handlers
    db/                    # better-sqlite3 connection, migrations/, repositories/
    services/              # ScriptureService, SongService, MediaService,
                           #   ServicePlanService, PresentationController,
                           #   BibleApiClient, AIScriptureDetector, SettingsService
    infra/                 # logger (electron-log), config, auto-update, errors
  preload/
    index.ts               # contextBridge → typed window.api (NOT empty)
    api.d.ts               # shared IPC type contract (imported by renderer)
  renderer/
    app/                   # App, router (HashRouter), providers
    features/
      scripture/ songs/ media/ planning/ presentation/ settings/
    components/ui/         # shadcn primitives (existing)
    store/                 # Redux = view/UI cache only
  shared/                  # types, schemas (zod), constants shared main<->renderer
  audience/                # audience-window React entry (projection output)
tests/  e2e/ (Playwright)  unit colocated *.test.ts (Vitest)
```

Deletions from current tree: `src/renderer.ts`, `src/pages/Home.tsx`, two of three sidebars, duplicate CSS (Audit D1–D4).

---

## 2. Phased roadmap

### Phase 0 — Stabilize & make it build (Week 1) 🔴 do first
> Goal: a clean, installable, *correctly packaged* baseline. No new features.

- `npm install`; run `npm audit`, fold results into the audit report.
- **Fix B1:** `BrowserRouter` → `HashRouter` (or `MemoryRouter`); verify routing survives `electron-forge make`.
- **Security S2–S4:** add CSP, guard DevTools behind `!app.isPackaged`, add `setWindowOpenHandler`/`will-navigate`.
- **S1:** set `contextIsolation/sandbox/nodeIntegration` explicitly.
- Delete dead code (D1–D4); consolidate CSS; pick one sidebar.
- Verify a packaged build launches and routes on Win/Linux (mac if available).
- **Exit:** `npm run make` produces a runnable app with working navigation. Tag `v0.1.0-baseline`.

### Phase 1 — Toolchain modernization (Weeks 2–3)
- TypeScript → 5.x; ESLint → 9 flat config + typescript-eslint 8; Prettier.
- Bump Vite, lucide, radix; plan (don't yet force) React 19.
- Add CI (GitHub Actions): install → `tsc --noEmit` → lint → unit tests → `make` smoke build on all 3 OSes.
- Add `electron-log`, a renderer error boundary, and main-process `render-process-gone` handling (B4).
- **Exit:** green CI, zero lint errors, modern TS, audit-clean deps.

### Phase 2 — Foundation skeleton (Weeks 4–8) ⭐ critical path
> Everything later hangs on this. (Audit §7.3 target architecture.)

- **Typed IPC**: `contextBridge` `window.api`, channel-per-domain, every payload `zod`-validated (S5).
- **SQLite**: `better-sqlite3` in main, connection + migrations runner + repository layer; seed schema for scripture/songs/media/plans/settings; demote Redux to view cache (B3).
- **WindowManager**: presenter window + **audience window on the secondary display** via Electron `screen`; live-state broadcast from main; black/blank/clear (B2).
- **Testing harness**: Vitest unit + Playwright-Electron e2e; first smoke e2e (launch, navigate, open audience window).
- **Config/secrets**: secure storage for Bible/AI API keys.
- **Exit:** a renderer action round-trips through preload → IPC → a service → SQLite → back; audience window mirrors a hard-coded slide on display 2; CI runs unit + e2e.

### Phase 3 — Core product domains (Weeks 9–22)
> SRS core, in dependency order. Each domain ships behind tests.

1. **Scripture (Weeks 9–13)** — *critical path & differentiator.* Bible schema + FTS5; `BibleApiClient` hydrates SQLite once → offline-first; search by reference, keyword, and **topic** (the EasyWorship differentiator); projection formatting + auto-split long passages; scripture → audience window. **Profiling gate:** if FTS5 is too slow/weak for topic+fuzzy+multi-translation, schedule the Rust search module (§4).
2. **Presentation engine (Weeks 12–17, overlaps)** — slide model, renderer, transitions (fade/cut/dissolve), presenter preview (current+next), live controls + keyboard shortcuts, black/blank.
3. **Songs (Weeks 16–19)** — schema, editor, import (plain text / OpenLyrics / CCLI), verse/chorus arrangement, projection.
4. **Media (Weeks 18–21)** — library, image/video/audio playback, backgrounds; lean on Chromium/FFmpeg.
5. **Service planning (Weeks 20–22)** — replace the static `servicesData` with real ordered, persisted plans of mixed elements; drag-drop; templates.
- **Exit:** an operator can build a real service (songs + scripture + media), present it dual-screen, and have it persist across restart. This is the **functional MVP** (SRS Phase 1).

### Phase 4 — AI auto-scripture detection (Weeks 23–30)
> Detailed design in [../plan/ai-scripture-detection-spec.md](../plan/ai-scripture-detection-spec.md). Depends on Phase 3 scripture domain.

- **23–25:** online mode — ASR/text intake → cloud model → reference resolve → operator-confirmed auto-queue.
- **26–28:** offline mode — local ASR (whisper.cpp) + local resolver; Rust/native inference module via sidecar or napi-rs.
- **29–30:** accuracy harness (precision/recall/latency), graceful online→offline degradation, settings & privacy controls.
- **Exit:** spoken/typed references auto-surface the right verse in both modes, above the accuracy bar in Deliverable 4 §6.

### Phase 5 — Hardening & release (Weeks 31–36)
- Auto-update channel; first-run wizard; backup/restore (SRS §3.8); perf pass (startup < 10 s, transitions ≥ 30 fps, 8 h stability — SRS §5); accessibility + keyboard coverage; signed installers (Win/mac/Linux); docs.
- **Exit:** signed, auto-updating `v1.0.0`.

---

## 3. Timeline summary

| Phase | Weeks | Outcome | Gate |
|---|---|---|---|
| 0 Stabilize | 1 | Correctly packaged baseline | `make` runs + routes |
| 1 Toolchain | 2–3 | Modern TS/lint/CI | Green CI |
| 2 Foundation | 4–8 | IPC + SQLite + dual-window + tests | Round-trip + audience window |
| 3 Domains | 9–22 | **Functional MVP** | Build & present a real service |
| 4 AI feature | 23–30 | Auto-scripture detection | Accuracy bar met |
| 5 Release | 31–36 | Signed v1.0.0 | Signed auto-updating build |

**~36 weeks (~8–9 months)** to v1.0 for 1–2 devs. MVP (end of Phase 3) at **~22 weeks**. Phases 0–2 (~8 weeks) are non-negotiable prerequisites for *any* feature work.

---

## 4. Rust insertion sub-plan (gated, reversible)

Only triggered by profiling (§ Phase 3.1 / Phase 4):

1. **Scripture search module** — if SQLite FTS5 underperforms on topic/fuzzy/multi-translation search: build a `napi-rs` Rust crate exposing `search(query) -> results`, called behind the existing `ScriptureService` IPC interface. No API change upstream. ~1–2 weeks.
2. **Offline AI inference** — wrap whisper.cpp (ASR) and/or an ONNX/llama.cpp resolver as a **sidecar binary** or napi-rs binding, behind `AIScriptureDetector`. ~2–3 weeks (most cost is the model pipeline, not the binding). See Deliverable 4.

Each is a self-contained library behind a stable interface — independently testable and removable, with **no platform migration**.

---

## 5. Conditional migration roadmap (only if Tauri is later chosen)

Not recommended ([03](03-nodejs-vs-rust.md)), but if a hard size/RAM constraint forces a Tauri move, do it **after** Phase 3 (so the React frontend is mature and portable) and **incrementally**:

1. Stand up a Tauri shell loading the *existing* React renderer unchanged.
2. Port main-process services to Rust **one IPC domain at a time** (settings → scripture → songs → media → presentation), keeping the same `window.api` contract so the renderer doesn't change.
3. Re-validate the **projection/video path on all three webviews** (the key risk) before porting the presentation domain.
4. Run Electron and Tauri builds in parallel until parity; cut over per-platform.
Estimated **+3–5 months** over staying on Electron, plus webview-parity risk — hence the recommendation to stay unless data demands otherwise.
