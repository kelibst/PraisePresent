# B4 — Scripture screen re-skin (3-pane workspace)
- **ID:** 2026-06-29_b4-scripture-screen
- **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin the Scripture feature to the design's 3-pane workspace on real data: Pane 1 search/results
(segmented reference + card-picker + keyword modes), Pane 2 Preview(staged) + Schedule(active service),
Pane 3 Live Output (on-screen now + next). Scripture is **read-only / edit-locked** per design.

## Scope
- `src/renderer/features/scripture/` — `ScripturePage.tsx` (3-pane layout) + `ScriptureSearch.tsx` +
  `BibleBrowser.tsx` (fold into the card-picker), plus small subcomponents in the same dir.
- Data (all exist): `scripture.listBooks`/`getChapter`/`lookupReference`/`searchKeyword`/`listTranslations`;
  `present.setDeck`/`getState`/`onState`/`next`/`prev`/`black`; `useActiveService()` (A6) for the Schedule pane.
- Reuse shared atoms: `SlidePreview` (Preview + Live Output panes), `PaneHeader`, `ScheduleRow`.

## Rules
- §1.3 (window.api only), §5.4 (keyboard/aria — staging/sending live under pressure), §5.6 (tokens/atoms/no hex),
  §1.9 (fold the old Browse/Search tabs into the new modes — no second scripture UI). Scripture text is read-only.

## Acceptance
- [ ] Mode toggle: reference (segmented book›ch:verse + autocomplete), card-picker (book→chapter→verse grid), keyword (highlighted hits) — all on real data.
- [ ] Stage a verse/range → Preview pane shows it (SlidePreview); Send Live → `present.setDeck`; Live Output pane mirrors `present` state (on-screen now + next).
- [ ] Schedule pane lists the active service's items (ScheduleRow); add-to-schedule wired or clearly stubbed.
- [ ] Existing scripture e2e (`scripture.spec.ts`) still passes (reference + keyword + present).
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)

**Status:** implemented; awaiting reviewer sign-off.

Re-skinned the Scripture feature into the approved 3-pane workspace (flex 1.3 : 1 : 1.15),
one scripture UI — the old `ScriptureSearch.tsx` and `BibleBrowser.tsx` were deleted and
folded into Pane 1's modes (§1.9). All data flows through `window.api` only (§1.3); tokens,
no hex (§5.6); shared atoms reused (`SlidePreview`, `PaneHeader`, `ScheduleRow`); scripture
text is read-only everywhere (lock badges, no editing).

### Files
- **Added:** `scriptureDeck.ts` (pure helpers: referenceLabel/verseId/versesToDeck/rangeLabel/
  highlightSegments) + `scriptureDeck.test.ts` (8 unit tests); `useScripturePresenter.ts`
  (staging + live-mirror hook); `SearchPane.tsx` (Pane 1: mode toggle + segmented reference +
  results); `ReferenceMode.tsx`, `CardPickerMode.tsx`, `KeywordMode.tsx` (the three sub-modes);
  `PreviewSchedulePane.tsx` (Pane 2); `LiveOutputPane.tsx` (Pane 3).
- **Rewritten:** `ScripturePage.tsx` (now the 3-pane orchestrator wiring the hook +
  `useActiveService`).
- **Deleted:** `ScriptureSearch.tsx`, `BibleBrowser.tsx`.

### Mode → IPC mapping
- Reference: `scripture.listBooks` (book autocomplete) + `scripture.lookupReference(query)`.
  Enter resolves the typed reference; the dropdown only steals Enter once the operator has
  arrowed into it (so "John 3:16" resolves directly).
- Card-picker (replaces BibleBrowser): `scripture.listBooks` → `scripture.getChapter(book,ch)`;
  Book(2-col)→Chapter(4-col)→Verse(4-col) grids; picking a verse stages the whole chapter at
  that index. Lands on John 1 (never blank).
- Keyword: `scripture.searchKeyword(query)`; hits rendered with the matched word `<mark>`-ed.
- Translation note from `scripture.listTranslations()` (first translation; "WEB").

### Staging → preview → send-live flow
`useScripturePresenter` holds `staged = {verses, index}`. Every mode reports a passage up via
`onStage`. Pane 2 previews the lead verse (`SlidePreview lg`, read-only badge). Send to Live /
Set as Next / per-row "Send Live" call `present.setDeck(versesToDeck(verses), index)` — identical
slide shape (id/lines/reference) and multi-verse-deck semantics to the prior code, so present
next/prev still walk verses. Pane 3 subscribes to `present.onState`/`getState` and mirrors
on-screen-now + next, with Next/Black/Clear → `present.next/black/clear`.

### Schedule pane
`useActiveService()` (A6) → `plan.items` rendered as `ScheduleRow`. "Add item" is a clearly
disabled/stubbed dashed button (adding scripture to a plan lands with the Plans builder).

### e2e (`tests/e2e/scripture.spec.ts`) — updated UI section, IPC assertions untouched
The old two-tab UI selectors no longer exist, so the UI-interaction block (was lines 98–115)
was rewritten for the new modes: assert the "Scripture" pane label; resolve the prefilled
reference via Enter on `getByLabel('Scripture reference')`; click `Send to Live`; assert the
audience mirrors it; re-fill "Psalm 23" + Enter; switch to the `Keyword` tab and search. All
`presenter.evaluate(...)` IPC assertions (hydration, lookupReference, ranges, FTS5, listBooks,
getChapter, setDeck mirror, bench) are unchanged. **Verified passing** against the packaged
build in 2.3s at the default 30s timeout.

### Verification
tsc 0 · lint 0 · `format:check` clean · unit 170 passed (incl. 8 new) · scripture e2e green.

### Divergences / notes
- "Set as Next" and "Send to Live" map to the same `setDeck` call (present has a single live
  deck, no separate preview channel) — kept as distinct UI verbs per the design.
- Translation dropdown is rendered as a read-only note ("WEB · World English Bible"); only one
  translation ships today, so there's nothing to switch between — no dead picker added.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
