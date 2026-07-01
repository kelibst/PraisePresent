# M2 — Live Detect as a lazy tab in Present + config to Settings
- **ID:** 2026-06-29_m2-livedetect-tab · **Phase:** UX-merge (M2) · **Agent:** implementer (+ reviewer; security-aware re AI streams/keys)
- **Status:** in-progress

## Goal
Replace the M1 Live-Detect placeholder tab with the REAL live console (transcript + candidates + start/stop
+ Passive/Drive), move all heavy CONFIG into Settings, collapse the "Live Detect" nav item, and remove the
standalone `/detect` page. **Efficiency is a hard requirement:** the tab subscribes to AI event streams ONLY
while it is the active tab AND listening; it tears down on stop or tab-switch; candidates feed the SAME
`usePresentDeck` live deck (no second `present.onState` subscription).

## Target (design v3)
- **Live Detect tab (in Present, left source panel):** *live operation only* — scrolling **live transcript**,
  current **detected candidate(s)** with confidence, **Start/Stop listening**, a small **Passive ⇄ Drive**
  toggle, and **Send to Live** on a candidate (stages into the shared deck). Idle/empty state when not listening.
  **No** audio-device / agent / API-key / threshold controls here.
- **Settings → AI & Privacy (already exists):** holds ALL config — **audio input source**, transcription
  **agent**, **default mode**, **API key** (masked), **kill-switch**, **thresholds**. Add whatever isn't
  already there (B10 added agent grid + masked key + online opt-in + auto-project + kill-switch; add audio
  source selector + default-mode + threshold if missing). The live tab READS these, shows none.

## Scope (files)
- `src/renderer/features/present/LiveDetectTab.tsx` — wire the real live console (was placeholder). It must
  consume the staging API from `usePresentDeck` (passed down by `PresentPage`) to send a candidate live —
  NOT open its own present subscription. Subscribe to `ai.onTranscript`/`ai.onCandidates` ONLY when mounted
  (it only mounts when the tab is active — M1 conditional render) AND listening is on; unsubscribe on
  stop/unmount.
- `src/renderer/features/present/PresentPage.tsx` — pass the deck/staging callbacks from the single
  `usePresentDeck()` into `LiveDetectTab`.
- `src/renderer/features/ai/` — refactor: keep the live pieces (transcript/candidates/start-stop/mode —
  reuse `useAiConsole`/`DetectionPane`/EQ as fits the slimmer tab), move the CONFIG pieces to Settings, and
  **delete the standalone `LiveDetectPage.tsx`** (now the tab). No dead code (§1.9).
- `src/renderer/features/settings/AiPrivacySettings.tsx` — ensure audio source + default mode + thresholds
  live here (add if missing); keep the existing agent grid + masked key + kill-switch. **Key value never
  shown/logged (§1.7).**
- `src/renderer/app/router.tsx` — remove `/detect` (redirect to `/present`). `src/renderer/components/layout/NavRail.tsx` — remove the "Live Detect" item.
- Drop the now-unused `isVerseLive` export from `usePresentDeck.ts` if still unused (M1 reviewer nit, §1.9).
- Update `tests/e2e/ai-detect.spec.ts` + `tests/e2e/ai-control.spec.ts` to drive the Live Detect tab at
  `/present` (+ any config now in Settings); preserve all IPC/behavior assertions (submitText→candidate→
  project, the ai.* control bridge, kill-switch, key round-trip privacy).

## Rules
§1.3 (window.api only), §1.7 (keys never shown/logged), §5.4 (keyboard/aria), §5.6 (tokens/atoms, no hex),
§1.9 (delete the standalone page; ONE Live Detect UI), R8 (passive default; no silent auto-project; kill-switch
hard-stops). **Efficiency:** AI streams subscribed only when active+listening; one shared deck subscription.

## Acceptance
- [ ] Live Detect tab shows transcript + candidates + start/stop + Passive/Drive, sends a candidate to the shared deck via `usePresentDeck` (no second `present.onState`).
- [ ] AI streams subscribe ONLY when the tab is active AND listening; unsubscribe on stop/switch (grep/inspect to confirm; no listener leak).
- [ ] All config (audio source, agent, mode default, key, kill-switch, thresholds) is in Settings → AI & Privacy; the tab shows none. Key value never rendered/logged.
- [ ] "Live Detect" nav item removed; `/detect` redirects to `/present`; standalone `LiveDetectPage` deleted; no dead code (incl. `isVerseLive` if unused).
- [ ] `ai-detect.spec.ts` + `ai-control.spec.ts` updated and passing; assertions preserved.
- [ ] tsc 0 · lint 0 · format clean · unit green; `bun run package` + the two ai e2e specs pass. Reviewer (+ security-aware) sign-off.

## Outcome (filled on completion)

**Status:** done (reviewer SIGN OFF — efficiency GO — 2026-06-29)

### Files changed
- `src/renderer/features/present/LiveDetectTab.tsx` — rewritten from the placeholder into the
  real live console: Start/Stop, Passive⇄Drive radio, scrolling transcript + EQ/listening
  indicator, the typed-text path, and detected candidate(s) with a confidence pill, slide
  preview, Dismiss, Send-to-Live, and a review queue. Takes an `onProject(verses, index)` prop
  (wired to `usePresentDeck.projectVerses`). Shows NO config; renders no key.
- `src/renderer/features/ai/useAiConsole.ts` — slimmed to live-operation only. Removed
  `setSource`/`setAgent`/`setEnabled`/the agent-registry fetch (now config). Added
  `startListening`/`stopListening`. Stream subscriptions now gated behind a `listening` effect.
- `src/renderer/features/present/usePresentDeck.ts` — added `projectVerses(verses, index?)`
  (stages + `present.setDeck` in one call so the AI tab feeds the single shared deck). Dropped
  the unused `isVerseLive` export and its now-unused `verseId` import.
- `src/renderer/features/present/PresentPage.tsx` — passes `deck.projectVerses` to the tab;
  removed the redundant outer `<section>` wrapper (the tab owns its own section).
- `src/renderer/features/settings/AiPrivacySettings.tsx` — added an Audio input source selector
  (`useAudioSources` + `ai.setSource`) and a Default detection mode passive/drive radio
  (`ai.setMode`). Agent grid, masked API key, online opt-in, auto-project guard + threshold,
  kill-switch already lived here (B10).
- `src/renderer/app/router.tsx` — removed the `LiveDetectPage` import; `/detect` now redirects
  `<Navigate to="/present" replace />`.
- `src/renderer/components/layout/NavRail.tsx` — removed the "Live Detect" nav item and the
  now-unused `Sparkles` import; fixed the header comment.
- `tests/e2e/ai-detect.spec.ts` — UI section now drives `#/present`, clicks the `Live Detect`
  tab, detects, and clicks the `Send Romans 8:28 live` button (was `#/detect` + heading).
- `tests/e2e/ai-control.spec.ts` — unchanged: purely `window.api.ai.*` bridge-driven (no UI
  nav), so every IPC/behavior assertion is preserved as-is and still passes.

### Files deleted
- `src/renderer/features/ai/LiveDetectPage.tsx`, `ListenPane.tsx`, `DetectionPane.tsx`
  (standalone page + panes — live logic moved into `LiveDetectTab.tsx`, config into Settings).
  `EqVisualizer.tsx`, `useAiConsole.ts`, `useAudioSources.ts` retained and reused.

### How the tab consumes the shared deck
No `present.onState` in the tab. It receives `onProject` = `usePresentDeck().projectVerses`,
which updates the hook's `staged` state AND calls `present.setDeck(...)`, so the single deck
subscription in `usePresentDeck` reflects the AI-sent verse for preview/deck-rail/cockpit.

### AI stream subscribe/unsubscribe lifecycle
`useAiConsole` effect: `if (!listening) return; …subscribe onTranscript/onCandidates…; return
() => { offTranscript(); offCandidates(); }` with dep `[listening]`. Tab only mounts when it
is the active source tab (lazy-mount). Idle = no AI listeners; Start → attach both; Stop →
detach both (+ clear transcript); tab-switch/unmount → cleanup. grep confirms `onTranscript`/
`onCandidates` appear only inside that gated effect.

### What moved to Settings
Audio input source + default detection mode (added this task); agent grid, masked API key,
online opt-in, auto-project enable + threshold, kill-switch (already there). Tab shows none;
key value never rendered/logged (§1.7).

### Verification
`bunx tsc --noEmit` → 0 · `bun run lint` → 0 · `bun run format:check` clean · `bun run test`
→ 170 passed · `bun run package` ok · playwright ai-detect + ai-control → 2 passed ·
shell.spec.ts → 1 passed.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF + efficiency GO: AI streams gated behind listening effect w/ cleanup (zero idle listeners), single present.onState, lazy-mount intact, config in Settings, key never rendered/logged, R8 preserved. tsc 0 · lint 0 · 170 unit · package · ai-detect+ai-control+shell e2e pass.
