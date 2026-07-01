# P4 — Live audio spine + cloud STT (Deepgram + AssemblyAI)
- **ID:** 2026-06-29_p4-live-audio-cloud-stt
- **Phase:** 4
- **Assigned agent type:** implementer + security
- **Status:** in-progress — implementation + review complete; live verification pending (needs a real Deepgram/AssemblyAI key + mic)

## Goal
Stand up the missing **audio spine** so `startListening` actually produces transcripts and
detected candidates end-to-end, and wire two paid cloud STT engines behind it so the operator can
test online detection. Mic audio is captured in the renderer (the one allowed Web API, §5.2),
streamed as 16 kHz mono PCM to main, run through the active agent's ASR session, and the resulting
transcript flows into the EXISTING deterministic detector → `scriptureService.resolve` → review
queue. No new LLM work (extraction stays deterministic; the Claude extractor is untouched).

Done = with a Deepgram **or** AssemblyAI key stored (safeStorage, main-only), pressing **Start** in
Live Detect transcribes live speech, detected references appear as candidates, and one-click sends
them to the shared deck. Cloud WS connections originate ONLY in main; the key never reaches the
renderer.

## Scope (files/areas)
- `src/shared/constants/channels.ts` — `ai:audio-frame` (renderer→main stream), `ai:status-changed` (main→presenter push)
- `src/shared/schemas/ai.ts` — audio-frame payload schema; reuse `transcriptSegment`/`aiStatus`
- `src/preload/index.ts` + `api.d.ts` — `ai.sendAudioFrame(pcm, sampleRate)`, `ai.onStatus(cb)`
- `src/main/services/asrSession.ts` — `AsrSession` interface + backend factory
- `src/main/services/cloud/deepgramAsr.ts`, `cloud/assemblyAiAsr.ts` — WS clients (injected WebSocket ctor)
- `src/main/services/aiScriptureDetector.ts` — open/close session on start/stop, route `pushAudio`, emit transcript+candidates, push status changes
- `src/main/ipc/aiHandlers.ts` — `ipcMain.on(ai:audio-frame)` → `pushAudio`; status push registration
- `src/main/index.ts` / windowManager — mic `setPermissionRequestHandler`; CSP connect-src += STT hosts
- `src/renderer/features/ai/pcm.ts` (pure), `audioCapture.ts`, `useAiConsole.ts` — capture + lifecycle + device enumeration

## Rules that apply
- §1.3 (no privileged power in renderer — WS + keys in main only), §1.7 (secrets main-only), §1.4 (CSP/permission allow-lists)
- §5.2/§5.3 (typed zod IPC boundary), §5.7 (fail safe — a session error never crashes the live service, falls back cleanly)
- R8 (human-in-the-loop — live candidates go to the PRESENTER review queue only, never auto-project), R11/R12 (privacy/cost — VAD/opt-in, kill-switch, auto-degrade)
- Phase brief: plan/phases/phase-4-ai-scripture-detection.md#T2, #T4; spec §3, §7

## Acceptance criteria
- [x] Deepgram and AssemblyAI both transcribe behind the shared `AsrSession` interface (impl + parser tests)
- [x] Key stored via safeStorage; value never crosses the bridge; WS opened in main only (security signed off)
- [x] Mic permission gated by an explicit allow-list; CSP left unchanged (main-only sockets aren't CSP-governed — least privilege)
- [x] A cloud session error flips listening off with a clear status (no crash); kill-switch hard-stops; a dropped socket auto-degrades to offline
- [x] Unit tests: pcm convert (pure), Deepgram + AssemblyAI message parsers, session routing, live transcript→candidate path
- [x] reviewer (APPROVE) + security (SIGN-OFF) signed off
- [ ] Start → live transcript visible; explicit refs detect + resolve + queue — **needs a real key + mic (user to verify live)**

## Outcome (2026-06-29 — implementation + review complete)
Built the full provider-agnostic audio spine: renderer mic capture (`pcm.ts` pure + `audioCapture.ts` getUserMedia→16kHz mono PCM→`ai:audio-frame` IPC, lifecycle in `useAiConsole`), main `AsrSession` interface + `streamingClient` base, real Deepgram + AssemblyAI WebSocket clients (main-only, key from safeStorage, injected WebSocket ctor for tests), orchestrator wiring (`startListening` opens a session/`stopListening` closes/`pushAudio` routes frames), live transcript→`detectReferences`→`scriptureService.resolve`→presenter review queue, and `ai:status-changed` push for main-initiated changes. Mic-only permission allow-list added (previously Electron granted all). Auto-degrade now genuinely triggers (dropped cloud socket → offline default). Auto-project guard wired via a shared pure gate (renderer projects highest-confidence candidate when enabled+threshold; default never projects — R8).

**Review fixes applied:** AssemblyAI key-in-URL never logged; whisper buffer capped (no OOM); default local agent reflects real install state; dead `emit*` methods removed; `setApiKey` wrapped.

**Remaining to fully close:** observe the live loop with a real Deepgram/AssemblyAI key + mic; the accuracy/latency acceptance bars (recall/precision/FP-per-min/latency) are gated by the T5 eval-corpus harness, still pending. tsc + eslint clean; 298 unit tests pass; e2e specs updated for the new behavior (need a CI run on a built app — not runnable in this headless env).
