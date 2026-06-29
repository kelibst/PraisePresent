# Image pre-scaling on import + tier-aware rendition serving
- **ID:** 2026-06-29_b6b-image-prescale
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer (security review REQUIRED — native dep + protocol, §7)
- **Status:** pending (next slice after B6a)

## Goal
On media import, pre-scale oversized images to the projector resolution (keep the
ORIGINAL untouched) and cache renditions by content hash. At show time, the
`app-media://` protocol serves the rendition appropriate to the machine's tier (B6a),
so a weak projector never decodes a 4K image live. This is the headline low-end win for
images; video is B6c. Ingest guard rails: pre-flight size/free-disk checks, a
configurable absurd-size refusal, an LRU disk budget on the rendition cache.

## Scope (files/areas)
- package.json — add `sharp` (native; verify electron-forge unpack/rebuild like better-sqlite3)
- forge.config.ts — ensure the native module is unpacked/rebuilt for packaging
- src/main/services/mediaPipeline.ts (+ test) — pure rendition-decision logic (which size,
  should-optimize, pick-by-tier) separated from the sharp I/O for unit testing
- src/main/services/mediaService.ts — hook pre-scaling into the import flow
- src/main/db/repositories/mediaRepository.ts — store rendition paths (migration)
- src/main/windows/mediaProtocol.ts — serve the tier-appropriate rendition (still allow-list by id)
- projector resolution source — from the audience display bounds (windowManager/displayService)

## Rules that apply
- CLAUDE.md §0 (native scope expansion — APPROVED by owner 2026-06-29), §1.3 (allow-list
  protocol; no path from URL), §5.5 (migrations forward-only), §5.7 (fail safe to black on a
  missing rendition), §5.8 (tests). plan/rerendering_engine/media-pipeline.mermaid.

## Acceptance criteria
- [ ] Pure rendition-decision logic unit-tested (no native I/O in the unit tests).
- [ ] Original preserved; renditions cached by hash; LRU disk-budget eviction.
- [ ] Pre-flight size/disk guard rails; friendly refusal above a configurable ceiling.
- [ ] Protocol serves the tier-appropriate rendition; missing rendition → original →
      fail-safe black, never a crash.
- [ ] Packaging builds with the native dep on Linux/macOS/Windows; e2e green.
- [ ] reviewer + security sign-off (§7).

## Outcome (filled on completion)
