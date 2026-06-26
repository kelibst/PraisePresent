# T7 — Cross-platform packaging verification
- **ID:** 2026-06-26_t7-cross-platform-packaging-verify
- **Phase:** 0
- **Assigned agent type:** tester
- **Status:** pending

## Goal
Confirm the restructured, hardened, router-fixed build packages and runs on ≥2 OSes: window opens, theme applies, routing works, and no DevTools in the packaged build. This is the Phase 0 exit verification.

## Scope (files/areas)
- `npm run make` artifact; launch on Linux + Windows (macOS if available).

## Rules that apply
- CLAUDE.md §6 (done = it runs), §5.8 (testing)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t7

## Acceptance criteria
- [ ] Packaged app verified on ≥2 OSes
- [ ] Window opens; theme applies; routing works (B1 closed in packaged build)
- [ ] No DevTools in packaged build
- [ ] Results recorded in Outcome
- [ ] reviewer signed off

## Outcome (filled on completion)
<OSes tested, observations, screenshots/notes>
