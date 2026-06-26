# T5 — Electron security hardening (S1–S4)
- **ID:** 2026-06-26_t5-electron-security-hardening
- **Phase:** 0
- **Assigned agent type:** security
- **Status:** done

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
**2026-06-26.** All of S1–S4 in place in `src/main/index.ts` + `index.html`:
- **S1:** explicit `contextIsolation:true, sandbox:true, nodeIntegration:false`.
- **S2:** CSP via `session.defaultSession.webRequest.onHeadersReceived` (prod = strict `script-src 'self'`, no inline/eval/remote, + `object-src 'none'`/`form-action 'none'`/`frame-ancestors 'none'`; dev relaxes to `'unsafe-inline'` + `ws/http://localhost:*` for Vite HMR) **and** a baseline `<meta>` CSP in index.html. To keep prod `script-src 'self'` clean, the inline theme `<script>` was removed from index.html and relocated into the bundle (`renderer/index.tsx`) — also removes a duplication with ThemeProvider.
- **S3:** `openDevTools()` gated behind `if (!app.isPackaged)`. **Verified empirically:** packaged run shows **0** devtools references (vs 3 before).
- **S4:** `setWindowOpenHandler` deny-by-default (https→`shell.openExternal`); `will-navigate` allow-list (dev server URL + `file://`). Hash-router nav unaffected (same-document).
- **S6:** Fuses + `asar:true` untouched (kept).
- **Verified:** packaged binary launches, **0 CSP console violations**, renderer boundary clean (§5.2).
- **Security sign-off: GRANTED** by separate security-reviewer agent (§7, §9). Non-blocking follow-ups: (1) `onHeadersReceived` may not fire for `file://` — worst case the meta floor (still default-deny) governs; recommend tightening the meta to the strict prod policy + dev-server override in a later phase. (2) `openExternal` has no host allow-list (fine for Phase 0).
