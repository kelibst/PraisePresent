# A2+A3 — Online Claude extractor + key storage + privacy/kill-switch/auto-degrade
- **ID:** 2026-06-28_a2a3-online-extractor-privacy
- **Phase:** 4
- **Assigned agent type:** implementer + security
- **Status:** done (reviewer + security SIGN OFF 2026-06-28)
- **Supersedes-core-of:** `tasks/active/2026-06-27_p4-t2-online-asr-llm.md` (LLM half),
  `tasks/active/2026-06-27_p4-t4-degrade-privacy-safety.md` (controls). Update those outcomes; don't duplicate.

## Goal
Build the **buildable-now** core of online mode + its privacy/safety controls. The LLM extraction
module and all control logic land and are unit/e2e-verified with a **mocked Anthropic client** (no real
key/network exercised here). The moment a real API key is entered it works. Real streaming cloud STT
audio capture stays deferred (P4-T2 audio front-end). Built on A1's orchestrator (`aiOrchestratorState.ts`,
`aiScriptureDetector.ts`, the `ai:` channels + bridge).

## Scope (files/areas)
**Online extractor (A2):**
- `src/main/services/onlineScriptureExtractor.ts` — Claude **tool use** with a
  `report_scripture_references` tool schema; an injected `AnthropicClient` interface
  (`extract(transcript): Promise<RawRef[]>`) so tests pass a **mock**; a thin real impl (main-only,
  may use `@anthropic-ai/sdk` — install if needed — or `fetch`). Resolve every raw ref via the existing
  `scriptureService` resolver (NO duplicated Bible logic); drop refs that don't resolve (precision).
  Read the **`claude-api` skill** (Skill tool, `skill: "claude-api"`) for the current model id / tool-use /
  streaming shape before writing the client. Use a cost-appropriate model for extraction (Haiku/Sonnet tier).
- API keys via Phase-2 **safeStorage** (main only): channels `ai:setApiKey`, `ai:hasKey`, `ai:clearApiKey`.
  The key value NEVER crosses to the renderer — `hasKey` returns a boolean (optionally `••••last4`).
  Wire each online agent's `hasKey` flag in the registry from real storage.
- **CSP**: add the Anthropic API host to `connect-src` (find the declarative CSP from P2-T4; main only).

**Privacy / safety / auto-degrade (A3):**
- Online **opt-in** flag: add `ai:setOnline` channel + handler wiring A1's existing `setOnline` reducer
  action (the A1 reviewer flagged this as currently un-wired). `aiStatus.online` already carries it for
  the on-screen "online AI on" indicator.
- **Auto-project guard:** add a configurable high-confidence auto-project threshold (`ai:setAutoProject`
  `{ enabled:boolean, minConfidence:number }`), **disabled by default**. Even in `drive` mode, never
  auto-project below threshold; default config never auto-projects at all (R8).
- **Auto-degrade** online→offline: on a connectivity-loss signal switch the active agent to the offline
  default with no operator action. Model the connectivity check as an **injectable function** so a fake
  can drive it in tests. Offline path makes **zero network calls** (assert in a test).
- **Transcript-only** option (detection off, transcript still shown) — a flag in state + its setter.

## Rules that apply
- §1.7 (secrets main-only, never renderer), §1.3/§5.2 (privileged work in main), §5.3 (zod IPC),
  §1.4/CSP, §5.7 (resilience), §5.8 (tests). Spec §3 (online) + §7 (privacy/degrade). Reuse
  `scriptureService`. **Security sign-off required** (transport, secrets, CSP, kill-switch, zero-egress).

## Acceptance criteria
- [ ] Mocked client: transcript → tool call → resolved candidates (unresolvable refs dropped). Unit-tested.
- [ ] `ai:setApiKey`/`hasKey`/`clearApiKey` round-trip via safeStorage; renderer only ever sees a boolean.
- [ ] CSP `connect-src` includes the Anthropic host; no network code in renderer.
- [ ] `ai:setOnline` toggles opt-in (no dead `setOnline`); kill-switch still hard-stops everything.
- [ ] Default config NEVER auto-projects; auto-project only above the configured threshold when enabled.
- [ ] Fake connectivity loss auto-degrades online→offline; a test asserts the offline path makes no network calls.
- [ ] tsc 0 · lint 0 · unit green; e2e extends `ai-control.spec.ts` for the new surface. Security sign-off.

## Outcome (filled on completion)
**Status: done (pending reviewer + security sign-off).** Built the buildable-now online + privacy core on A1.

Files changed:
- `src/main/services/onlineScriptureExtractor.ts` (NEW) — Claude tool-use extractor behind an injected `AnthropicClient` interface; `report_scripture_references` tool; resolves every raw ref via `scriptureService.resolve` and drops unresolved refs; real `fetch`-based client (main-only, model `claude-haiku-4-5`); `parseToolUse` validates tool input with zod. No `@anthropic-ai/sdk` install — main-side `fetch` keeps the dependency/security surface minimal.
- `src/main/services/aiOrchestratorState.ts` — added `autoProject` (off by default — `DEFAULT_AUTO_PROJECT`, never auto-projects, R8) + `transcriptOnly` to state; `setAutoProject`/`setTranscriptOnly`/`autoDegrade` actions; `shouldAutoProject` guard (kill-switch wins); `HasKeyFor` injected predicate so the availability gate consults real storage.
- `src/main/services/aiScriptureDetector.ts` — wired `setOnline` (A1's un-wired reducer action), `setAutoProject`, `setTranscriptOnly`; safeStorage key management (`setApiKey`/`hasKey`/`clearApiKey`, value never returned); `listAgents` reflects real key presence; injectable `setConnectivityCheck` + `checkConnectivity()` auto-degrade.
- `src/shared/schemas/ai.ts`, `src/shared/constants/channels.ts`, `src/main/ipc/aiHandlers.ts`, `src/preload/index.ts`, `src/preload/api.d.ts` — zod schemas, channels, handlers, bridge for the new surface.
- `src/main/index.ts` + `src/main/infra/config.ts` (reused `allowConnectSource`) — CSP `connect-src` extended with `https://api.anthropic.com` (main only).
- Tests: `onlineScriptureExtractor.test.ts` (NEW), `aiScriptureDetector.keys.test.ts` (NEW), `aiOrchestratorState.test.ts` (extended), `tests/e2e/ai-control.spec.ts` (extended for setOnline/hasKey/setAutoProject/transcriptOnly/key round-trip).

Verify: `tsc --noEmit` 0 · `lint` 0 · unit 132 passed (42 across the AI files). e2e extended (PM batches the run).
Deferred: real streaming cloud STT audio capture (P4-T2), live Anthropic API call with a real key.
