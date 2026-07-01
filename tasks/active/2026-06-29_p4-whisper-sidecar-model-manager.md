# P4 — Whisper.cpp local sidecar + GGUF model download manager
- **ID:** 2026-06-29_p4-whisper-sidecar-model-manager
- **Phase:** 4
- **Assigned agent type:** implementer
- **Status:** in-progress — implementation + review complete; live verification pending (needs a whisper-cli build via PRAISEPRESENT_WHISPER_BIN)

## Goal
Replace the `NullLocalAsr` stub with a REAL offline ASR backend: whisper.cpp run as a child-process
**sidecar** (mirrors `transcodeSidecar.ts`), fed 16 kHz mono PCM via the same audio spine as the cloud
path, producing transcripts for the EXISTING deterministic detector. Add a real **model download
manager** that fetches a GGUF model (tiny ~75 MB / base ~142 MB / small ~466 MB, user-selectable) into
`userData`, with progress, behind the already-stable `ai:model-status` / `ai:download-model` IPC. Zero
network calls once installed (offline-safe by construction).

The whisper **binary** is resolved like ffmpeg: `process.resourcesPath` when packaged, else a
configured path / PATH lookup in dev. When the binary or weights are absent the model status reports a
clear, actionable reason (never fakes "ready", never crashes — §5.7).

## Scope (files/areas)
- `src/main/services/whisperAsr.ts` — `LocalAsr` impl + `AsrSession` adapter (rolling-window sidecar)
- `src/main/services/modelManager.ts` — download GGUF → userData, progress, verify, list installed
- `src/main/services/localAsr.ts` — export the real backend when present, fall back to `NullLocalAsr`
- `src/main/services/aiScriptureDetector.ts` — `downloadModel`/`modelStatus` delegate to the real manager
- whisper binary resolution (resources/PATH/config), reuse the spine's `pushAudio` routing

## Rules that apply
- §1.5 (truth in SQLite for installed-model state where persisted), §5.5, §5.7 (fail safe)
- R6 (Rust/sidecar behind a stable interface — the interface already exists in `localAsr.ts`)
- Phase brief: plan/phases/phase-4-ai-scripture-detection.md#T3; spec §4

## Acceptance criteria
- [x] Model download manager fetches a GGUF with progress; verifies (min-size + atomic `.part` rename); reports installed (unit-tested w/ mock fetch)
- [x] Binary-absent / weights-absent paths report a clear status; no crash, no fake-ready
- [x] Offline path makes zero network calls once installed (download is the only egress, explicit + operator-driven)
- [x] Unit tests: model manager (mock fetch happy/too-small/non-OK), WAV encode, output cleaning, windowed+capped session
- [x] reviewer (APPROVE) + security (SIGN-OFF) signed off
- [ ] With network disabled, explicit references detect + resolve via the local path — **needs a whisper-cli build (user to verify live)**

## Outcome (2026-06-29 — implementation + review complete)
`whisperAsr.ts`: real `LocalAsr` over a whisper-cli child-process sidecar (mirrors `transcodeSidecar`) + an `AsrSession` adapter that buffers PCM into rolling ~5 s windows behind a CAPPED chunk queue (sheds oldest beyond 3 windows — a renderer can't OOM main). Binary resolved from `PRAISEPRESENT_WHISPER_BIN` (dev) or `resources/whisper-cli` (packaged); model weights from `modelManager.ts` (downloads ggml tiny/base/small into userData with progress, verify, atomic install). `ai:model-status`/`ai:download-model` now drive the real manager; a "Local model" Download section appears in Settings → AI & Privacy for any offline-local agent. WAV encode + output cleaning + windowing + the cap are unit-tested; the spawn path is wired but needs a real binary to observe.

**Remaining to fully close:** build whisper.cpp, point `PRAISEPRESENT_WHISPER_BIN` at it, download a model, and observe an offline detect (+ assert zero egress with a network mock); the offline accuracy/latency bars are gated by the T5 harness.

**Known follow-up (noted, not blocking):** the `claude` agent is modelled as a transcription agent but is an extraction (not STT) engine — a registry cleanup for a later task; and the `praisepresent-local` registry `installed:true` flag is now a static descriptor while real availability is runtime-gated on the whisper model.
