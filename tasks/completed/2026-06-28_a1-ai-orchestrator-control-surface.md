# A1 — AI orchestrator: modes, agents, kill-switch, event streams + IPC
- **ID:** 2026-06-28_a1-ai-orchestrator-control-surface
- **Phase:** 4
- **Assigned agent type:** implementer (separate reviewer + security to follow)
- **Status:** done

## Goal
Extend the existing text-path AI detector into the **stateful control surface** the new Live-Detect
and AI-&-Privacy Settings screens render. This is interfaces + in-memory state only — **no real audio
capture, no network, no keys** (those are A2/A4). Default mode is **passive** (operator-confirmed,
never auto-project — R8). A hard **kill-switch** stops all detection. Everything here is unit- and
e2e-verifiable in this env.

## Scope (files/areas)
- `src/shared/schemas/ai.ts` — ADD zod schemas + `z.infer` types (keep existing `submitText`/
  `detectedReference`): `detectionMode = z.enum(['passive','drive'])`; `transcriptionAgent`
  (`{ id, name, kind: 'offline-local'|'online-cloud', online: boolean, requiresKey: boolean,
  installed: boolean, hasKey: boolean }`); `audioSource` (`{ id, label }`); `transcriptSegment`
  (`{ id, text, at, refs?: detectedReference[] }`); `aiStatus`
  (`{ enabled, mode, listening, activeAgentId, online, lastError? }`).
- `src/shared/constants/channels.ts` — ADD to `ai`: `listAgents`, `setAgent`, `setMode`,
  `setEnabled`, `status`, `listSources`, `startListening`, `stopListening`, and two **event push**
  channels `candidates` (`ai:candidates`) + `transcript` (`ai:transcript`). Keep `submitText`.
- `src/main/services/aiScriptureDetector.ts` — hold orchestrator state (active agent, mode, enabled,
  online opt-in, listening). Add a **built-in agent registry**: `praisepresent-local` (offline,
  installed:true), `whisper-local` (offline, installed:false — model-gated stub), `claude` /
  `deepgram` / `assemblyai` (online, requiresKey:true, hasKey:false — key-gated stubs).
  `setMode`/`setEnabled`/`setAgent` mutate state; `setEnabled(false)` is a **hard kill-switch** that
  also forces `listening=false`. `startListening` is a stub that no-ops with a clear "agent not
  available" status when the agent is uninstalled/keyless (real capture lands in A2/A4). Put the PURE
  reducer logic (state transitions, registry defaults) in a separate testable module
  (`src/main/services/aiOrchestratorState.ts`) so Vitest can cover it without electron/native deps
  (pattern: `planEstimate.ts`).
- `src/main/ipc/aiHandlers.ts` + register in `src/main/ipc/index.ts` — one `handle(...)` per channel,
  zod-validated; broadcast `ai:candidates`/`ai:transcript` to the presenter window the way
  `present:state` is broadcast in `windowManager.ts`.
- `src/preload/index.ts` + `src/preload/api.d.ts` — extend `window.api.ai` with the new methods and
  `onCandidates(cb)`/`onTranscript(cb)` returning unsubscribe (mirror `present.onState`). Fixed
  channels only; never a generic invoke.

## Rules that apply
- CLAUDE.md §1.3 (privileged work in main), §5.2 (process boundaries), §5.3 (zod IPC, shared source of
  truth), §5.7 (fail safe, never crash on junk), §5.8 (pure logic unit-tested without native DB).
- Pattern: `plan/phases/context.md §4` (vertical slice); reference `aiScriptureDetector.ts` (existing),
  `songHandlers.ts`, `windowManager.ts` (`present:state` broadcast), `present.onState` bridge.
- Reuse — do NOT duplicate the existing text path or Bible logic.

## Acceptance criteria
- [ ] `window.api.ai.listAgents/setAgent/setMode/setEnabled/status/listSources` work via the bridge.
- [ ] Default mode passive; `setEnabled(false)` hard-stops (listening:false, no detection).
- [ ] `onCandidates`/`onTranscript` subscriptions deliver pushed events and unsubscribe cleanly.
- [ ] Existing `ai:submit-text` path still works unchanged.
- [ ] Unit tests for `aiOrchestratorState.ts` (mode/kill-switch/agent-registry transitions).
- [ ] e2e drives the new `window.api.ai.*` surface; tsc 0 · lint 0 · unit green.
- [ ] reviewer + security sign-off (new IPC surface).

## Outcome (2026-06-28 — DONE, reviewer + security SIGN OFF)
Added the stateful AI control surface over the existing text path (unchanged). New: `aiOrchestratorState.ts`
(pure reducer + built-in agent registry, 15 unit tests), 10 new `ai:` channels incl. `candidates`/`transcript`
event-push (presenter-window-only via new `windowManager.sendToPresenter` — audience never sees unconfirmed AI,
R8), zod schemas (`detectionMode`/`transcriptionAgent`/`audioSource`/`transcriptSegment`/`aiStatus`), handlers +
`window.api.ai.*` bridge (`listAgents/setAgent/setMode/setEnabled/status/listSources/start|stopListening` +
`onCandidates/onTranscript`). Default mode `passive`; `setEnabled(false)` hard kill-switch (no auto-resume, no
auto-project). `tests/e2e/ai-control.spec.ts` authored. Gate: tsc 0 · lint 0 · 106 unit green.
**Security SIGN OFF** (renderer boundary clean, zod-bounded IPC, generic errors, presenter-only push, no secrets/
network/audio). **Follow-up for A2/A3:** wire `setOnline` to an IPC channel (online opt-in toggle) so the
already-tested reducer action isn't left dead.
