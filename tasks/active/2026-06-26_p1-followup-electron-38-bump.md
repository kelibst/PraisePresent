# Follow-up — Electron major bump to 38.8.6+ (residual CVEs)
- **ID:** 2026-06-26_p1-followup-electron-38-bump
- **Phase:** 1 (follow-up; execute when a major-bump window is acceptable)
- **Assigned agent type:** implementer + security
- **Status:** pending

## Goal
P1-T3 bumped Electron 36.2.0 → 36.9.5, which resolved the **ASAR integrity bypass** (GHSA-vmqv-hx8q-j7mg) — the advisory that directly defeats this app's `EnableEmbeddedAsarIntegrityValidation` + `OnlyLoadAppFromAsar` fuses. **Three other moderate advisories remain**, fixed only in Electron `<38.8.6` (i.e. require 38.8.6+):
- AppleScript injection in `app.moveToApplicationsFolder` on macOS (GHSA-5rqw-r77c-jp79)
- Service worker can spoof `executeJavaScript` IPC replies (GHSA-xj5x-m3f3-5x3h)
- Incorrect origin in permission request handler for iframe requests (GHSA-r5p7-gp4j-qhrx)

These were deferred because 36→38 is a **major** bump (potential breaking changes, native-module/forge compatibility) and the brief defers majors. Practical risk is currently low (no service workers, no iframes, `moveToApplicationsFolder` unused), but they should be closed.

## Scope (files/areas)
- `package.json` electron `^36.9.5` → `^38.8.6` (or latest); re-run build + e2e + `bun audit`.
- Verify `@electron-forge/*` 7.8 + `@electron/fuses` compatibility with Electron 38; bump forge if needed.
- Re-verify all S1–S4 + Fuses still apply under Electron 38.

## Rules that apply
- CLAUDE.md §1.7, §5.10 (one bump per PR), §7 (security sign-off)

## Acceptance criteria
- [ ] Electron 38.8.6+; the 3 residual advisories cleared in `bun audit`
- [ ] App builds + packaged smoke + e2e green on all 3 OSes (CI)
- [ ] Security sign-off

## Outcome (filled on completion)
