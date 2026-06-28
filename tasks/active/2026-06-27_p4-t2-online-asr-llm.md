# P4-T2 — Online mode: cloud STT + Claude tool-use extraction
- **ID:** 2026-06-27_p4-t2-online-asr-llm
- **Phase:** 4
- **Assigned agent type:** implementer + security
- **Status:** blocked (needs STT + Anthropic API keys; calls only from main)

## Goal
Streaming cloud STT (book-name vocabulary biasing) → rolling transcript windows → Claude (Anthropic API, tool use, `report_scripture_references` schema) → resolve via `scriptureService`. Keys from OS secure storage (Phase 2 safeStorage); CSP `connect-src` adds STT + Anthropic hosts; all network in MAIN. Sits in front of the T1 detector (shares the resolve + review-queue path).

## Blocked on
Real STT + Anthropic API keys and a way to exercise them. Read the `claude-api` skill before any LLM work (model id / tool use / streaming). Bars: explicit recall ≥0.92, resolution precision ≥0.97, latency <2s.

## Rules
§1.7 (secrets main-only, never renderer), §5.2/§5.3, spec §3. Security sign-off on transport + secrets.
