# M1 — Unify Scripture + Present into one tabbed "Present" screen
- **ID:** 2026-06-29_m1-unify-present · **Phase:** UX-merge (M1) · **Agent:** implementer (+ reviewer)
- **Status:** in-progress

## Goal
Collapse the standalone Scripture screen and the standalone Present cockpit into ONE 3-pane "Present"
screen, reusing existing components and a **single shared live-deck subscription** (efficiency is a hard
requirement — the user will reject a slower result). No new IPC. Scripture stays read-only/locked. The
Live Detect tab is scaffolded here but wired in M2.

## Target layout (design v3)
- **Left — tabbed Source panel:** tabs `Scripture` | `Live Detect`.
  - Scripture tab = the existing `SearchPane` (Reference / Card picker / Keyword modes) verbatim.
  - Live Detect tab = a lightweight placeholder in M1 ("Live Detect — enable in this tab", or an idle
    state); M2 wires the real transcript/candidates. Do NOT mount any AI streams in M1.
- **Middle — Preview + Schedule:** the existing `PreviewSchedulePane` (staged preview on top, active-service
  Schedule at the bottom). Unchanged behavior.
- **Right — Live Output cockpit:** merge today's scripture `LiveOutputPane` with `PresentationPage`'s cockpit:
  On-screen-now (lg `SlidePreview`) + **deck rail** (`MiniSlideThumb` strip, click=goto, current highlighted)
  + Next (sm `SlidePreview`) + transport **Prev · Next · Black · Blank · Clear** + transition selector
  **Cut / Fade / Dissolve**. Preserve ALL existing keyboard controls from PresentationPage (→/Space/←/B/Esc/Home/End).

## Scope (files)
- NEW or repurposed unified screen at route `/present` (recommend repurposing
  `src/renderer/features/presentation/PresentationPage.tsx` into the 3-pane orchestrator, or a new
  `src/renderer/features/present/PresentPage.tsx` — your call; keep imports clean).
- REUSE (move/keep, don't fork): `src/renderer/features/scripture/SearchPane.tsx` + `ReferenceMode.tsx`/
  `CardPickerMode.tsx`/`KeywordMode.tsx` + `scriptureDeck.ts`; `PreviewSchedulePane.tsx`; the cockpit
  parts of `PresentationPage.tsx`; shared atoms (`SlidePreview`, `MiniSlideThumb`, `PaneHeader`, `ScheduleRow`).
- **ONE shared present hook:** unify `useScripturePresenter` (staging + live mirror) and the cockpit's
  `present.onState` subscription into a SINGLE subscription powering preview + deck rail + on-screen + next.
  No double `present.onState` subscription anywhere on this screen.
- DELETE: the duplicate scripture `LiveOutputPane.tsx`; the old `ScripturePage.tsx` 3-pane orchestrator
  (its panes are reused here); the standalone Present cockpit page if a new file replaces it. No dead code (§1.9).
- `src/renderer/app/router.tsx`: `/present` = unified screen; `/scripture` → redirect to `/present` (or remove).
- `src/renderer/components/layout/NavRail.tsx`: remove the "Scripture" nav item; keep "Present". (Live Detect
  item stays until M2.)
- Update `tests/e2e/scripture.spec.ts` + `tests/e2e/presentation.spec.ts` to drive the unified `/present`
  screen — preserve every IPC/behavior assertion (hydration, lookup, keyword, FTS5, setDeck mirror, deck
  navigate, transitions, fail-safe, keyboard); only update UI selectors/navigation for the merged screen.

## Rules
§1.2 (HashRouter), §1.3 (window.api only), §5.4 (keyboard/aria preserved — live operation), §5.6 (tokens/atoms,
no hex, reuse primitives), §1.9 (delete the duplicated panes/screens — ONE Present UI), §5.7 (fail-safe).
**Efficiency:** one `present.onState` subscription; tabs lazy-mount; no redundant re-renders.

## Acceptance
- [ ] `/present` renders the tabbed 3-pane (Scripture tab functional; Live Detect tab placeholder; middle Preview+Schedule; right cockpit with deck rail + transport + transitions).
- [ ] Exactly ONE `present.onState` subscription on the screen (grep to confirm); staging→send-live→mirror works; deck rail jump + transport + transitions + keyboard all work.
- [ ] Scripture nav item removed; `/scripture` redirects to `/present`; standalone Present cockpit + duplicate LiveOutputPane + old ScripturePage deleted; no dead code, no dangling imports.
- [ ] `scripture.spec.ts` + `presentation.spec.ts` updated and passing against `/present`; all prior IPC assertions preserved.
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)
Unified Scripture + Present into one `/present` screen under a new `src/renderer/features/present/` feature.

**Added**
- `present/usePresentDeck.ts` — THE single live-deck hook: owns staging state + the ONE `present.onState`
  subscription (merges old `useScripturePresenter`'s live-mirror with the cockpit's subscription). Also exposes
  goto/blank + `setTransition`. Carries `StagedPassage`/`isVerseLive` (moved from the deleted hook).
- `present/LiveCockpit.tsx` — right pane; the old PresentationPage cockpit (deck rail + on-screen-now/next +
  transport + transitions + keyboard) as a pure view: takes `state` + callbacks, owns NO subscription. Keyboard
  handler (→/Space/←/B/Esc/Home/End) preserved verbatim; sr-only `<h1>Presentation</h1>` kept for e2e/a11y.
- `present/LiveDetectTab.tsx` — M1 idle placeholder; mounts no AI streams.
- `present/PresentPage.tsx` — 3-pane orchestrator: LEFT tabbed Source (Scripture=`SearchPane` verbatim |
  Live Detect=placeholder; lightweight role=tablist toggle that conditionally renders only the active tab body,
  so tabs lazy-mount and M1 never mounts AI streams), MIDDLE `PreviewSchedulePane`, RIGHT `LiveCockpit`.
  One `usePresentDeck()` powers all three panes.

**Changed**
- `scripture/SearchPane.tsx` + `scripture/PreviewSchedulePane.tsx` — import `StagedPassage` from `present/usePresentDeck`.
- `app/router.tsx` — `/present` = `PresentPage`; `/scripture` → `<Navigate to="/present" replace />`.
- `components/layout/NavRail.tsx` — removed the "Scripture" item (+ unused `BookOpen` import); kept Present + Live Detect.
- `tests/e2e/scripture.spec.ts` — navigation `#/scripture` → `#/present` (one line + comment); ALL IPC/behavior
  assertions unchanged (hydration, lookupReference, range, FTS5/keyword, getChapter, setDeck mirror, Send to Live,
  Psalm 23, Keyword tab). `presentation.spec.ts` — no change needed (already drove `/present`; all assertions pass).

**Deleted** (no dead code, no dangling imports): `scripture/ScripturePage.tsx`, `scripture/LiveOutputPane.tsx`,
`scripture/useScripturePresenter.ts`, `presentation/PresentationPage.tsx`.

**Single-subscription proof:** `grep -rn '.onState(' src/renderer/features/present src/renderer/features/scripture`
→ exactly one hit (`usePresentDeck.ts`). LiveCockpit + scripture panes subscribe to nothing.

**Verify:** tsc 0 · eslint 0 · prettier clean · vitest 170/170 · `bun run package` ok ·
`playwright test scripture.spec.ts presentation.spec.ts` → 3/3 passed.

**Status:** done (reviewer SIGN OFF — efficiency GO — 2026-06-29)

## PM sign-off (2026-06-29)
Reviewer SIGN OFF + **efficiency GO**: exactly ONE present.onState subscription (usePresentDeck.ts), lazy-mount via conditional render (inactive tab + AI streams never mount), keyboard preserved, 4 old files deleted with no dangling refs, no perf regression vs prior screens. tsc 0 · lint 0 · 170 unit · package · scripture+presentation e2e 3/3. PM also repointed stale /scripture nav targets (HomePage quick-jump, CommandPalette) to /present.
