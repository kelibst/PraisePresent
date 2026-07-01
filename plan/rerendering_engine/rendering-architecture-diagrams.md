# Display-Rendering Engine — Architecture Diagrams

> Companion to [`plan/prompt.md`](../prompt.md). Produced from a first-hand read of the
> engine (not the brief's audit alone) on 2026-06-29. Two diagrams: **(1)** how slides
> are rendered today, **(2)** the proposed re-architecture for low-end hardware.

---

## What was verified in code (evidence, not assertion)

The hot path, traced end to end:

> operator key → `usePresentDeck` → `window.api.present.next()` →
> `ipcRenderer.invoke('present:next')` → `presentHandlers` (zod-validate) →
> `dispatchPresent()` → pure `reduce()` → **`broadcastState()` ships the *entire*
> `PresentState` (whole `deck` + index + mode + transition) to BOTH windows** on
> `present:state`.

| Brief audit point | Status | Evidence |
| --- | --- | --- |
| #1 Full-deck rebroadcast on every transport action | **Confirmed** | `broadcastState()` sends `liveState` whole — `windowManager.ts:149-155`, `168-171`. Only `index` changed. |
| #2 Transition change re-sends the whole deck | **Confirmed** | `setTransition` round-trips through `present.setDeck(live.deck, …)` — `usePresentDeck.ts:135-143`. |
| #3 Audience is same bundle, unmemoized | **Confirmed** | `onState` → `setState(wholeState)` reconciles the whole tree — `AudienceView.tsx:38`. No `React.memo` on the path. |
| #4 Transitions are NOT cross-fades | **Confirmed** | Single opacity layer toggles 0→1, incoming fades *from black* — `AudienceView.tsx:87-94`. `fade` ≡ `dissolve`. |
| #5 Media remounts on every render | **Confirmed** | `<img>/<video>` keyed inside the reconciled tree — `AudienceView.tsx:141-168`. A deck rewrite remounts media even when the URL is unchanged. |
| #6 No memo/virtualization on deck rail | **Confirmed** | `state.deck.map(...)` with no memo — `LiveCockpit.tsx:204`. |
| #7 zod re-validates large payloads on the hot path | **Confirmed** | `setDeckInput` re-parses the full deck array in `presentHandlers.ts:23`. |

### The gap the brief omits

**There is no "document" slide type at all.** `SlideMedia.kind` is only `image | video | audio`
(`present.ts:9`); backgrounds are `color | media` only. There is **no PDF/PPTX/DOCX render path
anywhere** (grep-confirmed). Every slide — scripture, song, AI candidate — collapses to one
`PresentSlide` shape and is painted by the same layered surface:

> **background layer → media layer → text lines → reference label**, over a radial-gradient surface.

So "how does a document slide get rendered?" — today it does not. That is a net-new render path to
decide on explicitly, not an existing path to optimize.

---

## Diagram 1 — Current rendering engine (as built)

```mermaid
flowchart TB
    subgraph SRC["Slide sources (all collapse to one PresentSlide shape)"]
        SCR["Scripture<br/>versesToDeck()<br/>1 verse = 1 slide, locked:true"]
        SONG["Songs / staged passages"]
        AICAND["AI candidate<br/>projectVerses()"]
    end

    subgraph REND_OP["RENDERER — Operator window (#/)"]
        UPD["usePresentDeck.ts<br/>staging + the ONE present.onState sub"]
        COCK["LiveCockpit.tsx<br/>deck rail .map() — no memo<br/>SlidePreview twins"]
    end

    SCR --> UPD
    SONG --> UPD
    AICAND --> UPD
    UPD -->|"present.setDeck / next / prev / goto<br/>setBackground / updateText / black"| BRIDGE

    subgraph PRELOAD["PRELOAD — contextBridge window.api.present"]
        BRIDGE["ipcRenderer.invoke(channel, payload)"]
    end

    BRIDGE -->|"present:* invoke"| HANDLERS

    subgraph MAIN["MAIN process — source of truth (§5.3)"]
        HANDLERS["presentHandlers.ts<br/>zod validate EVERY payload<br/>(full deck re-validated on setDeck)"]
        REDUCE["presentEngine.reduce()<br/>pure, clamps index, fails safe to black"]
        STATE["liveState: PresentState<br/>(whole deck held in memory)"]
        BCAST["broadcastState()<br/>**sends ENTIRE PresentState**<br/>to BOTH windows, every action"]
        HANDLERS --> REDUCE --> STATE --> BCAST
        MPROTO["mediaProtocol.ts<br/>app-media://media/&lt;id&gt;<br/>→ mediaRepository.getPath(id)<br/>→ net.fetch(file URL), range OK"]
    end

    BCAST -->|"present:state (full state push)"| UPD
    BCAST -->|"present:state (full state push)"| AUD

    subgraph REND_AUD["RENDERER — Audience window (#/audience) — SAME bundle"]
        AUD["AudienceView.tsx<br/>setState(wholeState) → full tree reconcile<br/>NO React.memo"]
        LAYERS["Per-slide paint order (bottom→top):"]
        BG["① BackgroundLayer<br/>color = inline style · media = img/video"]
        MED["② MediaLayer<br/>img / video(autoplay,loop) / audio<br/>keyed in reconciled tree → REMOUNTS"]
        TXT["③ Text lines (vw units) + reference label"]
        FADE["Transition = single opacity 0→1 toggle<br/>fade-from-BLACK, NOT a cross-fade<br/>fade ≡ dissolve (identical)"]
        AUD --> LAYERS --> BG --> MED --> TXT --> FADE
    end

    MPROTO -.->|"streams bytes for<br/>app-media:// URLs"| MED
    MPROTO -.-> BG

    classDef hot fill:#7a2020,stroke:#ff6b6b,color:#fff;
    classDef gap fill:#5a4a00,stroke:#e0b000,color:#fff;
    class BCAST,HANDLERS,AUD,FADE,MED hot;
```

Red = confirmed throughput/latency hot spots. The `app-media://` protocol is the only "native-ish"
piece today; everything else is React-in-renderer.

---

## Diagram 2 — Proposed re-architecture

Spine = the brief's deck/cursor split, extended with the two pieces that actually move the needle on
15-year-old hardware: a **double-buffer cross-fade** and a **native media pre-scale-on-import
pipeline** (decode 4K once at import, never at show time). React is kept on the operator side; the
projector's React-vs-no-React choice is a **measured decision gate** (B0 → B5), not an assumption.

```mermaid
flowchart TB
    subgraph MAIN["MAIN — source of truth (unchanged authority, §5.3)"]
        REDUCE2["presentEngine.reduce()<br/>now also bumps **rev** on deck-changing actions"]
        DECK["deckState {rev, deck[]}<br/>changes RARELY"]
        CURSOR["cursorState {rev, index, mode, transition}<br/>changes on EVERY transport action"]
        REDUCE2 --> DECK
        REDUCE2 --> CURSOR

        subgraph BSPLIT["Split broadcast (O(cursor), not O(deck))"]
            BDECK["present:deck → full deck + rev<br/>ONLY on setDeck/setBackground/updateText"]
            BCUR["present:cursor → {rev,index,mode,transition}<br/>on next/prev/goto/black/blank/clear/setTransition<br/>(tiny, ~40 bytes)"]
        end
        DECK --> BDECK
        CURSOR --> BCUR

        subgraph NATIVE["Native media pipeline (decision-gated B6)"]
            IMPORT["On import: sharp / ffmpeg sidecar<br/>pre-scale image+video to projector res<br/>+ low-power codec → cache by hash"]
            MPROTO2["app-media:// serves PRE-SCALED asset<br/>projector never decodes oversized 4K"]
            IMPORT --> MPROTO2
        end
    end

    BDECK -->|"present:deck (rare)"| RECON
    BCUR -->|"present:cursor (hot, tiny)"| RECON

    subgraph PRELOAD2["PRELOAD — window.api.present (+ onDeck / onCursor)"]
        RECON["Client reconciler<br/>caches last deck by rev<br/>applies cursor deltas locally<br/>rev guards stale cursors<br/>re-exposes unified PresentState"]
    end

    RECON -->|"unified state (minimal change<br/>to existing consumers)"| OPVIEW
    RECON --> PROJ

    subgraph OP["RENDERER — Operator (React, kept)"]
        OPVIEW["usePresentDeck (view cache)<br/>LiveCockpit: memoized + virtualized rail (>100)"]
    end

    subgraph PROJBOX["Audience / Projector path"]
        GATE{"B0 profiling gate:<br/>is React the bottleneck<br/>on 8GB / iGPU?"}
        PROJ["GATE input"] --> GATE
        GATE -->|"No → keep React"| RAUD["AudienceView<br/>React.memo all layers"]
        GATE -->|"Yes → B5"| MINI["Dedicated minimal projector bundle<br/>separate HTML, vanilla/imperative DOM<br/>no Redux, no app shell"]

        subgraph DBUF["Double-buffer cross-fade (B2) — both variants"]
            LA["Layer A (outgoing)"]
            LB["Layer B (incoming, mounts hidden)"]
            XF["opacity cross-fade A↔B<br/>true dissolve, fade ≠ dissolve<br/>cut = 0ms, GPU-composited"]
            LA --> XF
            LB --> XF
        end
        RAUD --> DBUF
        MINI --> DBUF

        STAB["Media stability (B3):<br/>key &lt;video&gt;/&lt;img&gt; by url+slide-id<br/>cursor-only move = NO remount"]
        DBUF --> STAB
    end

    MPROTO2 -.->|"pre-scaled bytes"| STAB

    subgraph HARNESS["B0 — Profiling harness (deliverable, gates B5/B6)"]
        METRICS["Throttled low-end emulation<br/>CPU 6x · 8GB cap · software GL<br/>Metrics: input→photon latency,<br/>transition fps, peak RSS · before/after"]
    end
    METRICS -.->|"evidence drives"| GATE

    classDef new fill:#1f5e3a,stroke:#4ade80,color:#fff;
    classDef gate fill:#5a4a00,stroke:#e0b000,color:#fff;
    class BDECK,BCUR,RECON,DBUF,STAB,NATIVE,METRICS new;
    class GATE gate;
```

---

## Mapping to the candidate task outline (`prompt.md` §5)

| Diagram 2 node | Task | Notes |
| --- | --- | --- |
| Throttled emulation + metrics | **B0** | Do first — every later decision is gated on these numbers. |
| `present:deck` / `present:cursor` split + reconciler (green) | **B1** | Security review required (§7 — IPC/main/preload). `rev` guards stale cursors. |
| Double-buffer cross-fade (DBUF) | **B2** | True `fade` ≠ `dissolve`; fail-safe-to-black preserved. |
| Media stability (STAB) | **B3** | Key media by url+slide-id; no `<video>` remount on cursor moves. |
| Memoized/virtualized rail (OPVIEW) | **B4** | Coordinate with the `ux1` right-pane workstream — it may already restructure the rail. |
| Decision gate → minimal projector bundle (MINI) | **B5** | Only if B0 shows React is the bottleneck. |
| Adaptive media pipeline (NATIVE) | **B6** | sharp/ffmpeg on import; likely the single biggest low-end win. Now also covers **ingest guard rails** + **per-machine rendition selection** (see below). Expands the §0 Rust-scope — propose explicitly. |
| Capability probe → tier (CAPS) | **B6a** | Startup probe (GPU/RAM/HW-decode/benchmark) + operator override; drives rendition + effect tier and informs the B5 React gate. |
| Reducer/reconciler/transition tests + e2e | **C** | Keep every existing test green throughout. |

---

## Adaptive media pipeline + ingest guard rails (B6 detail)

Two requirements drove this out of the simple "pre-scale on import" sketch: **(a)** a huge
file on a weak machine must never crash the service, and **(b)** capable machines must not be
punished by being clamped to the lowest common denominator. Full diagram:
[`media-pipeline.mermaid`](media-pipeline.mermaid).

### (a) Huge-file guard rails — *file size never equals a crash*

The crash vector is loading a whole file into memory; we never do. Both the existing
playback path and the new import path are streamed:

- **Playback already streams.** `app-media://` uses `net.fetch` on a file URL with **range
  requests** ([mediaProtocol.ts:33](../../src/main/windows/mediaProtocol.ts#L33)) — Chromium
  buffers seconds, not the whole file. A large video *playing* is decode-bound, not RAM-bound.
- **Import streams.** ffmpeg/sharp read progressively; RAM is bounded by codec buffers, not
  file size. So the real costs of a 30 GB file are **time, CPU, disk** — guarded by:
  1. **Out-of-process sidecar**, mem/thread-capped, with **watchdog + timeout + cancel**;
     crash-isolated so a transcode failure can never take down the live app (§5.7).
  2. **Pre-flight checks** on import: size, duration, **free disk**. Large → warn + background
     optimize; beyond an absurd (configurable) ceiling → friendly refusal, never a freeze.
  3. **Serialized optimize queue** (1–2 concurrent) so bulk import can't thrash a 4 GB box.
  4. **LRU eviction to a disk budget** on the rendition cache — never fills a small SSD.
  5. **Fallback**: if optimization can't run (no disk / odd codec / cancelled), stream the
     **original**, GPU-downscaled. Degraded but alive, still fail-safe-to-black on real error.

### (b) Adaptive selection — *adapt, don't punish; clamp to the projector*

- **Projector resolution is the ceiling, and reaching it is free.** You cannot display more
  pixels than the projector has; downscaling a 4K source to a 1080p projector is visually
  lossless and cheaper for everyone. We clamp **to** the projector, never below it, never
  upscale.
- **Keep the original; renditions are an additive cache** (a small ladder: projector-native
  high-quality + a low-power light rendition), keyed by resolution+codec.
- **Capability probe at startup** (GPU, RAM, hardware-decode support, a quick benchmark; with
  a **manual operator override** — auto-detect can be wrong) assigns a **tier**. Show-time
  rendition = `f(tier, projector res, source)`: strong box + 4K projector → high rendition +
  full GPU cross-fades; 15-year-old box → light rendition + conservative transitions. The tier
  also drives frame-rate cap and the HW-accel-on/off Chromium flag — which is exactly why B0
  **measures** (some old GPUs are faster in software).

> **Slogan for the memo:** *Adapt, don't punish. Clamp to the projector, never to the weakest
> machine. A giant file may be slow to optimize, but it can never crash the service.*

### Recommendation

Stand up **B0 first** so the architecture is chosen on measured evidence (CPU 6× / 8 GB / software
GL), then proceed B1 → B2 → B3 in order. B5/B6 are decision-gated on B0. Treat the **document/PDF
render path** as a separate explicit decision (own task or formally out of scope) — it is not an
optimization of an existing path.
