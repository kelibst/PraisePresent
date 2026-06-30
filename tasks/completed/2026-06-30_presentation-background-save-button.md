# Presentation background: explicit Save button + verify apply path
- **ID:** 2026-06-30_presentation-background-save-button
- **Phase:** UX-merge (follow-on to service-default-background + background-architecture-review)
- **Assigned agent type:** PM/implementer (+ e2e)
- **Status:** done — Save button added; apply path evaluated + proven end-to-end; gate + e2e green

## Goal
User report: "add a save button for saving presentation background and ensure that the
presentations take that background. right now it is not working." Evaluate whether the service-wide
default background actually reaches presentations, fix if broken, and add an explicit Save button to
Settings → Presentation.

## Evaluation (what was actually wrong)
Traced the whole seam and **empirically proved the apply pipeline was already working** with focused
Playwright/Electron repros:
- Default applies to a text slide (set default → send deck → audience paints it). ✓
- Changing the default WHILE a deck is live updates the audience immediately (rev bump → rebroadcast). ✓
- `present:get-state` round-trips `defaultBackground`. ✓
- **Persists across an app restart** (close → relaunch → still set → applies). ✓ (`initPresent` loads it.)
- Driving the **real Settings UI** (click the Sage swatch) persisted + applied on the audience. ✓
Reducer/reconciler/broadcast/persistence were all correct; deck builders don't bake a per-slide
background, so scripture/song/text slides correctly inherit the default.

**Real gap = UX, not the pipeline:** the Settings panel *silently auto-saved* on every pick with only
a 1.5s "Saved" flash and no commit step — so it was unclear whether/when it saved, and changes applied
instantly mid-edit. That is what read as "not working."

## Change
`src/renderer/features/settings/PresentationSettings.tsx` reworked from auto-save to an explicit
**draft → Save** model: picking a color/image/video updates the live preview ONLY (no IPC); an explicit
**"Save background"** button persists via `present.setDefaultBackground` (which applies it to the live
presentation). Adds a dirty indicator ("Unsaved changes"), a "Saving…"/"Saved — now live" status, and a
"Clear (use gradient)" that stages a clear. Per-slide overrides in the Present preview remain instant
(correct — those are live operations, not a setting). No main/IPC/schema change.

## Scope (files)
- `src/renderer/features/settings/PresentationSettings.tsx` — draft/saved state, Save button, dirty/saved UI.
- `tests/e2e/presentation-background.spec.ts` (new) — drives Settings → Presentation: stage a swatch
  (live unchanged), Save (audience applies + "Saved — now live"), getState round-trip, clean teardown.

## Rules that apply
- §1.3 (renderer via window.api only), §1.5 (truth in SQLite via the present domain), §1.9 (reuse the
  existing `setDefaultBackground`/`getState` — no new plumbing), §5.7 (main re-validates; audience fail-safe).

## Outcome (2026-06-30 — done)
Gate: tsc 0 · eslint 0 · prettier clean · **336** unit · **4/4** e2e (new background-save flow + audience
mirror/fail-safe + presentation navigate/transition + presenter UI) on a fresh `npm run package` build.
NOTE: the diagnostic repros wrote into the real settings DB; the e2e teardown resets the persisted
default to null (gradient), so the operator starts from a clean slate. Image/video defaults use the SAME
render path as the proven color path (`effectiveBackground` → `SlideStage` `StageBackground`, unit-tested)
and the same `app-media://` seam as per-slide media backgrounds (M4, already security-signed). Work is on
branch `phase-ux/background-theme-decouple` (uncommitted).
