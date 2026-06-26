# P3 — Shell / navigation coherence pass
- **ID:** 2026-06-26_p3-shell-coherence
- **Phase:** 3 (integration/polish across domains)
- **Assigned agent type:** implementer + reviewer
- **Status:** in-progress

## Goal
Every sidebar link lands on a real page; no blank routes; no permanent "Loading…" hang; the first screen (Home) is real, not template fake data. Discovered during an observed run: Settings/Media are dead links, Home is template cruft with fake services that link to non-existent plan ids, and ServiceDetail hangs on "Loading…" when a plan isn't found.

## Root causes found (PM)
- `src/renderer/components/layout/Sidebar.tsx` links `/media` and `/settings`, but the router has NO route for either → blank page. (`SettingsPage.tsx` EXISTS but was never routed; `/media` has no page at all — only a README.)
- `src/renderer/features/home/HomePage.tsx` is TEMPLATE CRUFT: a hardcoded fake `services` array ("Sunday Worship / Pastor John"…), a `New Service` button that does `alert('to be implemented')`, and cards that `navigate('/services/1')` etc. — plan ids that don't exist (§1.5 fake-data + §1.9 violations).
- `src/renderer/features/planning/ServiceDetail.tsx:101` renders `<div>Loading…</div>` whenever `plan` is null, with NO not-found/error state. `plans.get(badId)` returns `{ok:true, data:null}`, so `if (p.ok) setPlan(p.data)` sets null → permanent "Loading…". This is the "Services loading and nothing" symptom.

## Scope (files)
- `src/renderer/app/router.tsx` — add `/settings` + `/media` routes (under `<AppLayout>`).
- `src/renderer/features/settings/SettingsPage.tsx` — wire it (keep stub content but make it honest; remove the dead "Toggle Theme (coming soon)" blue button or make it real-but-clearly-pending; use brand tokens not raw blue).
- `src/renderer/features/media/MediaPage.tsx` — NEW honest placeholder ("Media library — coming in Phase 3 · D4") with brand styling, so the link lands somewhere real. (Do NOT build D4 functionality.)
- `src/renderer/features/home/HomePage.tsx` — REWRITE: remove fake `services` + the alert. Real landing: app identity + quick-action links to the real domains (Scripture, Songs, Services, Present, Media, Settings), and a real "Recent services" list from `window.api.plans.list()` with a working "New service" (create + navigate, mirror ServicesPage), or a clean empty state ("No services yet — create one") when none. Use the brand Deep Purple `primary` token (NOT `bg-blue-800`/`blue-600`).
- `src/renderer/features/planning/ServiceDetail.tsx` — add explicit states: in-flight `loading` vs `notFound` (plans.get returned null) vs loaded. Not-found shows a real message + a "Back to services" link; never hangs. (Distinguish a genuine `ok:false` error too — show an error message.)
- Sweep `src/renderer/components/layout/Sidebar.tsx` + router so EVERY link has a route and EVERY route is reachable; brand-token the active/hover states if they use raw blue.

## Rules that apply
- CLAUDE.md §1.5 (no fake data — truth from `window.api`), §1.9 (delete template cruft you touch; no second way), §5.2 (renderer calls only `window.api`), §5.4 (keyboard/accessible, function components, no business logic in components), §5.6 (design tokens — brand Deep Purple `#5E3B9E` via the `primary` token; NO hard-coded hex/`blue-*` in the pages you touch), §5.7 (no raw errors to the user), §5.9 (PascalCase pages, <300 LOC).
- Phase brief: this is a cross-domain integration pass (not in the original phase-3 task list — PM-created).

## Acceptance criteria
- [ ] Clicking EVERY sidebar item (Home, Scripture, Songs, Media, Present, Services, Settings) lands on a real, rendered page — zero blank routes.
- [ ] Home shows real data (or a real empty state) — no fake `services`, no `alert`, no links to non-existent ids.
- [ ] ServiceDetail never hangs: shows loading, then either the plan, a not-found message (+back link), or an error — verified by navigating to a bad id (e.g. `/services/999999`).
- [ ] Pages touched use brand tokens, no raw `blue-*`/hex.
- [ ] tsc 0 · lint 0 · format clean · unit green · `bun run package` · e2e green (add an e2e asserting each route renders non-blank + ServiceDetail bad-id shows not-found, NOT a hang). Strip `ELECTRON_RUN_AS_NODE` per existing specs.
- [ ] reviewer signed off.

## Outcome (DONE 2026-06-26) — Reviewer PASS
Shell coherence pass shipped (renderer-only; no main/IPC/preload/forge → no security review needed).
- **Dead links fixed:** wired `/settings` (page existed, was never routed) + new honest `/media` placeholder (MediaPage — "coming in D4"). All 7 sidebar links now resolve to real pages (reviewer cross-checked Sidebar↔router; e2e asserts each renders non-blank).
- **HomePage rewritten:** removed fake `services` fixture ("Sunday Worship/Pastor John"), the `alert('to be implemented')`, and the `/services/1..3` links to non-existent ids (the root cause of the "Loading…" hang). Now: app identity, quick-action links to real domains, real **Recent services** from `plans.list()`, working **New service** (create+navigate), clean empty state. No fake data (§1.5).
- **ServiceDetail hang fixed:** `status: loading|ready|notfound|error` state machine. `plans.get` → `{ok:true,data:null}` now renders "Service not found." + Back link (was a permanent "Loading…"); `{ok:false}`/bad id handled; no raw error leaked (§5.7). e2e drives `/services/999999` and asserts not-found, not a hang.
- **Brand:** set the shared `--primary` token in `globals.css` to Deep Purple `#5E3B9E` (HSL `261 46% 43%`; dark `261 45% 70%`) — single source of truth, so the WHOLE app is now on-brand. Zero raw `blue-*`/hex remain anywhere in `src/renderer` (reviewer grep). Settings theme toggle made real (wired to existing ThemeProvider, accessible radiogroup).

**Gate:** tsc 0 · lint 0 · format clean · **62 unit** · **11 e2e** (+`shell.spec.ts`) · package OK. Reviewer PASS (2 non-blocking nits).

**REMAINING (hardware/eyeball, coordinate w/ user):** visual confirmation of the new Deep Purple brand in BOTH light + dark mode (contrast math is sound; live legibility of the lightened dark-mode purple should be eyeballed).
