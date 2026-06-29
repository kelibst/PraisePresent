# Video transcode-on-import (out-of-process sidecar) + huge-file guard rails
- **ID:** 2026-06-29_b6c-video-transcode
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer (security + packaging review REQUIRED, §7)
- **Status:** pending (after B6b; heaviest slice)

## Goal
Transcode oversized/4K video to the projector resolution + a low-power codec on import,
in an OUT-OF-PROCESS ffmpeg sidecar with a watchdog/timeout/cancel, so the projector
never decodes oversized video live. Reuses the B6a tier + B6b rendition-ladder/cache
machinery. This is the heaviest piece (native binary + packaging surface) and the one
most in need of measured justification + a real low-end device — keep it last.

## Scope (files/areas)
- ffmpeg sidecar — bundle/locate a per-platform binary; forge packaging (extraResource)
- src/main/services/transcodeSidecar.ts — spawn/watchdog/timeout/cancel; serialized queue
- src/main/services/mediaPipeline.ts — extend the rendition ladder to video
- streaming everywhere — ffmpeg reads frame-by-frame; `app-media://` already range-streams
  playback (mediaProtocol.ts) so RAM use is independent of file size
- guard rails — pre-flight size/duration/free-disk; serialized 1–2 concurrent; fallback to
  streaming the ORIGINAL (GPU-downscaled) when transcode can't run

## Rules that apply
- CLAUDE.md §0 (native scope — APPROVED), §1.3, §5.7 (fail safe; sidecar crash-isolated),
  §5.8 (tests), §7 (security + packaging). plan/rerendering_engine/media-pipeline.mermaid.

## Notes / gating
- DECISION-GATED on B0 real-hardware numbers AND a measured win for video specifically.
  "A giant file may be slow to optimize, but it can never crash the service" — prove the
  guard rails on a real 8GB/iGPU box before shipping.

## Acceptance criteria
- [ ] Sidecar is crash-isolated, mem/thread-capped, watchdog + timeout + cancel.
- [ ] Pre-flight + serialized queue; huge file never crashes (RAM independent of size).
- [ ] Fallback to streamed original on any transcode failure; fail-safe black on error.
- [ ] Packaging ships the binary per-platform; e2e + a transcode integration test green.
- [ ] security + packaging sign-off (§7).

## Outcome (filled on completion)
