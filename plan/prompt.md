# Handoff brief — Display-Rendering Engine: re-architecture for low-end hardware

> **You are the PM for this work** (CLAUDE.md §2). Read CLAUDE.md in full first, then this brief.
> This is a **separate workstream** from the in-flight Present-screen layout fidelity work
> (see `tasks/active/2026-06-29_ux*.md`). Those touch `LiveCockpit`/`PresentPage` chrome and
> the shell; **your** workstream owns the *presentation rendering engine* — the IPC state
> transport and the audience/projector render path. Coordinate on `LiveCockpit.tsx` if you
> touch the deck rail, but the audience path (`AudienceView.tsx`), `windowManager` broadcast,
> and the `present:*` channel shapes are yours.

---

## 0. The goal (what "done" looks like)

PraisePresent is run live in churches on **whatever hardware they own — frequently 10–15-year-old
machines with ~8 GB RAM, weak/integrated GPUs, spinning disks, and a single dual-head output**.
The audience/projector path must stay buttery (≥60 fps transitions, instant slide advance, no
jank when an operator mashes the spacebar) **on that hardware**, while never violating the
fail-safe rules (§5.7 — projector fails to black, never a stack trace).

Your mandate, in order:

1. **Understand the current rendering engine deeply and first-hand.** Do not trust this brief's
   audit blindly — re-read the code, run the app, and profile it. Confirm or refute every
   inefficiency listed in §2 with your own evidence.
2. **Decide whether the current React-in-Electron-renderer approach is the right tool** for the
   audience path on low-end hardware, or whether a different rendering technology would be
   materially faster (see §4 — the tooling question). Make a **recommendation with evidence**,
   not a guess.
3. **Re-architect the state transport** so transport actions (next/prev/goto/black) are O(cursor),
   not O(whole deck) — see §3 for the leading hypothesis.
4. **Produce CAMS tasks** (§4 of CLAUDE.md) for the chosen approach, get them reviewed, and only
   then implement. **Prioritize not breaking features** — every existing e2e/unit test must stay
   green; the locked-slide, fail-safe-to-black, and CSP/sandbox guarantees are non-negotiable.

A profiling/measurement harness on representative low-end specs (or a throttled emulation:
CPU 6× slowdown, 8 GB cap, software GL) is part of the deliverable — **decisions must be
measured, not asserted.** Pick a target metric up front (e.g. slide-advance input-to-photon
latency, transition frame rate, peak RSS) and report before/after.

---

## 1. Where the engine lives (entry points)

- **Source of truth:** `src/main/windows/windowManager.ts` — `liveState` (line 27), `dispatchPresent()`
  (line 168), `broadcastState()` (lines 149–155). Main owns state (§5.3).
- **Reducer:** `src/main/services/presentEngine.ts` (+ `presentEngine.test.ts`).
- **IPC handlers:** `src/main/ipc/presentHandlers.ts`.
- **Channel registry:** `src/shared/constants/channels.ts` — the `present:*` block (lines 14–26).
- **State schema:** `src/shared/schemas/present.ts` — `presentState` (lines 98–103), `presentSlide`
  (lines 75–85), `FAILSAFE` (lines 152–157).
- **Preload bridge:** `src/preload/index.ts` + `src/preload/api.d.ts` (the `present` surface).
- **Audience/projector render:** `src/renderer/features/presentation/AudienceView.tsx`
  (separate `#/audience` route in the SAME renderer bundle; router at `src/renderer/app/router.tsx`).
- **Operator preview/cockpit:** `src/renderer/features/present/LiveCockpit.tsx`,
  `usePresentDeck.ts` (the single `present.onState` subscription).
- **Media protocol:** slides reference `app-media://media/<id>` URLs served by a main-process
  protocol handler (find it under `src/main/**`).

## 2. Audit of current inefficiencies (verify these yourself)

1. **Full-deck rebroadcast on every transport action.** `dispatchPresent()` → `broadcastState()`
   ships the *entire* `PresentState` (whole `deck` array) to BOTH windows on every
   `next/prev/goto/black/blank/clear` (`windowManager.ts:149–171`). Only `index` changed. A
   200-verse passage re-sends ~30 KB/keystroke ×2 windows.
2. **Transition change re-sends the whole deck.** `setTransition` calls
   `present.setDeck(live.deck, …)` (`usePresentDeck.ts:135–142`) → full re-validation + broadcast.
3. **Audience is the same renderer bundle, unmemoized.** `onState` → `setState` reconciles the
   whole React tree on every push (`AudienceView.tsx:38`). No `React.memo` anywhere on the path.
4. **Transitions are NOT true cross-fades.** A single opacity layer toggles 0→1
   (`AudienceView.tsx:87–92`): the outgoing slide is replaced instantly and the incoming one
   fades *from black*. `fade` and `dissolve` render identically.
5. **Media remounts/restarts on every render.** `<img>/<video>` live in the reconciled tree
   (`AudienceView.tsx:141–168`) and restart even on an index-only push. Video stutters on rapid
   navigation.
6. **No memoization/virtualization on the deck rail** (`LiveCockpit.tsx:136`).
7. **zod re-validates large payloads on the hot path** for `setDeck` (long services = measurable
   in main).

None of these are correctness bugs — fail-safe-to-black and locked-slide protection are intact.
They are throughput/latency issues that bite hardest on weak hardware.

## 3. Leading re-architecture hypothesis (validate, don't assume)

**Separate the rarely-changing deck from the frequently-changing cursor:**

- New channels: `present:deck` (full deck + a `rev` revision id — sent only on
  setDeck/setBackground/updateText) and `present:cursor` (`{ rev, index, mode, transition }` —
  sent on next/prev/goto/black/blank/clear/setTransition). Keep `present:get-state` for mount.
- A small client reconciler caches the last deck and applies cursor deltas locally, re-exposing a
  unified `PresentState` so `usePresentDeck`/`AudienceView` change minimally. `rev` guards ordering
  (a cursor for a superseded deck is ignored).
- **Double-buffer cross-fade** in the audience: two slide layers (A/B), incoming mounts hidden then
  opacity cross-fades — a true dissolve, no fade-from-black, and `fade` ≠ `dissolve`.
- **Media stability:** key media by url/slide-id and `React.memo` layers so an index-only cursor
  never remounts `<video>`.
- Memoize deck-rail thumbnails; virtualize only past ~100 slides.

This is the *minimum* shape. Your job is to decide if it's sufficient on 8 GB / 15-year-old
hardware, or whether the render technology itself should change (next section).

## 4. The tooling question (the core of this brief)

**Investigate whether a different rendering/computation technology would be materially faster on
low-end hardware**, and recommend with measured evidence. Concretely evaluate at least:

- **React vs no-React on the projector.** Would a dedicated, minimal audience entry (separate HTML
  bundle, vanilla DOM or a tiny imperative renderer, no app shell, no Redux) cut memory + reconcile
  cost? Quantify bundle size, RSS, and transition jank vs today.
- **Compositor strategy.** Are transitions truly GPU-composited on integrated GPUs? Check whether
  `will-change`/opacity layers actually promote, or whether software compositing is the bottleneck.
  Evaluate `OffscreenCanvas`, WebGL/`<canvas>` slide compositing, or CSS-only, on weak GPUs.
- **Electron/Chromium flags.** Hardware acceleration on/off trade-offs on old GPUs (some 15-year-old
  GPUs are *faster* with `--disable-gpu` software paths — measure both). `paintWorklet`, frame rate
  caps, `backgroundThrottling`.
- **Rust / native (napi-rs or sidecar).** Is any hot work worth moving out of JS? Likely candidates:
  scripture/search indexing, deck building for huge passages, image decode/resize/pre-scaling of
  backgrounds to the projector resolution, video transcoding/pre-buffering. **Be skeptical** — the
  render path itself is DOM/compositor-bound, so Rust helps data prep, not pixel push. CLAUDE.md §0
  scopes Rust to "search + offline AI only" — propose any expansion explicitly with rationale.
- **Python.** Almost certainly NOT on the live path (startup cost, packaging). Only consider for
  offline/batch tooling (e.g. a build-time asset optimizer). Default: no.
- **Media pipeline.** Pre-scale/transcode backgrounds & media to the exact projector resolution and
  a low-power codec on import, so the projector never decodes oversized 4K assets at show time. This
  is likely the single biggest low-end win and may be a native/ffmpeg job.

Deliver a short **decision memo** (tool → measured impact → recommendation → risk) before writing
tasks. Do not rewrite in Rust/Python "because performance" — only where a measurement justifies it
and the §0/§5 rules permit.

## 5. Candidate task outline (refine after your investigation)

- **B0** Profiling harness + low-end emulation baseline; pick + record target metrics.
- **B1** Deck/cursor channel split + client reconciler (channels, schemas w/ `rev`, windowManager
  broadcast split, presentHandlers, preload, api.d.ts). **Security review required** (§7 — IPC/main/preload).
- **B2** Double-buffer cross-fade in AudienceView (true fade vs dissolve; fail-safe preserved).
- **B3** Media stability + layer memoization (no `<video>` remount on cursor moves).
- **B4** Deck-rail/preview memoization (coordinate with `ux1` right-pane work; it may already
  restructure the rail).
- **B5** (decision-gated) Dedicated minimal projector bundle, IF B0 shows React is the bottleneck.
- **B6** (decision-gated) Native media pre-scaling/transcode-on-import pipeline.
- **C** Unit tests (reducer + reconciler + transition selection) and e2e updates
  (`tests/e2e/scripture.spec.ts`, `tests/e2e/ai-detect.spec.ts`) — keep them green throughout.

## 6. Hard constraints (do not regress)

- §1.2 HashRouter only; §1.3 no privileged power in renderer; §1.4 contextIsolation/sandbox/CSP;
  §5.3 main is the source of truth and re-clamps; §5.7 projector fails safe to BLACK, locked
  (scripture) slides never editable from a crafted IPC payload.
- Every existing test stays green. New logic ships with unit tests; the audience flow ships with an
  e2e check (§5.8). B1's IPC/preload/main diff needs a `security` sign-off (§7).

## 7. Reference material already gathered

- Design mockup (source of truth for any UI you touch): `PraisePresent.dc.html` at repo root.
- Layout-fidelity workstream (sibling, do not duplicate): `tasks/active/2026-06-29_ux*.md`.
- This brief's audit was produced 2026-06-29 by the layout PM from a first-hand read of the files
  in §1. Treat it as a starting map, not gospel — re-measure.
