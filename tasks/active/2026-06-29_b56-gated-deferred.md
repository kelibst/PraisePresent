# B5/B6 — decision-gated (deferred pending B0 hardware numbers)
- **ID:** 2026-06-29_b56-gated-deferred
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** (TBD — implementer + security)
- **Status:** blocked (gated on B0 real-hardware measurement)

## Goal
Hold B5 (dedicated minimal projector bundle) and B6 (native media pre-scale/transcode
pipeline) until B0 produces measured evidence on actual 8GB/iGPU hardware. The brief is
explicit: these are decision-gated and "decisions must be measured, not asserted"
(prompt.md §0,§4,§5). B6 also EXPANDS CLAUDE.md §0's native scope ("Rust scoped to search
+ offline AI only") to media optimization — that expansion needs explicit owner approval
with rationale, not a silent slide-in.

## Why deferred (PM decision, 2026-06-29)
- B1–B4 already remove the confirmed throughput hot spots (full-deck rebroadcast, fake
  fade, media remount, rail churn) with zero new native deps and all tests green.
- B5 (drop React on the projector) only pays off if B0 shows React reconcile/RSS is the
  bottleneck on real low-end hardware. Building it blind risks a second render path to
  maintain for no measured gain.
- B6 adds ffmpeg/sharp (heavy native deps + packaging surface + a transcode sidecar) and
  is the design's biggest moving part (ingest guard rails + adaptive rendition ladder +
  capability tiers — see plan/rerendering_engine/media-pipeline.mermaid). It must be
  measured-justified and scope-approved first.

## Acceptance criteria (to UNBLOCK)
- [ ] B0 numbers captured on a representative low-end box (RSS, transition fps,
      input→photon latency) with B1–B4 in place.
- [ ] Owner sign-off on expanding the native scope for media optimization (§0).
- [ ] Then: split into real B5 / B6 implementation tasks with security review (§7).

## Outcome (filled on completion)
Deferred. Full design captured in plan/rerendering_engine/ (rendering-architecture-
diagrams.md §"Adaptive media pipeline" + media-pipeline.mermaid).
