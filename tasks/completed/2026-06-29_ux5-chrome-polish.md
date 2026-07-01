# Top bar + status bar chrome polish to design
- **ID:** 2026-06-29_ux5-chrome-polish
- **Phase:** 3 (UX fidelity)
- **Assigned agent type:** implementer
- **Status:** pending

## Goal
The shell chrome is already close; this closes the remaining cosmetic gaps vs
`PraisePresent.dc.html` lines 28–60 (top bar) and 1085–1098 (status bar). (a) Service selector:
restyle to the design button — sage calendar icon + label + chevron, `#10182a`/`pp-surface` tokens
(today it's a bare shadcn `<Select w-56>`); (b) Search: cap at `max-w-[440px]` and match the
`#0c1322`/`#1b2440` field styling with the ⌘K chip; (c) LIVE/Black pills: confirm exact sage tokens +
pulsing dot; (d) Status bar: add the green "connected" dot and match the text format
("Audience: Display 2 connected · 1080p · 60fps", "Bible: WEB (bundled, offline)", "Live Detect: …",
"v0.1.0"). Done = top bar and status bar match the mockup pixel-intent; no behaviour change.

## Scope (files/areas)
- `src/renderer/components/layout/TopBar.tsx` — service selector styling (lines 112–130; add the
  calendar icon + chevron, design colors via tokens); search input `max-w-[440px]` + field styling
  (lines 132–145); verify LIVE/Black pill tokens (158–186).
- `src/renderer/components/layout/StatusStrip.tsx` — green connected dot + design text format
  (lines 79–111).
- Keep the `CommandPalette` open-on-click behaviour and `useActiveService` wiring unchanged.

## Rules that apply
- CLAUDE.md §5.6 (tokens only — `pp-surface-*`, `pp-accent`, `pp-success`; no hex), §5.4 (no
  behaviour change), §1.9 (no duplicate controls).
- Design source of truth: `PraisePresent.dc.html` lines 28–60 (top bar), 1085–1098 (status bar).

## Acceptance criteria
- [ ] Service selector matches design (calendar icon + chevron + tokened styling).
- [ ] Search input capped at `max-w-[440px]` with the design field styling + ⌘K chip.
- [ ] Status bar has the green connected dot and the design text format.
- [ ] CommandPalette + service switching behaviour unchanged.
- [ ] `tsc --noEmit` + lint clean; reviewer signed off.

## Outcome (filled on completion)
Done. `TopBar`: service selector gained a sage calendar icon; search capped at `max-w-[440px]`; the
red destructive "Black" button became a design-neutral surface button with a "B" kbd chip; LIVE pill
tokens confirmed. `StatusStrip`: green connected dot (replacing the Monitor icon) + design text
("Audience: … connected · <res>", "Bible: WEB (bundled, offline)"). CommandPalette + service-switch
behaviour unchanged. Unused `Monitor` import dropped. Reviewer approved.
