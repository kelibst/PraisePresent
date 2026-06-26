# T5 — Electron security hardening (S1–S4)
- **ID:** 2026-06-26_t5-electron-security-hardening
- **Phase:** 0
- **Assigned agent type:** security
- **Status:** pending

## Goal
Bring the main process and window config to the §1.4 security baseline: isolation/sandbox on, strict CSP, DevTools gated, navigation/window-open locked down. App still launches with no CSP console violations in normal use.

## Scope (files/areas)
- `src/main/index.ts` (post-T3 path) — `webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }` explicit.
- CSP: meta tag in `index.html` **and** `session.defaultSession` response header. Default-deny; `connect-src` widened per-domain in later phases.
- `if (!app.isPackaged)` guard around `openDevTools()`.
- `webContents.setWindowOpenHandler` (deny by default) + `will-navigate` allow-list.
- Keep existing Fuses config (§S6) and `asar: true` in `forge.config.ts`.

## Rules that apply
- CLAUDE.md §1.4 (security defaults), §5.2 (process boundaries), §5.7 (resilience)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t5

## Acceptance criteria
- [ ] All four items (isolation/sandbox/nodeIntegration, CSP, DevTools guard, navigation/window-open) in place
- [ ] App still launches; no CSP console violations in normal use
- [ ] Fuses + asar retained
- [ ] **security** agent (separate from implementer) signs off
- [ ] `tsc`/lint clean

## Outcome (filled on completion)
<CSP policy used, handlers added, sign-off note>
