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

## Update (2026-06-28)
The **LLM extraction half** of this task landed under `tasks/active/2026-06-28_a2a3-online-extractor-privacy.md`: `onlineScriptureExtractor.ts` (Claude tool-use behind an injected `AnthropicClient`, model `claude-haiku-4-5`, resolves via `scriptureService`, drops unresolved), safeStorage key channels (`ai:setApiKey`/`ai:hasKey`/`ai:clearApiKey`, value never reaches the renderer), and the Anthropic host on CSP `connect-src`. Still deferred here: real streaming cloud STT **audio capture** (the ASR front-end) and a live API call with a real key.

## Update (2026-06-29 — STT audio capture landed)
The remaining ASR front-end landed under `2026-06-29_p4-live-audio-cloud-stt`: live mic capture (renderer) → `ai:audio-frame` PCM stream → main `AsrSession` → real Deepgram + AssemblyAI streaming clients → transcript → the existing detector. Keys main-only; sockets main-only. Still pending: live verification with a real key + the T5 accuracy bars.
