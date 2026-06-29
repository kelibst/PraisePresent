# B9 — Live Detect (AI) console re-skin
- **ID:** 2026-06-29_b9-livedetect-screen · **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin `src/renderer/features/ai/LiveDetectPage.tsx` to the design's 2-pane AI console over the
Stage-A control surface (A1–A4). Real state where it exists; hardware/key-gated bits show their honest
"not installed / add a key / requires online" states. Human-in-the-loop default (passive). Never auto-project below threshold (R8).

## Scope
- `src/renderer/features/ai/` (LiveDetectPage.tsx + in-dir subcomponents; consume `useAudioSources.ts` (A4) read-only).
- Data: `window.api.ai.listAgents/setAgent/setMode/setEnabled/status/listSources/setSource/modelStatus/submitText`
  + `ai.onTranscript`/`ai.onCandidates`; `present.setDeck`/`black`. Shared atoms `SlidePreview`, `PaneHeader`.

## Rules
§1.3 (window.api only), §1.7 (keys never shown — only status), §5.4 (keyboard/aria), §5.6 (tokens/atoms/no hex), §1.9, R8 (no silent auto-project). Size to content/h-full.

## Acceptance
- [ ] Pane 1: audio-source picker (`useAudioSources`/`setSource`) + EQ affordance; transcription-agent grid (`listAgents`/`setAgent`, online/offline dot, "add key"/"not installed" states); passive/drive cards (`setMode`); live transcript (`onTranscript`, "Listening"/idle from `status`).
- [ ] Pane 2: detection result (latest `onCandidates`/`submitText`) with confidence; passive = Dismiss / Review & Send Live (`present.setDeck`); drive = auto-sent badge (only when auto-project threshold enabled — else still operator-confirmed). SlidePreview of the detected verse.
- [ ] The existing typed-text detect path (`submitText`) remains usable; kill-switch (`setEnabled`) visibly hard-stops.
- [ ] Existing `ai-detect.spec.ts` + `ai-control.spec.ts` still pass.
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)
Re-skinned Live Detect into the approved 2-pane AI console (~1.5:1 grid) inside the shell's
scrollable main (`h-full min-h-0`, content-sized — no `min-h-screen`). All state through
`window.api.ai`/`present` via hooks; tokens only (no hex); reused `PaneHeader`/`SlidePreview`;
keys never rendered (only gated "Add a key"/"Not installed" badges). Human-in-the-loop preserved.

Files added/changed (all under `src/renderer/features/ai/`):
- `useAiConsole.ts` (new) — wraps `ai.status/listAgents/setMode/setAgent/setSource/setEnabled/submitText`
  + `onTranscript`/`onCandidates` subscriptions; rolls a capped transcript; holds candidate queue
  + selectedIndex; re-pulls `listAgents` after `setAgent` so gated states stay honest.
- `EqVisualizer.tsx` (new) — 6 staggered `animate-pp-eq` bars (active=`pp-accent`, idle dim), aria-hidden.
- `ListenPane.tsx` (new) — Pane 1: source `<select>`→`setSource`; passive/drive ModeCards→`setMode`
  (radiogroup); 2-col agent grid→`setAgent` (online dot=`pp-warn`, offline=`pp-accent`, gated badge +
  tooltip); live transcript (`onTranscript`, Listening/Idle from `status.listening`, pulsing dot);
  typed-text path→`submitText`; kill-switch in header→`setEnabled` (hard-stops, disables controls).
- `DetectionPane.tsx` (new) — Pane 2: selected candidate big reference + "N% match" pill + trigger
  snippet + `SlidePreview`; Dismiss (local) / Review & Send Live (`present.setDeck`); review queue for
  multi-candidate; Drive auto-sent green banner ONLY when `autoProject.enabled` && conf≥minConfidence (R8).
- `LiveDetectPage.tsx` (rewritten) — composes the two panes + the loading state.

Mode/kill-switch behavior: passive = every candidate operator-confirmed; drive = same UNLESS the
off-by-default auto-project guard is on (then an honest "Auto-sent live" banner shows). Kill-switch
(`setEnabled(false)`) flips header to "Stopped" (pp-error), disables source/mode/agent controls,
and the transcript reads "AI is stopped" — status truth reflected throughout.

Gated agents: offline-local + !installed → "Not installed" (package icon); requiresKey + !hasKey →
"Add a key" (key icon). Never a key value.

Specs: re-read both — preserved their selectors. "Live Detect" exposed via `role="heading"`/aria-level
on the pane label; the typed `submitText` path drives a single candidate whose Send button carries
`aria-label="Review & Send Romans 8:28 live"` so `getByRole('button', { name: /Romans 8:28/ })` matches
and projects. NO spec edits needed.

Verify (all green): `bunx tsc --noEmit` 0 · `bun run lint` 0 · `bun run format` + `format:check` clean ·
`bun run test` 170 passed · rebuilt via `electron-forge package` and ran `ai-detect`+`ai-control` e2e → 2 passed.

Divergences: none material. Online agents show a Wifi glyph when usable (not gated); transcript is a
50-segment rolling window. Pending reviewer sign-off + observed render before close.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
