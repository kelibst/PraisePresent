# A4+A6 — Audio/whisper interface + search/active-service/safe-area plumbing
- **ID:** 2026-06-28_a4a6-audio-search-plumbing
- **Phase:** 4 (A4) + UX-revival (A6)
- **Assigned agent type:** implementer (+ reviewer; security for the AI/IPC + settings parts)
- **Status:** done (reviewer + security SIGN OFF 2026-06-28; pending Stage-A e2e batch)

## Goal
Land the remaining **buildable-now feature plumbing** the new design depends on, as a single owner of
`channels.ts` (avoids edit races). This is plumbing + hooks; the **visual UI** that consumes it is built
later in Stage B screens — do NOT build screen chrome here. Real audio capture + whisper binaries stay
deferred behind stable interfaces (R6).

## Scope (files/areas)

### A4 — Audio source enumeration + whisper interface (Phase-4 T3 interface only)
- **Audio sources:** make `ai:listSources` real. Device *labels* come from the renderer
  (`navigator.mediaDevices.enumerateDevices()` — a renderer-side helper hook, the ONLY place that may);
  main holds the *selected* source id in orchestrator state (add `ai:setSource` channel + reducer
  action). No capture yet.
- **whisper behind a stable interface:** `src/main/services/localAsr.ts` — a `LocalAsr` interface
  (`isInstalled()`, `transcribe(pcm): Promise<string>`) + a `NullLocalAsr` not-installed stub. Surface a
  **model-download-manager state** (`whisper-local` agent: `installed:false`, a `modelState` of
  `'absent'|'downloading'|'ready'`) via a new `ai:modelStatus` read + an `ai:downloadModel` action that,
  for now, is a **no-op stub** returning a clear "not available in this build" status (R6 — the interface
  is what must be stable; the real binary lands later). Keep PURE state in `aiOrchestratorState.ts`.
- Updates `tasks/active/2026-06-27_p4-t3-offline-asr-whisper.md` outcome ("interface landed; binary deferred").

### A6 — Global search + active-service + display safety (non-AI plumbing)
- **Global search aggregator:** `search:query` channel + `src/main/services/searchService.ts` that fans
  over `scriptureService.searchKeyword`, `songRepository`/service `list`, and `mediaService.list`,
  returning typed grouped results `{ scripture[], songs[], media[] }` (cap each group). REUSE existing
  services — no new Bible/song/media logic. (Stage B's B2 builds the ⌘K palette UI on this.)
- **Active-service context:** persist an "active service id" via the existing `settings:get/set`
  (key `activeServiceId`); add a tiny renderer hook `useActiveService()` (reads `plans.get` for the id)
  so the TopBar selector (B2) and Scripture Schedule pane (B4) share one source. No new channel if
  `settings` suffices.
- **Display safety:** add `settings` keys `display.safeAreaPct` (0–15) and `display.blackOnDisconnect`
  (bool, default true). `AudienceView.tsx` honors `safeAreaPct` (inset the slide); main blacks the
  audience output if the display disconnects when `blackOnDisconnect` is on (extend the existing
  display/windowManager path). Fail-safe preserved (§5.7). (B10 Settings + B11 consume the keys.)

## Rules that apply
- §1.3/§5.2 (privileged work in main; only the audio-label hook touches `navigator.mediaDevices`, in the
  renderer — that's a Web API, not electron/node, so it's allowed), §5.3 (zod IPC), §5.5 (repos), §5.7
  (fail-safe audience), §5.8 (tests), R6. Reuse existing services everywhere.

## Acceptance criteria
- [ ] `ai:listSources` returns real device labels; `ai:setSource` persists selection; `ai:modelStatus`/
      `ai:downloadModel` return clear stub state (no crash, no fake "ready").
- [ ] `localAsr.ts` interface + NullLocalAsr stub; whisper-local agent shows `modelState:'absent'`.
- [ ] `search:query` returns grouped results over the 3 existing services; capped; unit-tested with mocks.
- [ ] `activeServiceId` persists; `useActiveService()` hook reads it; safe-area + black-on-disconnect keys
      persist and AudienceView insets by safe-area; disconnect blacks the audience when enabled.
- [ ] tsc 0 · lint 0 · unit green; e2e covers `search:query` + safe-area persistence. No screen UI built here.
- [ ] reviewer (+ security for the AI/IPC/settings) sign-off.

## Outcome (filled on completion)
Implemented both halves as plumbing + small renderer hooks; no screen UI built. tsc 0 · lint 0 · 150
unit tests green. Awaiting reviewer (+ security) sign-off and the batched e2e run.

**New channels:** `ai:set-source`, `ai:model-status`, `ai:download-model`, `search:query`. `ai:list-sources`
changed from a no-arg read to a renderer→main push (the renderer enumerates device labels and posts them).

**A4 — audio + whisper interface:**
- `aiOrchestratorState.ts` (PURE): added `selectedSourceId` + `sources` to state, `setSources`/`setSource`
  reducer actions (default source always preserved + deduped; selection falls back to default if its device
  disappears; unknown id rejected without throwing), and `modelStatusFor(agentId)` deriving model state from
  the registry. `selectedSourceId` added to `aiStatus`.
- `src/main/services/localAsr.ts`: `LocalAsr` interface + shipped `NullLocalAsr` stub (see whisper task).
- Detector wires `setSources`/`setSource`/`modelStatus`/`downloadModel` (download is a no-op stub returning
  "not available in this build" — never a fake "ready", never a crash, R6).
- Renderer hook `src/renderer/features/ai/useAudioSources.ts` — the ONLY place touching
  `navigator.mediaDevices` (Web API, §5.2): enumerates labels, pushes to main, renders the merged list.

**A6 — search + active-service + display safety:**
- `src/main/services/searchService.ts` + `search:query` channel: fans one query over the EXISTING
  `scriptureService.searchKeyword` (FTS5, already ranked/capped), `songService.list` (filtered by
  title/author/tags), `mediaService.list` (filtered by name). Each group capped independently; a failing
  domain yields an empty group (fail-safe), never failing the whole search. No new Bible/song/media logic.
- `src/renderer/features/planning/useActiveService.ts`: reads/persists `activeServiceId` via `settings`,
  resolves the plan via `plans.get`; no new channel.
- Display safety: `display.safeAreaPct` (0–15) + `display.blackOnDisconnect` (default ON) settings keys with
  pure parsers in `display.ts`. `AudienceView` reads safe-area on mount and insets the content layer (the
  black backdrop still fills edge-to-edge). `windowManager.onDisplayRemoved` blacks the audience first (when
  enabled) then re-places — fail-safe preserved (§5.7).

**Tests:** `searchService.test.ts` (grouping/caps/case-insensitive/blank-query/fail-safe over mocked
services), orchestrator source + model-state cases appended to `aiOrchestratorState.test.ts`,
`displaySafety.test.ts` (parser round-trip/clamp/defaults). E2e: new `tests/e2e/search.spec.ts`
(search:query grouping/caps + safe-area persistence & audience inset); `ai-control.spec.ts` updated for the
new `listSources(sources)` signature + source/model assertions.

**Divergence forced by real code:** `ai:list-sources` had to change shape (read → renderer-push) because
device labels are only visible in the renderer; the existing e2e + `api.d.ts`/preload were updated to match.
Removed the now-dead `BUILTIN_SOURCES` export (§9). `setActiveService(null)` persists `''` (settings values
are non-empty-optional strings) and parses back to null.
