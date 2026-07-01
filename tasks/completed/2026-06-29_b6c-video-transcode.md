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

## Tool decision (2026-06-29)
Used **ffmpeg-static** (pre-built per-platform ffmpeg binary via npm) — can't assume a
system ffmpeg on a church PC. Externalized in vite (its path is computed from __dirname,
so bundling would break it); the binary ships OUTSIDE the asar via forge extraResource and
is resolved at runtime from process.resourcesPath when packaged, lazily required in dev.

## Acceptance criteria
- [x] Sidecar is crash-isolated (child process), serialized (concurrency 1), watchdog
      timeout (SIGKILL) + cancelAllTranscodes on quit.
- [x] Pre-flight (shouldTranscodeVideo) + serialized queue; ffmpeg streams so RAM is
      independent of file size; a huge file is at most one slow background job.
- [x] Fallback to the original on ANY failure (no binary / spawn error / non-zero exit /
      timeout) — partial output cleaned up, rendition never set; fail-safe black on error.
- [x] e2e transcodes a real 4K clip and verifies the protocol serves a downscaled
      rendition (media-transcode.spec.ts). Packaging copies the binary via extraResource.
- [x] security + packaging sign-off (§7).

## Outcome
Out-of-process ffmpeg transcode (ffmpeg-static), background + non-blocking, serialized
queue (concurrency 1) with a 15-min SIGKILL watchdog and quit-cancel; fully error-isolated
(any failure → serve original). Pure arg/guard logic split for unit testing; integration
e2e transcodes a real 4K clip and verifies the protocol serves a downscaled rendition.
257 unit + 23 e2e green; tsc + lint clean; package bundles the binary via extraResource.
**Reviews:** security SIGNED OFF (clear yes on injection-safe spawn-array + child-process
isolation; no primitive weakened) + correctness SIGNED OFF (race analysis clean, no blocking
findings). Non-blocking follow-ups: free-disk pre-flight guard; CI-locked binary provenance.
**OWNER FLAGS:** (1) packaged macOS/Windows ffmpeg binary + path needs verification on those
targets; (2) ffmpeg-static is a **GPL-3.0** build — bundling it has distribution/licensing
implications; consider an LGPL build or making ffmpeg optional before release.

## Still needs the owner (packaging verification — code is done, cross-platform build is not)
- The e2e exercises the DEV ffmpeg path (require('ffmpeg-static')). The PACKAGED resolution
  (process.resourcesPath/ffmpeg[.exe]) builds on linux here but the macOS/Windows packaged
  binary + path must be verified on those targets before release.
- The B6b advisory (decode isolation) is now satisfied for VIDEO: transcode runs in a child
  process. Images (jimp) still decode in-process — a megapixel guard remains a future image
  hardening, separate from this.

## Outcome (filled on completion)
