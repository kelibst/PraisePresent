# B5 — Songs screen re-skin (3-pane) + edit/delete
- **ID:** 2026-06-29_b5-songs-screen · **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin the Songs feature to the design's 3-pane workspace: library + filters · sections · live preview.
Wire New/Import/**Edit/Delete** (IPC already exists). Real data.

## Scope
- `src/renderer/features/songs/` (SongsPage.tsx + new subcomponents in-dir).
- Data: `songs.list/get/create/update/delete/importText`; `present.setDeck`/`black`. Shared atoms:
  `SlidePreview` (live preview, badge "Editable" — songs ARE editable unlike scripture), `PaneHeader`.

## Rules
§1.3 (window.api only), §5.4 (keyboard/aria), §5.6 (B1 tokens + atoms, no hex), §1.9 (one songs UI).
Size to content/h-full.

## Acceptance
- [ ] Pane 1 library (`songs.list`) + search + category filters; Pane 2 sections (`songs.get`, selectable, present a section); Pane 3 live preview (SlidePreview, "Editable") mirroring `present`.
- [ ] New song / Import (importText) / **Edit lyrics (update)** / Delete wired; present a section → `present.setDeck`.
- [ ] Existing `songs.spec.ts` still passes (import, persist, present a section).
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)
Re-skinned Songs to the 3-pane workspace (cols 1.15 : 1.1 : 1) inside the app shell's
scrollable main (`h-full`, own `p-3`). All data/actions flow through `window.api` via a
new presenter hook; no `electron`/`ipcRenderer` imports, no hex (tokens only), shared
atoms (`SlidePreview`/`PaneHeader`) reused. One songs UI — the old single-column import
form is gone, folded into the New-song dialog.

Files added:
- `useSongsPresenter.ts` — owns library/selected/live-mirror state; wires
  list/get/importText/update/delete + present.setDeck/next/black/clear; `isSectionLive`.
- `LibraryPane.tsx` — Pane 1: heading + sage "New Song", search (title/author/CCLI),
  category chips derived from tags (All + per-tag), selectable rows (sage left-bar + tint).
- `SectionsPane.tsx` — Pane 2: song title + "author · N sections · CCLI" meta, Edit/Import/
  Delete actions, section cards (uppercase label + lyrics); click presents that section;
  live section sage-highlighted.
- `SongLivePane.tsx` — Pane 3: live mirror, SlidePreview lg with "Editable" accent badge +
  "Lyrics are editable here" note, Next preview, Next/Black/Clear controls.
- `SongEditorDialog.tsx` — one dialog, two modes: create (title/author/text → importText,
  main parses) and edit (title/author/CCLI + per-section content textareas → update(Song)).
Files changed: `SongsPage.tsx` (now composes the 3 panes + editor + delete-confirm dialog).

Edit/Delete wiring: Edit uses the existing `songs.update(Song)` IPC — the edit dialog
preserves section kind/label/sortOrder and only mutates metadata + each section's content,
so no parser is duplicated in the renderer (parser stays in main). Delete uses `songs.delete`
behind a confirm dialog; clears selection if the open song is removed; both refresh the list.

songs.spec.ts: passes unchanged. Its `getByRole('heading', { name: 'Songs' })` is satisfied
by Pane 1's `<span role="heading" aria-level={1}>` (PaneHeader wraps label in a span, so a
real `<h1>` would be invalid nesting); `getByRole('button', { name: 'Amazing Grace' })` is
satisfied by the library rows being buttons whose accessible name contains the title.

Verify: `bunx tsc --noEmit` 0 · `bun run lint` 0 · `bun run format`+`format:check` clean ·
`bun run test` 170 passed. NOT committed. Reviewer sign-off + observed render still pending.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
