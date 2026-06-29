# Image pre-scaling on import + tier-aware rendition serving
- **ID:** 2026-06-29_b6b-image-prescale
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer (security review REQUIRED — dep + protocol, §7)
- **Status:** done

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

## Tool decision (2026-06-29)
Used **pure-JS `jimp`**, NOT native `sharp`. Rationale: image resize happens at IMPORT
time, not show time — the show-time win (the projector decodes a small rendition) is
identical regardless of who did the resize, so native buys nothing here while adding
real cross-platform packaging risk. jimp bundles into the main vite build with ZERO
native-unpack surface (verified: `npm run package` builds clean). Native ffmpeg is
reserved for B6c (video), where it genuinely matters. This is the brief's "be skeptical;
native only where measured" stance (prompt.md §4).

## Acceptance criteria
- [x] Pure rendition-decision logic unit-tested (mediaPipeline.test.ts — 13 cases).
- [x] Original preserved; one rendition per media id, cached under userData/media-cache.
- [x] Guard rails: size ceiling (200MB) + format allow-list + full error isolation
      (any failure → no rendition → serve original, never blocks/crashes import).
- [x] Protocol serves the rendition when present on disk, else the original; missing
      both → 404 → fail-safe black. Tier-aware target (low caps to 1080p).
- [x] Packaging builds with jimp bundled into main; e2e green (media-prescale.spec.ts).
- [x] reviewer + security sign-off (§7).

## Outcome
Implemented with pure-JS jimp (see tool decision above). On import, oversized images
are decoded once and written to a projector-fit rendition under userData/media-cache;
the app-media:// protocol serves the rendition (id-only DB allow-list preserved), else
the original, else 404→black. Tier-aware (low caps to 1080p). 240 unit (13 new pure-logic
cases) + media-prescale e2e + full suite green; tsc + lint clean; package bundles jimp.
**Reviews:** security SIGNED OFF (clear yes on the operator-trusted decode threat model;
no allow-list/SQL/fail-safe regression) + correctness SIGNED OFF (one minor finding —
the now-orphaned `mediaRepository.getPath` — removed per §1.9). Advisory follow-ups tracked
to B6c: a megapixel/decode guard with worker isolation. `package-lock.json` committed to
pin the dep tree.

## Deferred (documented, not silently dropped)
- LRU disk-budget eviction: v1 keeps exactly one rendition per media id, deleted on
  remove() — bounded by library size, so no eviction needed yet. Add when the rendition
  ladder grows multiple sizes (B6c-era).
- Free-disk pre-flight: the optimizer's catch already degrades a full disk to "serve
  original" (no crash); an explicit pre-flight is a nicety, not a safety gap.
- Background optimize queue: v1 optimizes inline on import (fine for a few backgrounds;
  a queue avoids blocking a bulk import — follow-up).
- Re-optimization on projector/tier change: the rendition is always ≤ projector so it
  stays visually correct; regenerate-on-change is a refinement.
- webp/avif/svg/gif: served as-is (jimp doesn't reliably round-trip them); jpg/png/bmp
  cover the large-photo background case.

## Outcome (filled on completion)
