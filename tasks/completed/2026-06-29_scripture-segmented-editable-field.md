# EasyWorship-style SEGMENTED, editable reference field
- **ID:** 2026-06-29_scripture-segmented-editable-field
- **Phase:** 3 (D1 Scripture)
- **Assigned agent type:** implementer (+ reviewer)
- **Status:** done

## Goal
Make the Scripture reference control the actual EasyWorship field the operator types into.
Today the prominent `[Book] › [Chapter] : [Verse]` strip is a **read-only** display while a
separate plain text box below it is the real input — so the operator tries to edit the chips and
nothing happens ("I can't edit the field … not like EasyWorship"), and there are two competing
controls (§1.9). Replace both with ONE segmented, editable field: three typed zones
(Book / Chapter / Verse) rendered as chips, with book autocomplete, Space to advance
book→chapter→verse, Backspace to walk back, inline ranges in the verse zone, never-empty
(defaults to Genesis 1:1), live resolution with no Enter required.

## Scope (files/areas)
- `src/renderer/features/scripture/bookMatch.ts` (+ test) — add pure `isExactBook(books, text)`.
- `src/renderer/features/scripture/ReferenceMode.tsx` — rewrite as the segmented editable field
  (three zones + dropdown + segment navigation + never-empty + debounced live resolve).
- `src/renderer/features/scripture/SearchPane.tsx` — in Reference mode the field IS the segmented
  display, so suppress the duplicate read-only `SegmentedReference` strip there (keep it for
  Card-picker / Keyword modes, which have no reference input); pass the active translation abbr.
- `tests/e2e/scripture.spec.ts` — update reference interactions to the segmented field.

## Rules that apply
- §1.3 window.api only · §5.2 process boundaries (pure renderer matcher, no main import)
- §5.4 keyboard-operable under pressure · §1.9 one control, not two
- §5.7 projector fails safe (invalid/empty never blanks or throws) · §5.8 tests

## Acceptance criteria
- [x] The prominent field is directly editable; the read-only duplicate is gone in Reference mode.
- [x] Type book → autocomplete dropdown, nearest highlighted; Space completes book → Chapter;
      Space/`:` → Verse; Backspace at a segment start → previous segment.
- [x] `joh 3 16`, `1 the 2 5`, `Ps 23`, `John 3:16-18` all resolve live with no Enter.
- [x] Never blank: clearing a zone restores the last valid reference on blur; default Genesis 1:1.
- [x] tsc 0 · lint 0 · prettier clean · 258 unit (incl. new isExactBook) · full 23 e2e green.
- [x] Reviewer sign-off — PASS-WITH-NITS; recommended nits fixed.

## Outcome (filled on completion)
Rewrote `ReferenceMode.tsx` as ONE segmented, editable EasyWorship field — three labelled zones
`[Book] › [Chapter] : [Verse]` + translation chip — replacing the old read-only `SegmentedReference`
strip + hidden plain input (the bug behind "I can't edit the field … not like EasyWorship").
SearchPane now suppresses the read-only strip in reference mode (kept for picker/keyword) and passes
the active abbr. Added pure `isExactBook` (+ tests) to gate live resolution so mid-typing "jo" never
resolves Joel. Behaviour: nearest-book autocomplete dropdown, Space/`:` advance + select-on-advance,
Backspace walks back, digit-after-book auto-advances to chapter, inline verse ranges, never-blank
(default Genesis 1:1, blur-restore), debounced live resolve with a reqId race-guard, projector fails
safe (quiet hint, never blanks/throws). window.api only; no main/IPC/secrets touched → no security
review required.

Verified by RUNNING the packaged app (screenshots): field renders `[John] › [3] : [16] [WEB]`,
stages the verse, Send-to-Live mirrors John 3:16 to the audience; Psalms 23:1 via fill() too. Caught
& fixed a layout bug where the translation chip's `ml-auto` collapsed the Book input to 0 width.

Reviewer (independent, §7) = PASS-WITH-NITS; confirmed the reqId guard and live-resolve gating are
correct. Fixed: (1) skip resolve on incomplete range "16-" so no spurious "No verses" flash; (2)
combobox a11y on the Book input (role=combobox, aria-expanded/controls/activedescendant + option ids)
per §5.4; (3) caret-at-end via rAF on the digit-seed path. Left as documented/intentional: nearest =
canonical-first (Joshua before John for "j"), the genuinely EasyWorship-faithful reading of D.2 —
unit-tested. Added an e2e range assertion (verse "16-18" → 3-verse deck). E2e updated to drive the
three zones (Book locator uses {exact:true} to avoid the "Book suggestions" listbox name collision).

Addendum (same session): the field reset to Genesis 1:1 when switching mode tabs (Reference/
Card-picker/Keyword) or Source tabs (Scripture/Live Detect) and returning, because ReferenceMode
unmounts and its local zones reset. Fixed by seeding the zones from the currently-staged passage:
added pure `referenceDraft(verses)` to `scriptureDeck.ts` (+ tests); SearchPane memoizes it from
`staged` and passes `initial` to ReferenceMode, which seeds state/lastValid from it and skips the
default-resolve plus the redundant re-resolve when already staged (so the lead index is preserved
too). Verses picked in Card-picker/Keyword now also show in the field (one source of truth). Verified
by running (Romans 8:28 survives both tab round-trips) + new e2e tab-switch assertion. 261 unit · 23 e2e.

Addendum 2 (same session): "books don't get listed" bug — because the field is never empty, focusing
the Book zone (which already held a complete book like "Genesis") and typing APPENDED ("Genesis"+"p"
→ "pGenesis"), matching nothing, so the autocomplete never listed. Fixed with select-on-focus: each
zone selects its text on user focus (click/Tab) so typing replaces the segment; a `programmatic` ref
suppresses it during focusSeg moves (Backspace-to-previous keeps caret at end; the digit-seed rAF
keeps its caret). Verified by running (click "Genesis", type "p" → book "p", books list) + new e2e
regression assertion. 298 unit · 23 e2e green (unit count up as parallel AI work landed more tests).

Addendum 3 (same session): "verses don't load like EasyWorship" — Reference mode only showed the
single resolved verse; the operator wanted the WHOLE CHAPTER listed (browse + pick). Added a chapter
results list inside ReferenceMode: a getChapter load (keyed on book/chapter/abbr, cancelled-flag
guarded) renders all verses of the current chapter, the reference's verse(s) highlighted (aria-current)
and auto-scrolled into view; clicking a row stages that verse (`pickVerse`). Added `findExactBook`
to bookMatch (book lookup for getChapter; isExactBook now derives from it) + tests. SearchPane hides
the bottom ResultsList in reference mode (the chapter list replaces it; §1.9) — kept for picker/keyword.
Projection semantics unchanged (typed single verse / range still stage exactly that). E2e: chapter
list shows all 36 of John 3, 1 selected for a single verse, 3 selected for "16-18", click-to-stage,
and Chapter/Verse locators made {exact:true} (avoid the "Chapter verses" listbox name collision).
Verified by running (screenshot: "JOHN 3 · 36 verses", verse 16 highlighted + scrolled to).
Reviewer (independent, §7) = PASS-WITH-NITS; confirmed chapter-load race guards, no wrong-chapter
highlight, verse keystrokes don't refetch, persistence seeding, and a11y all correct. Fixed the
worthwhile nits: (2) translation-switch race — persist `scripture.defaultTranslation` BEFORE flipping
the chip so the chapter refetch reads the new translation; (3) moved `parseVerseRange` to scriptureDeck
(pure) + unit tests (single/range/empty/incomplete/reversed); (4) try/finally on the `programmatic`
focus guard so it can't leak; (5) `aria-current={isSel || undefined}` (omit when not current); plus
`pickVerse` now updates `lastValid` (blur-restore points at the picked verse). 317 unit · 23 e2e green.

Follow-up (NOT in scope, filed separately): TopBar and PresentPage each hold independent
`useActiveService()` instances that only sync at mount, so picking a service in the TopBar doesn't
refresh the Present Schedule / "Add to service" until remount. Recommend lifting to a shared
context/store. See [[active-service-shared-store]].
