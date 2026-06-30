# Deliverable 2 — Node.js Modernization vs. Rust Rewrite

**Date:** 2026-06-26
**Question posed by the brief:** retain & modernize the existing Node.js/Electron codebase, or perform a full rewrite in Rust for performance?

---

## 1. Framing — what is actually on the table

A "rewrite" presumes there is a substantial working system to replace. There isn't (see [01-codebase-audit.md](01-codebase-audit.md) §1): **~1,031 LOC, ~90% of it unmodified template, < 5% of the SRS built.** So the real question is **"what do we build the foundation in?"**, and there are three credible answers — plus the recommended hybrid:

| Option | What it means here |
|---|---|
| **A. Modernize on Electron/Node** | Keep Electron + React + the current stack; modernize toolchain; build the SRS on top. JS/TS everywhere. |
| **B. Migrate to Tauri (Rust core + system webview)** | The realistic "Rust rewrite": Rust replaces the Node main process; the **React frontend is largely reused** inside the OS webview. |
| **C. Full native Rust GUI** | Rewrite UI *and* core in Rust (egui / iced / Slint). Throws away React entirely. |
| **A+ (recommended)** | Option A, with **Rust introduced surgically** (napi-rs native module or sidecar) for the two hot paths that profile-justify it: Bible full-text search and offline AI inference. |

**Why Rust cannot replace the rendering layer.** PraisePresent is a graphics- and media-heavy app: rich-text slides, video backgrounds, GPU-composited transitions at 30–60 fps, multi-display output. That work is done by **Chromium's compositor**, not by JavaScript. "Rewrite in Rust for performance" misidentifies the bottleneck — the heavy lifting is already native (Chromium/Skia/FFmpeg), and JS is only orchestrating. Rust helps for *CPU-bound logic* (search, parsing, inference), not for *compositing video on a projector*.

---

## 2. Option-by-option analysis

### Option A — Modernize on Electron/Node ✅ recommended base

**Do:** TS 5, ESLint 9 flat, fix the router/security defects, add typed IPC, SQLite (`better-sqlite3`), Vitest/Playwright, CI, `electron-log`, auto-update; then build domains.

| | |
|---|---|
| 👍 Pros | Reuses 100% of the (small but correct) investment; richest ecosystem for *exactly this* domain (presentation, media, multi-window) — Chromium gives pixel-perfect, consistent rendering and rock-solid video across Win/mac/Linux; fastest path to a shippable MVP; one language across main+renderer; huge hiring pool; mature packaging/updates via electron-forge. |
| 👎 Cons | Larger binaries (~85–150 MB) and higher idle RAM (~120–250 MB) than native; ships a Chromium runtime; CPU-bound work (FTS over a full Bible, on-device AI) is slower in pure JS. |
| Risk | **Low.** Well-trodden path; the defects found are routine. |

### Option B — Migrate to Tauri (Rust core, reuse React)

| | |
|---|---|
| 👍 Pros | Much smaller binaries (~3–10 MB) and lower idle RAM; Rust core is genuinely faster for search/parsing/inference; strong security model; **frontend React code mostly portable**, so it's the *least bad* "Rust" route. |
| 👎 Cons | **Rendering moves to the OS webview** (WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux) — three different engines with different bugs, codec support, and rendering quirks. For an app whose whole job is reliable, identical projection output and smooth video on any church PC, that inconsistency is a **product-level risk**, not a detail. Multi-window + secondary-display + video-background workflows are exactly where webview gaps show. Media/codec story weaker than Chromium. Team must learn Rust. Migration cost is real even on a small codebase because the *infrastructure* (IPC, windowing, packaging) is rewritten. |
| Risk | **Medium-high** *for this product specifically*, driven by webview rendering/codec inconsistency on the projector output path. |

### Option C — Full native Rust GUI (egui / iced / Slint)

| | |
|---|---|
| 👍 Pros | Smallest, fastest, lowest-memory; no web runtime. |
| 👎 Cons | **Disqualifying for this product.** Discards the entire React/shadcn/Tailwind UI investment; immature rich-text, HTML-layout, video, and transition story; tiny ecosystem for presentation/media; far longer build time; the perf it buys solves a problem this app doesn't have (the bottleneck is GPU compositing + media, already native). |
| Risk | **High.** Highest cost, highest schedule risk, worst ecosystem fit. **Not recommended.** |

---

## 3. Cost–benefit comparison

Scores 1–5 (5 = best). "Time-to-MVP" assumes building the SRS core (scripture + presentation + songs/media + planning).

| Dimension | A. Modernize Electron | B. Tauri (Rust core) | C. Full Rust GUI | **A+ Hybrid (rec.)** |
|---|---|---|---|---|
| Reuse of existing work | 5 | 3 | 1 | 5 |
| Time-to-MVP | 5 (baseline) | 2 (+3–5 mo infra) | 1 (+6–10 mo) | 5 |
| Migration complexity | 5 (none) | 2 | 1 | 4 (small native module) |
| Runtime performance (CPU logic) | 3 | 4 | 5 | **4** (Rust where it counts) |
| Rendering/media reliability on projector | **5** | 2 | 3 | **5** |
| Binary size / memory | 2 | 4 | 5 | 2–3 |
| Ecosystem fit (presentation/media) | 5 | 3 | 1 | 5 |
| Long-term maintainability | 4 | 4 | 3 | 4 |
| Hiring pool | 5 | 3 | 2 | 4 |
| Team ramp-up risk | 5 | 2 | 1 | 4 |
| **Weighted fit for PraisePresent** | **High** | Medium | Low | **Highest** |

### Rough effort/perf deltas

- **A → working MVP:** baseline. **B instead of A:** add **~3–5 months** to rebuild IPC/windowing/packaging in Rust + Tauri and re-validate projection/video on three webviews. **C:** add **~6–10 months** and accept ecosystem risk.
- **Performance reality:** the only measured-to-matter hot paths are (1) full-Bible keyword/topic/fuzzy search and (2) on-device AI inference. SQLite **FTS5** in Option A already makes (1) sub-100 ms for a single Bible — likely *fast enough* without any Rust. (2) is dominated by the model runtime (whisper.cpp / llama.cpp / ONNX Runtime), which is **native C++/Rust regardless of host** — Electron calls into it just as well as Tauri. So Rust's perf advantage over a well-built Option A is **marginal for this product**, and concentrated in two isolatable spots.

---

## 4. Recommendation

> **Adopt Option A+ : retain and modernize the Electron/Node/React stack, and introduce Rust *surgically* only where profiling proves it pays — Bible full-text/fuzzy search and offline AI inference — via a `napi-rs` native module or a sidecar binary. Do *not* migrate to Tauri and do *not* attempt a full Rust GUI.**

Rationale:
1. **There is nothing to "rewrite."** The cost of B/C is paid up front, the benefit (perf) is marginal and addressable without them, and the risk (webview rendering on the projector path) attacks the product's core promise.
2. **The bottleneck isn't JavaScript** — it's GPU compositing + media (already native in Chromium) and model inference (native in any host). Electron loses nothing here.
3. **Rust still has a home** — but as a *library called from Electron*, not as a platform swap. This captures ~all of Rust's real upside (fast search, fast inference, memory-safe parsing) at ~none of the platform risk.
4. **Re-evaluation trigger:** revisit Tauri only if a hard *product* constraint emerges — e.g. binary size/RAM becomes a deal-breaker for target hardware, or webview parity improves to the point projection reliability is no longer a concern. Make it a data-driven decision, not a rewrite-for-its-own-sake.

---

## 5. Chosen path: Node.js modernization strategy (Option A+)

Because the recommendation is **retain**, here is the modernization strategy the brief asks for in that branch (detailed schedule in [04-implementation-timeline.md](04-implementation-timeline.md)):

**5.1 Toolchain & hygiene**
- TypeScript `~4.5.4` → **5.x**; enable `verbatimModuleSyntax`, `moduleResolution: bundler`.
- ESLint 8 + legacy `.eslintrc.json` → **ESLint 9 flat config** + `typescript-eslint` 8; add `eslint-plugin-react-hooks`, electron-security lint rules.
- Bump React (plan 19), Vite (6/7), lucide, radix; pin with `npm audit` clean.
- Delete dead code (`renderer.ts`, `pages/Home.tsx`, 2 sidebars), consolidate CSS. (Audit D1–D4.)
- Add Prettier + a pre-commit hook; add `tsc --noEmit` + lint to CI.

**5.2 Security hardening (Audit S1–S4)**
- Explicit `contextIsolation/sandbox/nodeIntegration`; strict CSP; guard DevTools behind dev; add `setWindowOpenHandler` + `will-navigate` allow-list.

**5.3 Foundation (the missing skeleton)**
- **Typed IPC** via `contextBridge` + `zod`-validated channels (replaces empty preload).
- **SQLite** (`better-sqlite3`) in main + migrations + repository layer; Redux demoted to view-cache.
- **WindowManager** with presenter + audience windows (fixes Audit B1/B2: `HashRouter`, second display).
- **Testing**: Vitest (unit) + Playwright-Electron (e2e) + CI; **`electron-log`** + error boundaries; **auto-update** channel.

**5.4 Best-practice refactors**
- Feature-sliced renderer (`src/features/*`); domain services in main; Result/error types on IPC; configuration & secrets handling for API keys (Bible/AI).

**5.5 Where Rust enters (later, gated)**
- After the scripture domain exists and is profiled: if FTS5 is insufficient for topic/fuzzy/multi-translation search, add a `napi-rs` search module. For offline AI, wrap whisper.cpp/ONNX via a sidecar or native binding (Deliverable 4). Each insertion is a self-contained module behind an existing IPC interface — reversible, testable, no platform change.
