# P2-T3 — WindowManager + audience window
- **ID:** 2026-06-26_p2-t3-windowmanager-audience
- **Phase:** 2
- **Assigned agent type:** implementer
- **Status:** done

## Goal
Dual-window presentation foundation: a presenter window sized for authoring + a second audience BrowserWindow on the secondary display. Live state owned by main; broadcast slide/black/blank/clear via typed events. Fails safe to black; survives display hot-plug.

## Scope (files/areas)
- `src/main/windows/windowManager.ts` — presenter (proper authoring size, not 800×600) + audience window on secondary `screen` display.
- `src/audience/` — audience renderer entry (HashRouter/minimal); mirrors a hard-coded test slide; black/blank/clear states.
- Typed main→renderer broadcast channels (`present:*`) per §5.3; main owns live state.
- Handle `screen` display-added/removed gracefully.

## Rules that apply
- CLAUDE.md §1.4 (window security), §5.2, §5.7 (audience path fails safe to black, never crash)
- Phase brief: plan/phases/phase-2-foundation.md#t3

## Acceptance criteria
- [ ] Presenter opens on display 1; audience targets display 2 (or graceful fallback on single-display)
- [ ] Audience mirrors a test slide; black/blank/clear works
- [ ] **Fails safe to black**, never a crash (R4)
- [ ] Survives monitor hot-plug (display add/remove)
- [ ] reviewer + **security** sign-off (window config)

## Outcome (filled on completion)
**2026-06-26.** `windowManager.ts` owns presenter + audience BrowserWindows with shared `hardenWindow()` (deny window-open, will-navigate allow-list, contextIsolation/sandbox/nodeIntegration, DevTools only !isPackaged). Audience targets the secondary display (screen API) with single-display fallback + fullscreen/frameless only on a real 2nd screen; `display-added/removed/metrics-changed` re-place it, blacking out on failure (R4). Live `present` state owned by main, broadcast on `present:state`; presenter sets via `present:set-state` (zod-validated). Audience = same bundle at `#/audience` → `AudienceView`, **fails safe to black** for black/clear/unexpected (§5.7). e2e proves presenter→audience mirror + black-out.
- **Hardware limit:** dual-monitor placement + hot-plug couldn't be verified on real hardware (single display here); the security reviewer assessed the code paths correct by inspection.
- **Security sign-off: GRANTED.**
