# B6 — Media screen re-skin (2-pane grid + detail)
- **ID:** 2026-06-29_b6-media-screen · **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin the Media feature to the design's 2-pane layout: a media grid (filterable by type) + a selected-item
detail pane (preview + metadata + actions). Real data.

## Scope
- `src/renderer/features/media/MediaPage.tsx` (+ in-dir subcomponents).
- Data: `media.list/import/add/remove`; `present.setDeck`/`black`. Shared atoms: `SlidePreview`
  (detail preview), `PaneHeader`. Thumbnails use the existing `app-media://` URL scheme (see current MediaPage/AudienceView).

## Rules
§1.3 (window.api only), §5.4 (keyboard/aria), §5.6 (tokens + atoms, no hex), §1.9, §5.7 (fail-safe on missing/broken media). Size to content/h-full.

## Acceptance
- [ ] Pane 1 grid (`media.list`) with type filters (All/Images/Video/Audio), type badges, video play / audio waveform affordances, Import (`media.import`); selected tile sage-ringed.
- [ ] Pane 2 detail: SlidePreview of the selected item + metadata + actions Present (`present.setDeck`) / Set-as-background / Remove (`media.remove`). ("Set as background" wired to present or clearly stubbed.)
- [ ] Existing `media.spec.ts` still passes (add, present via app-media://, fail safe on missing file).
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)
Re-skinned `src/renderer/features/media/MediaPage.tsx` to the approved 2-pane layout
(`grid-cols-[1.7fr_1fr]`, `h-full min-h-0`, own `p-3`) inside the shell's scrollable main.

- **Pane 1 (GridPane):** type filter chips (All/Images/Video/Audio, sage = `bg-pp-accent` active)
  with `role=tablist`/`role=tab`/`aria-selected`; sage "Import media" button (`Button` primitive)
  wired to `window.api.media.import()`. Auto-fill 16:9 tile grid (`auto-fill minmax(11rem,1fr)`):
  image thumbnail via `app-media://` `object-cover`; video = `PlayCircle` overlay; audio = waveform
  (`Music`) glyph; top-left type badge (IMAGE/VIDEO/AUDIO); truncated filename label. Selected tile
  = `ring-2 ring-pp-accent` (`aria-pressed`).
- **Pane 2 (DetailPane):** `PaneHeader label="Selected"` + kind meta; `SlidePreview variant="lg"`
  of the chosen item (badge = kind); metadata (Name · Type · Path); actions Present / Set-as-background
  / Remove.
- **Data wiring (window.api only, §1.3):** `media.list()` on mount + after import/remove; `media.import()`
  (Import); `media.remove(id)` (Remove). Selection auto-heals on library change (clamps to first item;
  clears on empty).
- **Present:** `present.setDeck([mediaSlide(item)], 0)` with the *unchanged* present-media slide shape
  `{ id: 'media-<id>', lines: [], media: { kind, url: app-media://media/<id> } }` — identical to what
  `media.spec.ts` constructs, so the audience img/video path is preserved.
- **Set as background:** clearly-disabled stub (`<Button disabled>` with explanatory `title`). No distinct
  background channel exists in the present schema (a media-only slide *is* full-screen), so wiring it to
  `setDeck` would duplicate Present (§1.9). Left disabled pending a real background layer.
- **Fail-safe (§5.7):** grid `Thumbnail` catches `<img onError>` and falls back to the kind glyph — a
  moved/corrupt image never breaks the grid; `SlidePreview` already fails safe to its gradient backdrop.
- **Tokens not hex (§5.6):** all colors via `pp-*`/`destructive`/`ring` tokens + `ui/` `Button` + shared
  atoms (`PaneHeader`, `SlidePreview`). Icons via `lucide-react` (matches sibling re-skins; dropped the
  old `react-icons` import).

**Gates:** `tsc --noEmit` 0 · `lint` 0 · `format` + `format:check` clean · unit `170 passed (21 files)`.

**media.spec.ts change needed (PM batch — I am scoped to features/media only, did not edit tests):**
Line 58 `getByRole('heading', { name: 'Media' })` must become `getByText('Media').first()` — the page now
uses `PaneHeader` (a `<span>` label), not an `<h1>`. This is the exact precedent already applied in
`scripture.spec.ts:104`. Everything else in the spec is preserved: `getByText('background.png')` still
resolves (tile filename label), the present-via-`app-media://` flow and the missing-file/orphan-id
fail-safe assertions are unchanged.

**Divergences:** Metadata shows Name · Type · Path; the design's "dims/size" fields are not in
`mediaItem` (schema), so omitted rather than faked. "Add media"/"Black" controls from the old page were
removed (Black belongs to live-control panes, not the library; per design Pane 1 only has filters +
Import).

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
