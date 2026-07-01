# Fix: local whisper ASR falls behind real-time, dropping live audio
- **ID:** 2026-07-01_whisper-realtime-latency-fix
- **Phase:** 4
- **Assigned agent type:** implementer
- **Status:** done

## Goal
Operator reported `Whisper transcription is falling behind; dropping oldest audio` flooding
the log as soon as listening starts — meaning speech (and any scripture reference in it) was
being silently lost. Root cause: the `small` GGUF model's audio encoder alone consumes nearly
the whole 5s rolling-window budget, leaving no margin once real Electron CPU contention and
per-window process/model-reload overhead are added.

## Scope (files/areas)
- `src/main/services/modelManager.ts` — `installedModel()` now prefers `base` (the app's own
  `DEFAULT_WHISPER_MODEL`) → `tiny` → `small` (was `small` → `base` → `tiny`, "prefer larger =
  more accurate" — never benchmarked against the live-window latency budget).
- `src/main/services/whisperAsr.ts` — `runWhisperOnce()` now runs whisper-cli with greedy
  decoding (`-bs 1 -bo 1 -nf`) instead of the CLI's default beam-size 5 / best-of 5.

## Rules that apply
- CLAUDE.md §5.7 (fail-safe — dropped audio is a silent data-loss mode), §5.8 (bug fix →
  verify first)
- Phase brief: plan/phases/phase-4-ai-scripture-detection.md#T3 (offline latency < 4s)

## Acceptance criteria
- [x] Benchmarked tiny/base/small × beam-5/greedy on the same ~9.3s synthesized utterance
      (Windows SAPI TTS): small = 4.36–4.76s (razor-thin for a 5s window under load), base =
      1.36–1.57s, tiny = 0.79–0.85s. All three transcribed the test utterance correctly.
- [x] Re-verified on a real ~5s window (base + greedy): 1.64s total — ~3.4s of margin.
- [x] Full unit suite: 335/336 pass — same pre-existing, unrelated `modelManager.test.ts`
      path-separator failure noted in the prior comma-punctuation fix task (confirmed via
      `git stash` against HEAD before any of today's changes).
- [x] `tsc --noEmit` clean, eslint clean on changed files.
- [ ] reviewer sign-off (not yet assigned — flag for PM/user before merge)

## Outcome
Two small, low-risk changes (a preference-order swap + CLI flags), no schema/IPC/API change.
Not committed (§5.10, commit on request). The operator's `small` model is left on disk
(unused now that `base`/`tiny` are also installed) — not deleted without being asked; ~487 MB
reclaimable if desired.
