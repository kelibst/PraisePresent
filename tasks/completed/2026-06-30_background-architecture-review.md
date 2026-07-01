# Background architecture review + fix plan (theme-coupled scripture background)
- **ID:** 2026-06-30_background-architecture-review
- **Phase:** UX-merge (follow-on to M4 slide backgrounds + service-default-background)
- **Assigned agent type:** PM (review/planning) → 4 read-only reviewers → implementer (PM) → reviewer + security
- **Status:** done — plan approved by user, implemented on `phase-ux/background-theme-decouple`, reviewer + security SIGN-OFF, gate + projector e2e green (uncommitted, pending user observation)

## Goal
Diagnose and document the substantial architectural issue the operator reports: scripture/
presentation slides have a DIFFERENT default background in light mode vs dark mode, and setting an
image/video as a background (from BOTH the Settings page default AND the per-slide editor) is
unreliable. Produce two artefacts in `plan/background_architecture/`: (1) the CURRENT architecture
with a mermaid diagram + a flagged list of flaws; (2) a PROPOSED fix with a mermaid diagram and the
rationale for why it removes the flaws. The user reviews the plan before any implementation.

## Scope (files/areas — investigation, read-only)
- `src/shared/schemas/present.ts`, `src/shared/present/serviceBackground.ts` (data model + resolver)
- `src/main/services/presentEngine.ts`, `src/main/ipc/presentHandlers.ts`,
  `src/main/windows/windowManager.ts` (reducer / IPC / persist / broadcast)
- `src/renderer/features/presentation/AudienceView.tsx`,
  `src/renderer/components/common/SlidePreview.tsx`,
  `src/renderer/features/present/{LiveCockpit,BackgroundEditor,BackgroundPicker}.tsx`,
  `src/renderer/features/scripture/PreviewSchedulePane.tsx` (render surfaces)
- `src/renderer/styles/globals.css`, `src/renderer/lib/theme.tsx`, `src/renderer/index.tsx`
  (theme tokens + how the theme class is applied to BOTH windows)

## Rules that apply
- §1.3 (renderer only via window.api), §1.5 (truth in SQLite), §1.9 (one way — no duplicated
  background-painting), §5.2/§5.3 (validate at the main boundary), §5.6 (tokens, no hex), §5.7
  (audience/projector fails safe; must NOT depend on the operator's UI theme).

## Acceptance criteria (for THIS review/planning task)
- [x] 4 read-only reviewer agents reported (state spine, theme coupling, render surfaces, entry points).
- [x] `plan/background_architecture/current-architecture.md` (+ mermaid) — flaws enumerated with file:line.
- [x] `plan/background_architecture/proposed-fix.md` (+ mermaid) — fix + why it closes each flaw.
- [x] User has reviewed and approved the plan ("go ahead and implement").
- [x] Implemented T1–T5; reviewer + security sign-off; gate + projector e2e green.

## Outcome (2026-06-30 — IMPLEMENTED, reviewer + security SIGN-OFF, gate green)
Plan approved by user; implemented on branch `phase-ux/background-theme-decouple` (uncommitted,
left for user observation). Five changes:
- **T1 (kills F1):** theme-independent `--pp-stage-{base,glow,edge}` tokens in `globals.css` `:root`
  (NOT in `.dark`) + one `.pp-stage-backdrop` class. The slide backdrop no longer references the
  themed `--background` token (grep-confirmed zero `var(--background)` in any slide surface).
- **T2 (kills F3/F4):** new shared `src/renderer/components/common/SlideStage.tsx` — the ONE slide
  surface (backdrop→bg→media→text→reference, one video renderer with autoplay/loop + url keys,
  `surface` prop = projector-with-sound vs muted-preview). `SlidePreview` (public API unchanged) and
  `AudienceView.SlideLayer` both delegate to it; the 4 duplicated layer fns deleted. Net −128 LOC.
- **T3 (kills F5/F6):** `SongLivePane` resolves via `effectiveBackground` + passes media;
  `BackgroundPicker` previews video items; `PreviewSchedulePane` annotated (text-only ⇒ default IS
  the effective bg, not a bypass).
- **T4 (kills F2):** `/audience` window pinned to the fixed dark presentation theme via
  `isAudienceWindow()` (`theme.tsx` + `index.tsx`) — operator UI theme can never reach the projector.
- **T5:** 8 new `SlideStage` unit tests incl. the F1 regression guard (no `--background`) + video/audio
  surface behavior.

Gate: tsc 0 · eslint 0 · prettier clean · **336/336** unit · **3/3** projector e2e (audience mirror +
fail-safe, presentation navigate/transition, presenter UI) on a fresh `npm run package` build. Reviewer
PASS (all F1/F4/F5/F6 closed, §1.9/§5.6/§5.7/§1.3/§5.9 satisfied). Security SIGN-OFF (audience fail-safe
intact, 3 independent theme-isolation locks, no new unsafe color/url path, no main/preload/IPC/CSP/forge
change). **Remaining:** user observes on dual-screen (toggle light/dark → projector scripture backdrop
now identical; set image/video bg from Settings AND per-slide → renders + plays in preview and on
projector); then commit on request.

## Outcome (2026-06-30 — assessment + plan written; PENDING USER REVIEW)
Root cause found: (1) the projector borrows the operator's UI theme — the "no background set"
gradient backdrop is built from the theme-dependent `--background` token (light near-white vs dark
near-black) in `AudienceView.tsx:194` + `SlidePreview.tsx:113`, and the `/audience` window loads the
same bundle that applies the operator's `localStorage` theme (`index.tsx:12-17`). (2) Background
painting is duplicated across surfaces, so previews diverge from the projector — most visibly a
video background plays on the projector but is frozen in previews (no autoplay/loop in
`SlidePreview`), plus `PreviewSchedulePane`/`SongLivePane` bypass `effectiveBackground`.
The data model / IPC / persistence are SOUND (no schema change needed). Fix proposed in
`plan/background_architecture/proposed-fix.md`: theme-independent `--pp-stage-*` tokens + one shared
`<SlideStage>` surface + theme-isolate the `/audience` window. Implementation deferred to T1–T5 tasks
to be opened only after the user approves the plan.
