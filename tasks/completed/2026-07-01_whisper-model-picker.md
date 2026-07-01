# Feature: operator-selectable whisper model (download / use / delete)
- **ID:** 2026-07-01_whisper-model-picker
- **Phase:** 4
- **Assigned agent type:** implementer
- **Status:** done

## Goal
Following the real-time latency fix (`2026-07-01_whisper-realtime-latency-fix.md`), the
operator asked to be able to choose which whisper model (tiny/base/small) to download and
use, rather than the app silently auto-picking one. Added a full model-choice surface:
download any variant, pin a specific one ("use this"), delete a variant to free disk space,
or leave it on "Automatic" (the existing base→tiny→small preference order).

## Scope (files/areas)
- `src/shared/schemas/ai.ts` — `whisperModelId`, `whisperModelInfo`, `whisperModelsStatus`
  schemas + types; `WHISPER_PREFERRED_MODEL_KEY` settings-key constant (mirrors
  `scripture.ts`'s `DEFAULT_TRANSLATION_KEY`); `aiDownloadModel` gained an optional
  `modelId`; added `aiSetPreferredModel`, `aiDeleteModel`.
- `src/shared/constants/channels.ts` — 3 new channels: `ai:list-models`,
  `ai:set-preferred-model`, `ai:delete-model`.
- `src/main/services/modelManager.ts` — `WhisperModelId` now imported from the shared
  schema (single source of truth, was locally redefined); added
  `getPreferredModel`/`setPreferredModel` (persisted via `settingsRepository`),
  `listModels()`, `deleteModel()` (refuses mid-download, else force-remove), `downloadProgress()`;
  `installedModel()` now honors the operator's preference first, falling back to the
  existing automatic base→tiny→small order.
- `src/main/services/aiScriptureDetector.ts` — `downloadModel(agentId, modelId?)`;
  added `listModels`/`setPreferredModel`/`deleteModel`, all built on a shared
  `buildModelsStatus()` module function (not `this.` — this object is a plain literal).
- `src/main/ipc/aiHandlers.ts` — registered the 3 new handlers; `downloadModel` now
  passes `modelId` through.
- `src/preload/api.d.ts` / `src/preload/index.ts` — typed bridge methods for the above.
- `src/renderer/features/settings/AiPrivacySettings.tsx` — `WhisperModelSection` rewritten
  as a radiogroup: "Automatic (recommended)" + one row per variant (label, actual installed
  size, download/delete button, per-model download progress, "In use" badge for the
  currently-active one).
- `src/main/services/modelManager.test.ts` — mocked `settingsRepository` (opens a real
  SQLite connection otherwise, ABI-mismatched under the plain-Node test runtime) + 8 new
  tests covering `listModels`, preference set/clear/fallback-when-not-installed, and
  `deleteModel` (including refusing a delete mid-download).

## Rules that apply
- CLAUDE.md §5.3 (IPC contract: schema + preload + main all updated together),
  §5.5 (truth in SQLite via settingsRepository, not a local/renderer cache),
  §1.9 (one source of truth — `WhisperModelId` no longer redefined in two places),
  §5.8 (new logic ships with tests)

## Acceptance criteria
- [x] Operator can download any of tiny/base/small independently.
- [x] Operator can pin ("use this") any installed variant, or leave it Automatic.
- [x] Operator can delete an installed variant; blocked (clear error) mid-download.
- [x] `tsc --noEmit` clean, eslint clean.
- [x] Full unit suite: 343/344 pass (+8 new tests) — same single pre-existing, unrelated
      `modelManager.test.ts` path-separator failure noted in the two prior tasks today.
- [ ] reviewer sign-off (not yet assigned — flag for PM/user before merge)

## Outcome
No schema-breaking changes — `aiDownloadModel.modelId` is optional (old callers still get
the default `base`). Not committed (§5.10, commit on request). The operator now has
`tiny`, `base`, and `small` all downloaded already (from earlier benchmarking) with `base`
active by default; Settings → AI & Privacy → Local model shows all three with real sizes.
