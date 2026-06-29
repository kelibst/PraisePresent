# Stage 0 — Adopt sage-green brand
- **ID:** 2026-06-28_stage0-adopt-sage-brand
- **Phase:** 3/4 (UX revival)
- **Assigned agent type:** PM
- **Status:** done

## Goal
The approved `PraisePresent.dc.html` design uses a sage-green accent (`#6E9559`/`#9CBE82`). The user
chose to adopt it as the new brand. Update binding `CLAUDE.md §5.6` so the constitution and the
forthcoming token layer (B1) agree — no Golden-Rule drift (§1.9).

## Scope (files/areas)
- `CLAUDE.md` §5.6 — brand primary Deep Purple `#5E3B9E` → Sage Green `#6E9559` (+ `#9CBE82` accent).

## Rules that apply
- CLAUDE.md §5.6 (styling tokens), §1.9 (one way to do a thing).

## Acceptance criteria
- [x] §5.6 names sage green as brand primary, keeps "use the token, no hard-coded hex".
- [x] Change is dated + cross-referenced.

## Outcome
Updated §5.6: brand primary is now Sage Green `#6E9559` with accent `#9CBE82`, with a dated note
pointing at the design + this task. B1 will encode these as `--accent`/CSS-variable tokens.
