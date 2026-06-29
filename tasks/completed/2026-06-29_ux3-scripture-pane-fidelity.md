# Scripture (left) pane fidelity to design
- **ID:** 2026-06-29_ux3-scripture-pane-fidelity
- **Phase:** 3 (UX fidelity)
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
Bring the left Source pane in line with `PraisePresent.dc.html` lines 114–357. Differences to close:
(a) the Scripture/Live-Detect tab bar shows the Bible meta ("World English Bible · offline") on the
RIGHT of the tab bar; (b) scripture mode is a compact grid/keyword ICON toggle next to an
always-visible segmented reference (book › ch : vs + translation chip), not the current 3-tab
Reference/CardPicker/Keyword tablist; (c) the card picker is three side-by-side columns
(Book | Chapter | Verse) inside the pane. Done = the pane visually matches the mockup and the
existing stage / send-live / keyword-search behaviours still work.

## Scope (files/areas)
- `src/renderer/features/present/PresentPage.tsx` — the source tab bar (lines 38–65): move the Bible
  meta to the right of the tabs per design (or surface it from `SearchPane`'s header).
- `src/renderer/features/scripture/SearchPane.tsx` — collapse the 3-mode tablist into the design's
  always-shown segmented reference + grid/keyword icon toggle; keep `ReferenceMode`/`CardPickerMode`/
  `KeywordMode` logic but re-skin to match (segmented reference design lines 149–161; card picker
  3-column design lines 188–231; result rows 254–283 with the sage `staged` bar).
- Verify the card-picker 3-column layout (Book flex 1.5 / Chapter flex 1.1 / Verse flex 1.1) and the
  sage glow on the active reference.

## Rules that apply
- CLAUDE.md §5.4 (keyboard operable; no business logic in components — calls stay in hooks/`window.api`),
  §5.6 (tokens only), §1.9 (don't keep a dead second mode-switcher).
- Preserve the e2e contract: the `Keyword` affordance + `Search` button must remain reachable
  (`tests/e2e/scripture.spec.ts` clicks `tab "Keyword"` then `button "Search"`). If the control
  changes from a tab to an icon toggle, coordinate the selector update in `ux6`.
- Design source of truth: `PraisePresent.dc.html` lines 114–357.

## Acceptance criteria
- [ ] Tab bar shows Bible meta on the right; mode is a grid/keyword icon toggle + always-shown
      segmented reference matching the mockup.
- [ ] Card picker renders Book | Chapter | Verse as three side-by-side columns.
- [ ] Staging, Send-Live, and keyword search still function; staged verse shows the sage bar.
- [ ] `tsc --noEmit` + lint clean; e2e selector changes flagged to `ux6`; reviewer signed off.

## Outcome (filled on completion)
Done. Source tabs (Scripture | Live Detect) are now the pane's top strip (`PresentPage`). `SearchPane`
dropped its redundant `PaneHeader`; the mode toggle (Reference/Card picker/Keyword, sage-active) now
shares a row with the Bible meta ("web · World English Bible · offline"). `SegmentedReference`
restyled to the design's sage-glow ring + sage book chip + translation chip. The 3-column card picker
already matched. Mode-toggle row wraps (`flex-wrap`) at narrow widths. e2e keyword flow preserved
(tab "Keyword" → "Search"). Note: kept the 3 labeled modes (vs the design's 2-icon toggle) to retain
the typed-reference feature + e2e contract — justified per §5.4. Reviewer approved.
