# P3-D2 — Presentation engine
- **ID:** 2026-06-26_p3-d2-presentation-engine
- **Phase:** 3
- **Assigned agent type:** implementer + reviewer + tester
- **Status:** pending

## Goal
Slide model + renderer; transitions (fade/cut/dissolve) at ≥30 fps; presenter preview (current + next); live controls + keyboard shortcuts (§5.4); black/blank/clear from main.

## Scope
- Extend the Phase 2 present:* model: slide deck, transitions, presenter preview pane, keyboard live controls. `src/renderer/features/presentation/`.

## Rules
- §5.4 (keyboard, operated under pressure), §5.7 (fail safe to black). Perf budget in CI (transition fps).

## Acceptance
- [ ] a deck presents dual-screen with transitions ≥30 fps
- [ ] keyboard navigation covers all live controls
- [ ] audience fails safe to black
- [ ] reviewer sign-off; UI **observed running**

## VERIFICATION LIMIT
- Transition fps + visual smoothness need observed/visual verification (and ideally a 2nd display).

## Outcome
