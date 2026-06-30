# Service-wide default slide background (Settings)
- **ID:** 2026-06-30_service-default-background
- **Phase:** UX-merge (follow-on to M4 slide backgrounds)
- **Assigned agent type:** implementer (+ reviewer + security on the main setDeck seam)
- **Status:** in-progress — implementation + gate green; pending user observation + reviewer/security sign-off

## Goal
Let the operator set ONE consistent background (color OR image/video) for an entire period of
service, from the Settings page. The chosen default is persisted and SEEDS the `background` field on
every deck sent live (scripture, song, AI-detected) — so the whole service shares a look without
re-setting it per passage. A per-slide override in the Present preview (M4 `BackgroundEditor`) still
wins. Additive + non-breaking: reuses the existing optional `background` field, the existing
`settings:get/set` IPC, and the existing audience/preview render path (no new channel, no render
change). Empty/unset default = today's behaviour (gradient backdrop).

## Scope (files/areas)
- `src/shared/present/serviceBackground.ts` (new, pure) — `SERVICE_BACKGROUND_KEY`,
  `serializeServiceBackground`, `parseServiceBackground` (JSON + zod re-validate → null on any
  error, fail-safe so a tampered settings row can't inject CSS), `applyServiceBackground(deck, bg)`
  (fills `background` only on slides that lack one; never mutates input; bg null → deck unchanged).
- `src/shared/present/serviceBackground.test.ts` (new) — parse/serialize round-trip, invalid/unsafe
  → null, apply fills-empty/preserves-explicit/null-noop/no-mutation.
- `src/main/windows/windowManager.ts` — `setDeck` reads + applies the persisted default (single
  choke point for ALL decks). Wrapped so a settings/parse error falls back to the raw deck (§5.7).
- `src/renderer/features/present/BackgroundPicker.tsx` (new) — shared presentational picker
  (swatches + native color + collapsible media-library grid) extracted from `BackgroundEditor`.
- `src/renderer/features/present/BackgroundEditor.tsx` — delegate to `BackgroundPicker` (public
  props unchanged; keeps Clear + apply-to-all). No duplicated picker UI (§1.9).
- `src/renderer/features/settings/PresentationSettings.tsx` (new) — load/save the default via
  `settings:get/set`, live `SlidePreview`, `BackgroundPicker`, Clear, Saved indicator.
- `src/renderer/features/settings/SettingsPage.tsx` — register the new "Presentation" tab.

## Rules that apply
- §1.3 (renderer only `window.api`), §1.5 (truth in SQLite), §1.9 (one way — reuse `background`
  field + settings IPC + shared picker), §5.2/§5.3 (validate at the main boundary; renderer never
  trusted — the default is re-validated by the zod schema before it reaches a slide), §5.6 (tokens,
  no hex), §5.7 (audience fail-safe to black/gradient preserved; a bad default never breaks a deck).

## Acceptance criteria
- [ ] A color OR image/video default is settable + persisted in Settings → Presentation.
- [ ] Decks sent live after setting it inherit the default on slides without an explicit background.
- [ ] A per-slide override (Present preview) still wins; "Clear default" restores the gradient.
- [ ] Default re-validated in main (unsafe color/url → ignored); a parse error never breaks setDeck.
- [ ] No new IPC channel; no duplicated picker UI; tokens only.
- [ ] tsc 0 · lint 0 · unit tests for serviceBackground green; reviewer + security sign-off.

## Outcome (2026-06-30 — v1 baked-at-setDeck; SUPERSEDED by v2 below)
First cut seeded the default into the deck at `setDeck` time. User-tested: "nothing happens on the
actual presentation" — because baking only affects FUTURE decks (the live deck never updated on a
setting change) and conflated an inherited default with an explicit override (no provenance). Reworked.

## Outcome (2026-06-30 — v2 render-time fallback in live state; gate green)
The default is now LIVE present state, resolved at RENDER time — never baked. This makes it reactive
(change it → the current on-screen deck updates immediately) and keeps one clear model: `background`
on a slide = an EXPLICIT operator override only; the service default is a separate field applied
beneath it. **Media slides are skipped** (their media covers the surface — the user's note).

- `presentState` + `presentDeckPayload` gain `defaultBackground` (rides the deck broadcast); `FAILSAFE`
  carries `null`. New `setDefaultBackgroundInput`.
- Reducer: new `setDefaultBackground` action (sets field + bumps `rev` → both windows re-render);
  `defaultBackground` preserved across `setDeck` + `black` (it's a setting, not deck state).
- Pure `effectiveBackground(slide, default)` in `serviceBackground.ts` (override wins → media slide
  skipped → text slide uses default). `applyServiceBackground` (the baking helper) removed.
- Main: `setDefaultBackground` persists (SQLite) AND dispatches (live); `initPresent()` loads the
  persisted default at startup; `broadcastDeck` carries it; the `setDeck` seeding was removed.
- New IPC `present:set-default-background` (zod-validated, re-validates color/url before it can reach
  the audience). Reconciler + preload + `api.d.ts` carry the field through.
- Render surfaces resolve via `effectiveBackground`: `AudienceView` (SlideLayer), `LiveCockpit`
  (on-screen + next), `PreviewSchedulePane` (staged preview shows the default it will inherit).
- `PresentationSettings` now loads via `present.getState()` and saves via `present.setDefaultBackground`
  (no renderer settings plumbing). Shared `BackgroundPicker` (extracted from `BackgroundEditor`) reused.

Gate: tsc 0 · eslint 0 · prettier clean · full suite **328/328** green (new: effectiveBackground 5,
reducer setDefaultBackground 4, reconciler carry 1, schema input 6). No new render path (reuses the
`background` field); audience fail-safe-to-black preserved.

**Remaining to close:** run the app and observe (set a default in Settings → Presentation while a
passage is live → it appears immediately on the audience; a per-slide override still wins; a media
slide is unaffected); reviewer + security sign-off on the new IPC + the field reaching the compositor.
</content>
</invoke>
