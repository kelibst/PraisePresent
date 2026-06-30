# B8 — Present / Live Console screen re-skin
- **ID:** 2026-06-29_b8-present-screen
- **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin `src/renderer/features/presentation/PresentationPage.tsx` to the design's live cockpit: a left
**deck rail** (slide thumbnails) + a right **cockpit** (LIVE badge, big on-screen-now + next previews,
transport controls, transition Cut/Fade/Dissolve). Preserve ALL existing keyboard live-controls.

## Scope
- `src/renderer/features/presentation/PresentationPage.tsx` ONLY (do NOT touch `AudienceView.tsx` — that's B11).
- Data (all exist): `present.getState`/`onState`/`setDeck`/`next`/`prev`/`goto`/`black`/`blank`/`clear`
  + transition param. Reuse shared atoms `MiniSlideThumb` (deck rail), `SlidePreview` (on-screen/next), `PaneHeader`.

## Rules
- §1.3 (window.api only), §5.4 (KEEP the keyboard controls already in PresentationPage — →/Space next, ← prev,
  B black, Esc/. clear, Home/End — they are mandatory live), §5.6 (tokens/atoms/no hex), §1.9.
- Size to content / h-full; shell owns chrome.

## Acceptance
- [ ] Deck rail (MiniSlideThumb, current highlighted, click=goto); cockpit on-screen-now + next (SlidePreview).
- [ ] Transport: Prev/Next/Black/Clear + transition selector (Cut/Fade/Dissolve) wired to `present.*`.
- [ ] LIVE badge reflects state; all existing keyboard shortcuts still work (don't regress).
- [ ] Existing `presentation.spec.ts` (deck navigate, transitions, fail-safe, presenter UI/keyboard) still passes.
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)
Re-skinned `PresentationPage.tsx` to the 2-region live cockpit. The existing
`onState`/`getState` subscription and the full keyboard handler (→/Space next, ←
prev, B black, ./Esc clear, Home/End first/last) are preserved byte-for-byte.

- **Left deck rail (262px):** `PaneHeader label="Deck" meta="N slides"` + each deck
  slide as `MiniSlideThumb` (1-based index, first line, reference). The live slide
  is `live`+`selected` (sage ring). Click → `present.goto(i)`.
- **Cockpit state bar:** pulsing sage `LIVE` chip (`animate-pp-pulse bg-pp-success`,
  matches TopBar) when `mode==='slide' && deck.length>0`, else STANDBY/BLACK/BLANK/
  CLEAR. Status line "Display 2 · 1920×1080 · 60fps · <Transition> <ms>ms"; right-
  aligned "Slide N / M" (kept verbatim for the e2e `/Slide 1 \/ 3/` assertion).
- **Previews:** `SlidePreview variant="lg" active` (On screen now, LIVE badge) +
  `variant="sm"` (Next →), both fed `lines/reference/media` from
  `deck[index]`/`deck[index+1]`.
- **Transport:** Prev `present.prev`, big sage Next `present.next` (kbd Space), Black
  `present.black` (kbd B), Blank `present.blank`, Clear `present.clear` (kbd Esc),
  plus a grouped Cut/Fade/Dissolve selector (selected=sage) wired to `setTransition`
  → `present.setDeck(deck, index, { type, durationMs })` exactly as before.

**e2e:** `presentation.spec.ts` is unchanged and its contract is preserved — the
heading "Presentation" remains (now `sr-only`, still in the a11y tree for
`getByRole('heading')`); the "Slide N / M" status is byte-identical; all `present.*`
control calls and audience-mirroring behavior are untouched. No spec edits needed.

**Verify:** `bunx tsc --noEmit` → 0; `eslint` on this file → 0 (repo-wide lint has a
pre-existing unrelated error in `HomePage.tsx` owned by the B3 agent); `prettier
--check` clean; `bun run test` → 162 passed. window.api only; tokens only, no hex.
Not committed.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
