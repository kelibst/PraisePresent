# PraisePresent — Phase Plan (PM Briefs)

This folder is the **plan of record**. Each file is a complete instruction set for the **Project Manager (PM) agent** to execute one phase by spawning and coordinating specialist agents, per **[CLAUDE.md](../../CLAUDE.md)**.

## How the PM uses these briefs

For every phase, the PM follows the CLAUDE.md §2 loop:

1. **Read first** — this brief, `CLAUDE.md`, the relevant `revival/` docs, and the actual code in scope.
2. **Audit CAMS** — read all of `tasks/active/` and `tasks/completed/`; never duplicate or regress.
3. **Decompose** — turn the brief's task list into atomic CAMS task files in `tasks/active/`, each with scope, applicable CLAUDE.md rules, and acceptance criteria.
4. **Assign** — hand each task to the specialist type named in the brief. Implementer ≠ reviewer.
5. **Verify** — assign reviewers (and `security` for main/IPC/config/secrets); run the **exit gate**.
6. **Close** — move tasks to `tasks/completed/` with outcomes; report one synthesis to the user.
7. **Gate** — do not start the next phase until this phase's exit gate is green (CLAUDE.md §6, `revival/06-risk-assessment.md` §4).

## Phases

| Phase | Brief | Outcome | Approx. effort |
|---|---|---|---|
| 0 | [phase-0-stabilize-and-restructure.md](phase-0-stabilize-and-restructure.md) | Correctly-packaged baseline **+ full repo restructure** | Week 1–2 |
| 1 | [phase-1-toolchain.md](phase-1-toolchain.md) | Modern TS/ESLint/CI | Week 2–3 |
| 2 | [phase-2-foundation.md](phase-2-foundation.md) | Typed IPC + SQLite + dual-window + test harness | Week 4–8 |
| 3 | [phase-3-domains.md](phase-3-domains.md) | Functional MVP (scripture, presentation, songs, media, planning) | Week 9–22 |
| 4 | [phase-4-ai-scripture-detection.md](phase-4-ai-scripture-detection.md) | Online + offline AI auto-scripture detection | Week 23–30 |
| 5 | [phase-5-hardening-release.md](phase-5-hardening-release.md) | Signed, auto-updating v1.0.0 | Week 31–36 |

Durations assume 1–2 developers; scale by team size. Phases gate sequentially — **0 → 1 → 2** are hard prerequisites for any feature work.

## Conventions for every brief

- **Entry gate** — what must already be true to start.
- **Tasks** — atomic units with: suggested agent type · file scope · applicable CLAUDE.md rules · acceptance criteria.
- **Verification & review** — how the PM proves the phase works.
- **Exit gate** — the binary condition to advance.
- **Risks** — cross-referenced to `revival/06-risk-assessment.md`.
