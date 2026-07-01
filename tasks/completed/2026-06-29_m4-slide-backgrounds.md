# M4 — Slide backgrounds (color or media) + Preview editor
- **ID:** 2026-06-29_m4-slide-backgrounds · **Phase:** UX-merge (M4) · **Agent:** implementer (+ reviewer + security on schema/IPC)
- **Status:** done (reviewer + security SIGN OFF 2026-06-29)

## Goal
Let the operator set a slide's **background** to a **color** or a **media file (image/video)** from the
Preview, with **"Apply to all slides."** Additive + non-breaking: a new OPTIONAL `background` field on
the slide, rendered BENEATH the text layer in both the audience output and the preview, with the audience
fail-safe-to-black guarantee fully preserved (§5.7).

## Scope (files)
- `src/shared/schemas/present.ts` — add OPTIONAL `background` to `presentSlide`:
  `background?: { type: 'color', color: string } | { type: 'media', kind: 'image' | 'video', url: string }`
  (zod union; validate color as a safe CSS color/hex; reuse `slideMediaKind`). Keep all existing fields;
  fully backward-compatible (old decks without `background` still valid).
- `src/main/services/presentEngine.ts` (reducer) + `src/main/ipc/presentHandlers.ts` + channels/preload/
  api.d.ts — a main-owned, clamped way to set a slide background on the live deck:
  `present:set-background` (`{ index?: number /* current if omitted */, background | null, applyToAll?: boolean }`)
  OR a general `present:update-slide` (index + partial). Main re-validates; renderer never trusted.
- `src/renderer/features/presentation/AudienceView.tsx` — render the `background` layer beneath text:
  color = a solid/!gradient fill; media image/video = object-cover behind text. MUST stay fail-safe:
  any background load error falls back to the existing black/gradient; black/blank/clear unaffected.
- `src/renderer/components/common/SlidePreview.tsx` — render the same `background` (it is the scaled twin).
- `src/renderer/features/present/` Preview pane (`PreviewSchedulePane.tsx` or a new `BackgroundEditor.tsx`)
  — a compact Background control: color picker/swatches + "Choose image/video" (reuse the Media library
  via `media.list`) + "Apply to all slides". Calls the new IPC. Unobtrusive; tokens not hex.

## Rules
§1.3 (window.api only in renderer), §5.2/§5.3 (privileged + zod IPC in main; never trust renderer; validate
color/url), §5.6 (tokens/atoms, no hex in components), §5.7 (**audience fail-safe to black preserved**),
§1.9. Security sign-off (schema + new IPC + a URL/color reaching the audience compositor).

## Acceptance
- [ ] `background` is optional + backward-compatible; existing decks/tests unaffected.
- [ ] Operator sets a color OR media background on the staged/live slide from the Preview; "Apply to all" works.
- [ ] AudienceView + SlidePreview render the background beneath text; load error / black / blank / clear all still fail safe to black.
- [ ] New IPC zod-validated in main, clamped; renderer never trusted; no secret/path leak.
- [ ] tsc 0 · lint 0 · format clean · unit (add: reducer background set/apply-all, schema back-compat) green; `bun run package` + audience/presentation e2e pass. Reviewer + security sign-off.

## Outcome (filled on completion)

## Outcome (2026-06-29 — DONE, reviewer + security SIGN OFF)
Additive OPTIONAL `background` on presentSlide (color | media image/video; paint order background→media→text). Color validated by `isSafeCssColor` allow-list (rejects url()/expression()/var()/;/}, len-capped 64) + applied as inline style only (no className); media url bounded by CSP (self app-media:) + app-media integer-id DB allow-list. New `present:set-background` IPC (index?/null-clear/applyToAll, zod-validated, clamped, re-broadcast). AudienceView + SlidePreview render bg beneath text; bg media error → gradient; black/blank/clear/empty/out-of-range → black (fail-safe intact). BackgroundEditor on the Preview (swatches + native color picker + media library + apply-to-all + clear). +17 unit tests (reducer set/applyAll/clear/empty-noop + schema back-compat + unsafe-color rejection). Gate: tsc 0 · lint 0 · format clean · 187 unit · package · audience+presentation+scripture e2e 4/4. Security SIGN OFF (color injection guarded, audience fail-safe preserved, renderer untrusted).
