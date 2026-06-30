# B3 — Home / Dashboard screen re-skin
- **ID:** 2026-06-29_b3-home-screen
- **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin `src/renderer/features/home/HomePage.tsx` to the approved design's dashboard, on real data,
inside the new shell. Greeting · CTA cards (Continue last service / New service) · Recent services ·
Quick-jump · Audience-status banner.

## Scope
- `src/renderer/features/home/HomePage.tsx` (only this feature dir).
- Data: `window.api.plans.list()` (recent + last service), `window.api.display.list()/getAudience()`
  (audience banner), navigation via react-router. Use `useActiveService()` (A6) for "continue last".

## Rules
- §1.3 (window.api only), §5.4 (keyboard/aria), §5.6 (B1 tokens, shared atoms, no hex), §1.9.
- Consume shared atoms `@/renderer/components/common` (ScheduleRow for recent rows) + `ui/` primitives.
- Size to content (no `min-h-screen`); shell owns the scroll; own internal padding.

## Acceptance
- [ ] Matches design: greeting, 2 CTA cards, recent-services list (real plans), quick-jump tiles, audience banner (real display state).
- [ ] CTAs navigate correctly; audience banner reflects real connection; fails safe when no display.
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer sign-off + observed render.

## Outcome (filled on completion)
Re-skinned `src/renderer/features/home/HomePage.tsx` to the approved Home/Dashboard, all
on real `window.api` data inside the new AppLayout shell. Single file changed (no subcomponents
needed).

Sections & their real data:
- **Greeting** — local `Date`: sage uppercase "Weekday · Month D" line, 30px "Good
  morning/afternoon/evening, <church>." (hour-based), muted subtext.
- **CTA cards** — "Continue last service" (wider, `from-pp-accent`→`pp-accent-deep` gradient,
  play-circle, arrow → `/present`): shows the active service from `useActiveService()` (A6),
  falling back to the most recent plan from `plans.list()`; meta is real item count (only when the
  active plan is resolved, since `PlanSummary` omits `items`) · scheduled date. "New service"
  (plus icon → `/services`).
- **Recent services** — `window.api.plans.list()`, first 6, via shared `ScheduleRow`
  (onClick → `/services/{id}`); `PaneHeader` shows total count.
- **Quick jump** — 3 tiles (Scripture/Songs/Media), sage-tinted icons → navigate.
- **Audience banner** — real `display.list()`+`getAudience()` resolved exactly like StatusStrip
  (persisted choice → first non-primary → primary). Connected: glowing `animate-pp-pulse` success
  dot + "Audience display ready" + label·resolution. Fails safe to neutral "No audience display"
  on empty/error (§5.7). "Display setup" → `/settings`.

Placeholders / divergences:
- **Church name** — hard-coded `CHURCH_NAME = 'PraisePresent'`; no `church.name` setting exists yet.
  Isolated to one const for a one-line swap later.
- **Recent-row icon** — `ScheduleRow` maps a fixed type→icon and takes no custom icon; the atom is
  owned by another agent (`components/common/`), so recent rows use `type="announcement"` (megaphone)
  rather than the spec's calendar. No fork of the shared atom (§1.9).
- **Item counts on recent rows** — not shown; `PlanSummary` has no `items`, and an N+1 `plans.get`
  per row was avoided. Counts appear only on the Continue card via the already-resolved active plan.

Verify: `bunx tsc --noEmit` 0 · `bun run lint` 0 · `bun run format:check` clean · `bun run test`
162/162 green. Did NOT commit (per brief). Reviewer sign-off + observed render pending (PM).

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
