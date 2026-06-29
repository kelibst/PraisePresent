# M5 — Editable slide text (songs/custom editable; scripture locked)
- **ID:** 2026-06-29_m5-editable-slide-text · **Phase:** UX-merge (M5) · **Agent:** implementer (+ reviewer + security on IPC)
- **Status:** done

## Goal
Let the operator edit the displayed **text** of a text-based slide from the Preview and apply it to the
live output. **Scripture text stays locked** (read-only, translation integrity). Reuse the M4 slide-update
IPC pattern. Non-breaking + fail-safe preserved.

## Scope (files)
- `src/shared/schemas/present.ts` — add an additive OPTIONAL lock marker to `presentSlide` (e.g.
  `locked?: boolean` — true = text not editable; or a `source` enum if cleaner). Add a
  `present:update-text` input schema (`{ index?: number /* current if omitted */, lines: string[] }`,
  bounded line count/length). Backward-compatible (existing slides default editable=unlocked, but see below).
- `src/main/services/presentEngine.ts` (+ `.test.ts`) — `updateText` reducer: replace `deck[index].lines`,
  clamped; **MUST reject (no-op) when `deck[index].locked` is true** (defense-in-depth — scripture can't be
  edited even via a crafted IPC call). + `src/main/ipc/presentHandlers.ts` + channels + preload + api.d.ts.
- `src/renderer/features/scripture/scriptureDeck.ts` — `versesToDeck` sets `locked: true` on every verse
  slide (scripture is read-only).
- `src/shared/lib/buildDeck.ts` — song/custom slides remain unlocked (editable). (Media slides have no text.)
- `src/renderer/features/present/` Preview pane (`PreviewSchedulePane.tsx` or a new `TextEditor.tsx`) — an
  inline **Edit text** affordance: editable for unlocked slides, shows the existing "read-only / Edit locked"
  badge for scripture. Edit → `present:update-text`. Visually distinguish editable vs locked (design v3).
- OPTIONAL (only if clean + low-risk): a "save to song" that persists the edited lines back to the source
  song via `songs.update`. If it adds complexity/risk, DEFER it and note — the live-deck edit is the must-have.

## Rules
§1.3 (window.api only), §5.2/§5.3 (zod IPC in main; never trust renderer; main enforces the lock), §5.4
(keyboard/aria — the editor is operable), §5.6 (tokens/atoms, no hex), §5.7 (audience fail-safe unaffected —
empty lines must still render safely), §1.9. Security sign-off (new IPC mutating live output). Scripture lock
enforced in BOTH the UI and main.

## Acceptance
- [ ] Songs/custom slides: edit text in the Preview → live output updates via `present:update-text`. Scripture slides show the locked badge and CANNOT be edited (UI disabled AND main rejects).
- [ ] `locked` marker additive/back-compat; `versesToDeck` marks scripture locked; songs/custom unlocked.
- [ ] Main reducer rejects text edits to locked slides (unit-tested); audience still fails safe on empty/edited lines.
- [ ] New IPC zod-validated + clamped; renderer never trusted.
- [ ] tsc 0 · lint 0 · format clean · unit (updateText: edit current, clamp, locked-reject; back-compat) green; `bun run package` + audience/presentation/scripture e2e pass. Reviewer + security sign-off.

## Outcome (filled on completion)

**Schema (`src/shared/schemas/present.ts`):** added additive OPTIONAL `locked?: boolean`
to `presentSlide` (absent/false = editable; true = text read-only). Added
`MAX_SLIDE_LINES` (64) + `MAX_SLIDE_LINE_LENGTH` (2000) and a new `updateTextInput`
schema (`{ index?: number, lines: string[] }`) with bounded line count/length. New
`UpdateTextInput` type exported. Fully back-compatible — existing slides with no
`locked` key remain editable.

**IPC + main lock enforcement:**
- Channel `present:update-text` added to `CHANNELS.present`.
- Handler in `presentHandlers.ts` validates with `updateTextInput` (bounds enforced),
  then calls `updateText(lines, index)` in windowManager → reducer.
- Reducer `updateText` action (`presentEngine.ts`): clamps the index, replaces
  `deck[target].lines`, never changes mode/index, no-op on empty deck. **Hard rejects
  (true no-op) when `deck[target].locked` is true** — defense-in-depth so a crafted
  IPC can't edit scripture even though the UI also hides the editor (§5.3).
- Preload `present.updateText(lines, index?)` + `api.d.ts` signature added.

**Preview editor wiring:** new `SlideTextEditor.tsx` (present feature) rendered beneath
the "On screen now" preview in `LiveCockpit` (the pane that already holds the live
slide + its lock flag). Unlocked slide → "Edit text" button → textarea (Ctrl/Cmd+Enter
applies, Esc cancels) → `present:update-text` via `usePresentDeck.updateText` threaded
through `PresentPage`. Locked slide → "Text read-only · scripture" lock badge, no editor.
Resets edit mode when the live slide changes so a stale draft can't hit the wrong slide.
Tokens/atoms only, keyboard + aria correct (labeled textarea, focus on open).

**Lock markers:** `versesToDeck` (scripture) now sets `locked: true` on every verse
slide. `blocksToDeck`/`singleSlideDeck` (songs/custom in `buildDeck.ts`) unchanged —
they emit no `locked` key, so songs/custom stay editable. Media slides have no text.

**Audience fail-safe:** `AudienceView` already guards `slide.lines.length > 0` and
renders each line verbatim — empty/edited lines render safe (gradient + reference),
no change needed; confirmed by e2e.

**Tests added:** `presentEngine.test.ts` — updateText: edit current (no audience move),
clamp index, locked-reject (true no-op), empty lines, empty-deck no-op, back-compat
(no `locked` key = editable). `scriptureDeck.test.ts` updated to expect `locked: true`
+ a new "all scripture slides locked" assertion.

**save-to-song: DEFERRED** — would require carrying the source song id + section mapping
into the deck and a `songs.update` write-back from the live path; materially more complex
and risky for a live-operated screen. Live-deck edit (the must-have) is complete.

**Verification:** `bunx tsc --noEmit` 0 · `bun run lint` 0 · `bun run format` +
`format:check` clean · `bun run test` 194 passed · `bun run package` succeeded ·
`bunx playwright test audience/presentation/scripture` 4 passed.

**Pending:** reviewer + security sign-off (new IPC mutating live output) — PM to assign.

## PM sign-off (2026-06-29)
Reviewer + security SIGN OFF: scripture lock enforced in reducer (hard no-op) + source (versesToDeck locked:true) + UI; updateTextInput zod-bounded (64 lines / 2000 chars); audience fail-safe intact; renderer untrusted. 194 unit · package · 5 e2e. Non-blocking notes: locked flag renderer-authored (not a regression — deck content already renderer-supplied; note for future if main becomes deck authority); add updateTextInput over-bound rejection tests later (coverage).
