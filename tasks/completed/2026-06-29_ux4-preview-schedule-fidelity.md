# Preview + Schedule (middle) pane fidelity to design
- **ID:** 2026-06-29_ux4-preview-schedule-fidelity
- **Phase:** 3 (UX fidelity)
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
Align the middle pane with `PraisePresent.dc.html` lines 361–478. Differences to close: (a) the
`BackgroundEditor` is a panel TOGGLED by a background icon button next to "Send to Live", not always
visible inline; (b) an "Up next · <song/title>" label + an "Edit text" affordance sits above the
preview card; (c) the Send-to-Live / Set-as-Next / background-toggle button row matches the mockup;
(d) schedule items use the design styling (media icon chip, tabular-nums durations, sage active bar
on the live item, dashed "Add item"). Done = the pane matches the mockup and Send-Live / Set-Next /
background editing still work through the existing callbacks.

## Scope (files/areas)
- `src/renderer/features/scripture/PreviewSchedulePane.tsx` — gate `BackgroundEditor` behind a toggle
  button in the controls row (design lines 401–422); add the "Up next ·" + "Edit text" header (lines
  366–384); restyle the Send-to-Live (flex-1) / Set-as-Next / bg-toggle button row; restyle schedule
  rows (lines 426–478) — media-icon chip, `tabular-nums` durations, sage `border-l` on the active
  item, dashed Add-item.
- `src/renderer/features/present/BackgroundEditor.tsx` — adapt to render inside the toggled panel
  (5 swatches flex-1 + native color input + media picker + "Apply to all slides" toggle); no logic
  change to `setBackground`.

## Rules that apply
- CLAUDE.md §5.4 (no business logic in components), §5.6 (tokens only), §1.9 (no duplicate bg editor).
- Keep the `present.setBackground` / `setDeck` / `setAsNext` wiring exactly (these are `usePresentDeck`
  callbacks threaded down) — this is a re-skin + toggle, not a behaviour change.
- Design source of truth: `PraisePresent.dc.html` lines 361–478.

## Acceptance criteria
- [ ] `BackgroundEditor` is hidden until its toggle button is pressed; toggle matches the mockup.
- [ ] "Up next ·" label + "Edit text" affordance present above the preview card.
- [ ] Schedule rows match design (icon chip, tabular durations, sage active bar, dashed Add-item).
- [ ] Send-to-Live / Set-as-Next / background editing all still work.
- [ ] `tsc --noEmit` + lint clean; reviewer signed off.

## Outcome (filled on completion)
Done. `BackgroundEditor` is now gated behind an image-icon toggle in the controls row (hidden until
opened). Added the "Up next · <reference>" label above the preview card. Controls row (Send to Live
flex-1 / Set as Next / bg-toggle) wraps at narrow widths. Schedule rows already used the design
`ScheduleRow` styling. `setBackground`/`setDeck`/`setAsNext` wiring unchanged. Reviewer approved.
