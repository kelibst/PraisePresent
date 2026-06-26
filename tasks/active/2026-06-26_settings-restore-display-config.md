# Restore real Settings — display/output config regressed in Phase 0 purge
- **ID:** 2026-06-26_settings-restore-display-config
- **Phase:** 3/5 (UX readiness)
- **Assigned agent type:** implementer + reviewer (+ security if it touches main/IPC/window placement)
- **Status:** pending

## Why (user feedback 2026-06-26)
"The old settings had a good number of features; the new one is just an empty template." TRUE: the pre-revival app had a real Settings subsystem — **general settings + display/output management** (choosing which monitor is the audience screen, live-display config). It was **purged during the Phase 0 restructure/dead-code cleanup** (commit `02c0bed`). The current `src/renderer/features/settings/SettingsPage.tsx` is minimal (only a real theme toggle, added in the shell-coherence pass `c243ede`).

For a dual-screen worship-presentation app, **display/output configuration is a core feature**, not polish — the operator must pick the audience monitor, especially since `windowManager.audienceTarget()` currently auto-picks the secondary display with no user override.

## Recoverable from git history (don't rewrite blind — read these first)
At pre-revival commit `72956fd` ("Add general settings page") and around `e3255d3` (last commit before this session):
- `src/pages/Settings.tsx`
- `src/components/settings/display/GeneralSettings.tsx`
- `src/services/DisplayManager.tsx`  ← display/monitor detection + selection
- `src/lib/settingSlice.ts`
- `src/dashboard/SettingsPage.tsx`
`git show <commit>:<path>` to recover. NOTE: these were template-era code — they MUST be rebuilt to the current architecture (main-owned display logic via zod IPC §5.2/§5.3; Settings persisted via the existing `window.api.settings.get/set`; NO `electron`/`screen` access from the renderer). Treat the old code as a feature reference, not copy-paste.

## Goal
Rebuild a real Settings page: (1) **Display/output settings** — list connected displays (main process via `screen`, exposed over a new `settings:*`/`display:*` zod IPC), let the user choose the audience display, persist the choice, and have `windowManager` honor it (override the current auto-secondary pick). (2) Keep the theme toggle. (3) Any other general settings worth restoring from the old page.

## Rules
- §1.3/§5.2 (display enumeration + window placement live in MAIN; renderer calls `window.api` only — the old template likely violated this, do NOT reintroduce `screen` in the renderer), §5.3 (zod IPC), §1.5 (persist via settings repo, not ad-hoc), §5.6 (tokens), §5.7 (fail safe). Security sign-off required (touches main/window placement/IPC).

## Acceptance
- [ ] Settings lists real connected displays and lets the user pick the audience screen.
- [ ] Choice persists and `windowManager` places the audience window on it (overrides auto-pick); display hot-plug still safe (R4).
- [ ] Theme toggle retained. No renderer access to `electron`/`screen`.
- [ ] unit/e2e; reviewer + security sign-off.

## Outcome
