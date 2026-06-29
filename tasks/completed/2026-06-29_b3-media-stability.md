# Media stability — memoized keyed layers
- **ID:** 2026-06-29_b3-media-stability
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** implementer
- **Status:** done

## Goal
A cursor-only move (or an edit to a different slide) must never remount/restart a
`<video>`/`<img>`. Key the slide layer by slide id and the media element by its url, and
`React.memo` the layer so a re-render that doesn't change the slide's media leaves the
element mounted. The deck/cursor split (B1) is the root fix (deck array identity is now
stable across cursor ticks); memoization is belt-and-suspenders.

## Scope (files/areas)
- src/renderer/features/presentation/AudienceView.tsx — `React.memo` Layer; media keyed by url

## Rules that apply
- CLAUDE.md §5.4 (no business logic in components), §5.7 (fail safe). prompt.md §3 (B3).

## Acceptance criteria
- [x] Layer is `React.memo`; media keyed by url so identical media never remounts.
- [x] Background-edit on slide X does not remount slide Y's media (stable deck ref).
- [x] tsc clean; tests green.

## Outcome (filled on completion)
The slide layer is a memoized component; `<video>`/`<img>` carry `key={url}`. Combined
with B1's stable cached-deck reference, an index-only cursor change no longer churns the
media elements of slides that didn't change.
