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

Follow-up (NOT in scope, filed separately): TopBar and PresentPage each hold independent
`useActiveService()` instances that only sync at mount, so picking a service in the TopBar doesn't
refresh the Present Schedule / "Add to service" until remount. Recommend lifting to a shared
context/store. See [[active-service-shared-store]].
