# B11 — AudienceView polish (design slide rendering, fail-safe preserved)
- **ID:** 2026-06-29_b11-audience-polish · **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Polish `src/renderer/features/presentation/AudienceView.tsx` so the live audience output matches the
design's slide look and is visually consistent with the `SlidePreview` atom (its scaled twin), WITHOUT
regressing the proven fail-safe-to-black behavior or the A4/A6 safe-area honoring.

## Scope
- `src/renderer/features/presentation/AudienceView.tsx` ONLY.
- It already: subscribes `present.onState`, renders slide/blank/black, fails safe to black, honors
  `display.safeAreaPct`. Keep ALL of that. Align typography/layout/tokens with `SlidePreview`.

## Rules
§5.7 (audience path fails safe to black — NEVER a crash/stack trace; this is paramount), §1.3 (window.api only),
§5.6 (tokens, no hex), §1.9. Match the design's centered balanced text + reference + media handling.

## Acceptance
- [ ] Slide rendering matches the design / SlidePreview look (balanced centered text, reference, media image/video).
- [ ] Safe-area inset preserved; blank/black/error all still fail safe to black.
- [ ] Existing `audience.spec.ts` (mirrors presenter, fails safe to black) still passes.
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)
Polished `AudienceView.tsx` slide rendering to be the full-screen twin of `SlidePreview`:
- Added a deep radial-gradient slide surface (`bg-pp-surface-live` + the same two `radial-gradient`
  layers as SlidePreview, using `--pp-accent-deep`/`--background` tokens — no hex) layered ON TOP of the
  unchanged outermost solid-black backdrop, so the projector still fills edge-to-edge black.
- Text: viewport-unit typography (`5.2vw` lines, `3.2vw` reference) scaling at full screen, `[text-wrap:balance]`
  centered balanced lines, `px-[7vw]` padding, `gap-[1.2vw]` line gap — mirrors SlidePreview's `cqi` scale.
- Reference moved to bottom-right pin (`absolute bottom-[3vw] right-[4vw]`), matching SlidePreview.
- Media now `absolute inset-0 object-cover` (was `object-contain`) to fill the screen like SlidePreview.

UNTOUCHED (verified by re-reading the file): `present.onState` subscription (line 31), the safe-area
read/`parseSafeAreaPct`/`safeAreaStyle` padding (A4/A6), and the fail-safe-to-black guarantees — black/clear/
empty-deck/out-of-range still hit the final `bg-black` return, blank still dims to `neutral-900`, and media
`onError` still sets `mediaErrorId` → falls back to the gradient surface (and never a broken-image icon).
No IPC, no `electron`/`fs`/`node:*` imports added (§1.3). Tokens only (§5.6).

`audience.spec.ts`: NO changes needed — `getByText('MIRROR TEST')` still matches the rendered `<p>` lines,
and `black()` still hides the slide (selector + fail-safe assertions preserved).

Verify: `bunx tsc --noEmit` 0 · `bun run lint` 0 · `bun run format` + `format:check` clean · `bun run test`
170 passed. Status: pending reviewer sign-off + observed render.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
