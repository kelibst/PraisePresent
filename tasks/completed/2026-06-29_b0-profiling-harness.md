# Profiling harness + low-end emulation baseline
- **ID:** 2026-06-29_b0-profiling-harness
- **Phase:** 5 (rendering re-architecture)
- **Assigned agent type:** tester
- **Status:** done

## Goal
A repeatable way to measure the audience render path under throttled low-end
conditions (CPU 6× slowdown, software GL) and record target metrics: slide-advance
input→state latency, IPC bytes per transport action, transition smoothness, peak RSS.
Decisions for B5/B6 are gated on these numbers (prompt.md §0/§4).

## Scope (files/areas)
- scripts/profile-present.md — how to run with throttling + what to record
- tests/e2e/present-perf.spec.ts — measures IPC payload size before/after the
  deck/cursor split, and slide-advance latency, asserting a regression budget.

## Rules that apply
- CLAUDE.md §5.8 (tests), §5.7 (fail safe). Phase brief: plan/prompt.md §3,§5 (B0).

## Acceptance criteria
- [x] e2e harness measures cursor-only payload size after split (proves O(cursor)).
- [x] Documented manual throttling recipe for RSS/fps on real low-end specs.
- [ ] Numbers recorded on actual 8GB/iGPU hardware (PENDING real device — owner).

## Outcome (filled on completion)
Added `tests/e2e/present-perf.spec.ts` asserting an advance broadcasts a small
cursor payload (not the whole deck) and the deck is sent once. Manual RSS/fps recipe
in `scripts/profile-present.md`. Real-hardware numbers still need a physical low-end
box; emulated CPU-6× recipe documented for CI-less local runs.
