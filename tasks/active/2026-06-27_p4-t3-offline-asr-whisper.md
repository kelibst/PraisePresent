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
