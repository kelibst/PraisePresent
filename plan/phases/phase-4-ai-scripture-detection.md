# Phase 4 — AI Auto-Scripture Detection (PM Brief)

> **Goal:** detect when a speaker references Scripture (spoken or typed) and surface the correct verse(s) for the operator — in **online** and **offline** modes — built on the Phase 3 scripture domain. **Human-in-the-loop by default** (never auto-project a wrong verse onto the congregation).

**Effort:** ~8 weeks · **Branch prefix:** `phase4/`

---

## Entry gate
- Phase 3 MVP green — crucially the **scripture domain** (`ScriptureService.resolve/search` + local Bible) exists; the AI feature sits *in front of* it and must not duplicate Bible logic.

## PM start sequence
1. Read this brief and **[`../ai-scripture-detection-spec.md`](../ai-scripture-detection-spec.md) in full** (it is the technical spec, now in the `plan/` folder; this brief is the execution wrapper). Also `CLAUDE.md` §1.3/§1.7/§5.7, and the `claude-api` reference before any LLM work (§ spec 3.2).
2. Audit CAMS. 3. Decompose per the spec's pipeline. Online first (faster to validate), then offline, then the accuracy harness gating both.

---

## Task breakdown

### T1 — `AIScriptureDetector` orchestrator + IPC `[implementer + security]`
- **Scope:** `src/main/services/AIScriptureDetector.ts` orchestrates ASR → extractor → resolver → confidence filter; `ai:*` IPC (`startListening`/`stopListening`/`submitText`/`setMode`/`status` + `onCandidates` event stream); renderer "Live Detect" panel in `features/presentation/`.
- **Rules:** §1.3, §5.2, §5.3. **Done:** typed-text input → detected reference appears in the operator review queue → one-click stages to the existing projection path; mode switch wired.

### T2 — Online mode `[implementer + security]` (spec §3)
- **Scope:** streaming cloud STT with book-name vocabulary biasing; **Claude (Anthropic API) with tool use** returning the structured `report_scripture_references` schema; resolve via `ScriptureService`. API keys from OS secure storage (Phase 2); CSP `connect-src` adds STT + Anthropic hosts; calls originate **only in main**.
- **Rules:** §1.7, §5.2; follow `claude-api` reference for model id / tool use / streaming. **Done:** spoken explicit references ("John three sixteen") detect + resolve correctly online; latency < 2 s (explicit); keys never reach renderer; security sign-off on transport + secrets.

### T3 — Offline mode `[implementer]` (spec §4)
- **Scope:** **whisper.cpp** local ASR (tiny/base/small, user-selectable) as **sidecar or napi-rs**; deterministic offline extractor (spoken-number normalization + fuzzy/phonetic **book-alias table** + reference grammar); resolve via local SQLite/FTS5; optional embedding index for quotation matching. Model **download manager** in settings.
- **Rules:** §1.5, §5.5, §5.7, R6 (Rust/sidecar behind stable interface). **Done:** with **network disabled**, explicit references detect + resolve; latency < 4 s (explicit); offline makes **zero network calls** (asserted in test).

### T4 — Auto-degrade + privacy + safety `[security]`
- **Scope:** seamless online→offline fallback on connectivity loss (no operator action); explicit **opt-in + on-screen indicator + kill-switch** for online (audio leaves device); transcript-only option; **operator-confirmed projection by default**, auto-project only above a high confidence threshold.
- **Rules:** §1.7, §5.7. **Done:** pulling the network mid-session silently falls back; kill-switch verified; default config never auto-projects.

### T5 — Accuracy & latency harness `[tester]` (spec §6.3) — gates the phase
- **Scope:** labeled sermon-audio eval corpus (~5–10 h, varied accents/phrasing); metrics = reference precision/recall/F1, resolution precision, latency, book-name WER, **false-positives/min**; per-build dashboard + **CI regression gate**; adversarial set (near-miss book names, noise, rapid multi-reference). Capture operator overrides as new labeled data (with consent).
- **Rules:** §5.8. **Done:** harness runs in CI; acceptance bars (below) met in both modes; regressions block merge.

---

## Acceptance bars (from spec §6.3)
| | Online | Offline (Standard) |
|---|---|---|
| Explicit-reference recall | ≥ 0.92 | ≥ 0.85 |
| Resolution precision | ≥ 0.97 | ≥ 0.95 |
| False positives | < 0.2 / min | < 0.3 / min |
| Latency (explicit) | < 2 s | < 4 s |

## Verification & review
- PM confirms both modes meet the bars on the eval corpus; `security` signs off on online transport, secrets, privacy controls, and the zero-egress offline guarantee; UI reviewed running.

## Exit gate (advance to Phase 5 when ALL true)
- [ ] Online + offline detection meet all acceptance bars (T5 harness, in CI).
- [ ] Auto-degrade online→offline verified; offline proven zero-egress.
- [ ] Privacy opt-in + indicator + kill-switch working; default is operator-confirmed (no silent auto-project).
- [ ] Reuses `ScriptureService` (no duplicated Bible logic); any Rust/sidecar behind a stable interface.
- [ ] CAMS tasks closed; PM synthesis reported.

## Risks (`docs/revival/06-risk-assessment.md`)
- **R8** wrong verse projected → human-in-the-loop default, precision-tuned, FP/min gate. **R9** offline accuracy → selectable models + deterministic explicit path + field pilot. **R10** latency → streaming + rolling windows. **R11** privacy → offline default, opt-in online, zero-egress test. **R12** cloud cost/availability → VAD-gated capture + auto-degrade.
