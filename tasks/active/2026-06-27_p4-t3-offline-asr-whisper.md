# P4-T3 — Offline mode: whisper.cpp ASR + model download manager
- **ID:** 2026-06-27_p4-t3-offline-asr-whisper
- **Phase:** 4
- **Assigned agent type:** implementer
- **Status:** blocked (needs whisper.cpp sidecar/binding + model files)

## Goal
Local ASR via whisper.cpp (tiny/base/small, user-selectable) as a sidecar or napi-rs binding behind a stable interface (R6). Feed transcripts to the T1 deterministic extractor; resolve via local SQLite/FTS5. Model download manager in Settings. **Zero network calls in offline mode (asserted in test).**

## Blocked on
whisper.cpp binary/binding + GGUF model files; observed-audio verification. Bars: explicit recall ≥0.85, resolution precision ≥0.95, latency <4s. The T1 text extractor is the shared extraction stage — this task only adds the audio→text front end + model management.

## Rules
§1.5/§5.5/§5.7, R6 (Rust/sidecar behind stable interface), spec §4.

## Outcome update (2026-06-28 — interface landed; binary deferred)
The stable ASR interface landed under task `2026-06-28_a4a6-audio-search-plumbing` (A4 half).
`src/main/services/localAsr.ts` defines `LocalAsr` (`agentId`, `isInstalled()`, `modelStatus()`,
`transcribe(pcm: Int16Array): Promise<string>`) plus the shipped `NullLocalAsr` stub: it reports
`isInstalled() === false`, derives its model state from the registry (`whisper-local` → `absent`), and
`transcribe()` rejects with a typed "model not installed" error rather than faking an empty
transcription or crashing (§5.7). The model-download manager is surfaced via `ai:modelStatus` (read) and
`ai:downloadModel` (a no-op stub returning a clear "not available in this build" status). No network, no
child process, no native dep ships yet. **Still blocked** on the actual whisper.cpp sidecar/binding +
GGUF weights and the observed-audio accuracy/latency bars — when those land, swap the concrete `localAsr`
export for the real backend; nothing downstream (orchestrator, IPC, UI) needs to change.

## Update (2026-06-29 — whisper sidecar + model manager landed)
The real backend landed under `2026-06-29_p4-whisper-sidecar-model-manager`: `WhisperLocalAsr` over a whisper-cli sidecar + an `AsrSession` adapter (capped rolling-window buffer), and a real GGUF download manager (progress, verify, atomic install) wired to `ai:model-status`/`ai:download-model` + a Settings download UI. Binary via `PRAISEPRESENT_WHISPER_BIN`/resources. Still pending: live verify with a real binary + zero-egress assertion + offline accuracy bars.
