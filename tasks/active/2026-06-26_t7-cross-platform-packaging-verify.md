# T7 — Cross-platform packaging verification
- **ID:** 2026-06-26_t7-cross-platform-packaging-verify
- **Phase:** 0
- **Assigned agent type:** tester
- **Status:** blocked (Linux verified; Windows/macOS require other OSes or CI)

## Goal
Confirm the restructured, hardened, router-fixed build packages and runs on ≥2 OSes: window opens, theme applies, routing works, and no DevTools in the packaged build. This is the Phase 0 exit verification.

## Scope (files/areas)
- `npm run make` artifact; launch on Linux + Windows (macOS if available).

## Rules that apply
- CLAUDE.md §6 (done = it runs), §5.8 (testing)
- Phase brief: plan/phases/phase-0-stabilize-and-restructure.md#t7

## Acceptance criteria
- [ ] Packaged app verified on ≥2 OSes
- [ ] Window opens; theme applies; routing works (B1 closed in packaged build)
- [ ] No DevTools in packaged build
- [ ] Results recorded in Outcome
- [ ] reviewer signed off

## Outcome (partial — 2026-06-26)
**Linux (x64) — VERIFIED** via `bun run package` (this dev environment):
- Packaged 188 MB binary launches and stays running; renderer renders over `file://`.
- **No DevTools** in the packaged build (0 references; was 3 pre-T5) — S3 closed in prod.
- **No CSP console violations** during normal launch.
- HashRouter loads (B1 fix) — app renders cleanly over `file://` where BrowserRouter would have failed. Theme applies (bundle theme-init + globals.css).
- Output verified: `.vite/build/{main.js,preload.js}` (no `index.js` collision).

**Installer `make` (rpm/deb) — NOT run here:** needs `rpmbuild`/`dpkg`+`fakeroot` system binaries (absent); `MakerZIP` is darwin-only. Verified via `package` instead.

**Windows / macOS — NOT VERIFIED:** this environment is Linux-only. **Blocking the exit-gate "≥2 OSes" item.** Resolve via either (a) the Phase 1 CI matrix (Windows/macOS/Linux runners running `bun run make`), or (b) manual runs on your Windows/macOS machines. Recommend folding into the Phase 1 CI work.
