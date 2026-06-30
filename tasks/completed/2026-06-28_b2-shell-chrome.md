# B2 — Shell chrome (TopBar, collapsible NavRail, StatusStrip)
- **ID:** 2026-06-28_b2-shell-chrome
- **Phase:** UX-revival (Stage B)
- **Assigned agent type:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Replace the template sidebar/layout with the design's persistent shell so every screen sits inside it.
Built on B1 tokens + primitives. Wires to the Stage-A feature layer (present, search, active-service,
theme). No screen-body redesign here — that's B3–B11; this is the chrome + routing only.

## Scope (files/areas)
- `src/renderer/components/layout/AppLayout.tsx` — new 3-region shell: **TopBar** (top, 52px), **NavRail**
  (left, collapsible), `<Outlet/>` main, **StatusStrip** (bottom). Dark `#070b15` body.
- NEW `src/renderer/components/layout/TopBar.tsx` — logo "PP" + "PraisePresent"; **service selector**
  (uses `useActiveService()` from A6 → `plans.list`/`get`); **global ⌘K search** opening a `command`
  palette over `window.api.search.query` (A6) — Cmd/Ctrl+K opens it; **theme toggle** (`theme.tsx`);
  **LIVE pill** (reflects `present.getState`/`onState` — lit when a slide is live); **Black** button →
  `window.api.present.black()` (kbd `B`).
- NEW `src/renderer/components/layout/NavRail.tsx` — 8 items in design order: Home · Scripture · Songs ·
  Media · Plans · **Live Detect** · **Present** · Settings (Settings pinned at bottom). Active-bar
  styling (3px sage left bar, sage tint bg). **Collapsible** (icon-only ↔ labelled); persist collapse
  in `settings`. Keyboard/aria correct (§5.4).
- NEW `src/renderer/components/layout/StatusStrip.tsx` — audience/display status (`display` IPC),
  bible (WEB offline), live-detect status (`ai.status`), app version.
- `src/renderer/app/router.tsx` — keep **HashRouter**. Mount ALL 8 routes under `<AppLayout>` (move
  Home under the shell too); `/audience` stays chromeless/full-screen. Nav order/labels per design.
- Retire the old `Sidebar.tsx` (delete; §1.9 — no second nav).

## Rules that apply
- §1.2 (HashRouter, never BrowserRouter), §5.4 (keyboard/aria — operated live), §5.6 (tokens not hex,
  extend ui/ primitives — no new one-offs), §1.9 (delete the old sidebar), §1.3 (renderer calls
  `window.api` only). Visual spec: the approved `PraisePresent.dc.html` top bar + rail + status strip.

## Acceptance criteria
- [ ] TopBar: service selector, ⌘K palette (opens on Cmd/Ctrl+K, searches real data), theme toggle,
      LIVE pill reflecting present state, Black button calling `present.black`.
- [ ] NavRail: 8 items in design order, active-bar styling, collapsible (persisted), keyboard-navigable.
- [ ] StatusStrip shows live display/bible/ai/version status.
- [ ] All 8 routes render inside the shell; `/audience` stays chromeless; HashRouter intact.
- [ ] Old `Sidebar.tsx` removed; no dangling imports.
- [ ] tsc 0 · lint 0 · format clean · unit green · package builds · shell e2e (routes render) passes.
- [ ] Reviewer sign-off; UI observed to render.

## Outcome (filled on completion)
Implemented (pending reviewer sign-off — not committed):

**Added**
- `src/renderer/components/layout/TopBar.tsx` — 52px bar: PP logo, service selector
  (`useActiveService` + `plans.list`), ⌘K search trigger, theme toggle (cycles dark→light→system),
  LIVE/BLACK/CLEAR pill (from `present.getState`/`onState`), Black button. Global keydown:
  Cmd/Ctrl+K toggles palette; `B` calls `present.black()` (ignored while typing or palette open).
- `src/renderer/components/layout/NavRail.tsx` — 8 items in design order (Home·Scripture·Songs·Media·
  Plans·Live Detect·Present, Settings pinned bottom). 3px sage active border-l + sage tint bg.
  Collapsible (w-56↔w-16); collapse persisted via `settings` key `ui.navRailCollapsed`; collapsed
  items get tooltips; full aria (nav aria-label, aria-pressed, aria-label per link).
- `src/renderer/components/layout/CommandPalette.tsx` — grouped scripture/songs/media over
  `search.query` (debounced 150ms, race-guarded, `shouldFilter={false}`); selecting a hit navigates
  to the domain page.
- `src/renderer/components/layout/StatusStrip.tsx` — audience display (`display.list`+`getAudience`,
  fail-safe to "No audience display"), bible (WEB·offline), Live Detect (`ai.status`), version.
- `src/renderer/globals.d.ts` — ambient `__APP_VERSION__` declaration.

**Changed**
- `AppLayout.tsx` — 3-region flex shell (TopBar / NavRail+scrollable `<Outlet/>` / StatusStrip),
  `h-screen` dark body.
- `router.tsx` — Home moved under `<AppLayout>`; all 8 routes inside the shell; `/audience` chromeless;
  HashRouter intact.
- `command.tsx` — `CommandDialog` now forwards `shouldFilter`/`filter`/`loop` to the inner `Command`
  (backward-compatible; needed to drive the list from server results).
- `vite.renderer.config.ts` — `define: __APP_VERSION__` from package.json (renderer-only, no IPC).

**Deleted**
- `src/renderer/components/layout/Sidebar.tsx` (no remaining imports).

**Gates:** tsc 0 · lint 0 · format:check clean · 150 unit tests pass · package builds ·
`tests/e2e/shell.spec.ts` passes (1 passed).

**Divergences / notes**
- Nav route for "Plans" stays `/services` (label only changed) so the existing `/services` nested
  routes + `shell.spec.ts` keep working.
- Version is a Vite build-time constant (no `window.api` channel exists for it; renderer-only per §1.3).
- Theme toggle cycles dark→light→system (existing `useTheme` supports all three).
- **For B3–B11 re-skins:** the shell main region is now the scroll container. Existing screen bodies
  still use `min-h-screen` + their own `p-8` and render fine, but re-skinned screens should size to
  content / `h-full` (not `min-h-screen`) and own their internal padding.
- Pre-existing uncommitted Stage-A/B1 work is in the tree; my diff is scoped to the layout/router/
  command/vite files above.

## Outcome appended (2026-06-29 — reviewer SIGN OFF)
Reviewer PASS: HashRouter intact, all 8 routes under shell, /audience chromeless, ⌘K (Cmd+Ctrl) + B-suppression correct, LIVE-pill/listener cleanup no leak, tokens not hex, Sidebar deleted. Gate: tsc 0 · lint 0 · 150 unit · package · shell e2e pass.
