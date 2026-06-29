# B10 — Settings re-skin (sub-nav: General · Display · Bible · AI & Privacy · About)
- **ID:** 2026-06-29_b10-settings-screen · **Phase:** UX-revival (Stage B) · **Agent:** implementer (+ reviewer; security for AI&Privacy/keys)
- **Status:** done (reviewer SIGN OFF 2026-06-29)

## Goal
Re-skin the Settings feature to the design's left sub-nav + content layout, covering the design's 5
sections, on real data. Surfaces the Stage-A AI controls (agent, API key, kill-switch, online opt-in)
and display safety (safe-area, black-on-disconnect).

## Scope
- `src/renderer/features/settings/` — SettingsPage.tsx (sub-nav shell) + GeneralSettings.tsx +
  DisplaySettings.tsx + new AiPrivacySettings.tsx (+ Bible/About stubs).
- Data: theme (`lib/theme.tsx`); `settings.get/set` (translation default, startup, safe-area %, black-on-disconnect);
  `display.list/getAudience/setAudience`; `scripture.listTranslations`; AI: `ai.listAgents/setAgent/setEnabled/setOnline/setAutoProject/setApiKey/hasKey/clearApiKey/modelStatus/status`. Reuse `ui/` switch/select/tabs/input.

## Rules
§1.3 (window.api only), §1.7 (**API key value never displayed — only hasKey/masked hint; never log**),
§5.4 (keyboard/aria), §5.6 (tokens, no hex, reuse primitives), §1.9. **Security sign-off for the AI&Privacy/key UI.**

## Acceptance
- [ ] Sub-nav tabs (General/Display/Bible/AI&Privacy/About) with sage active styling.
- [ ] General: theme toggle (dark/light/system), default translation, on-startup.
- [ ] Display: monitor diagram (`display.list`/`getAudience`/`setAudience`), safe-area slider (`display.safeAreaPct`), black-on-disconnect switch (`display.blackOnDisconnect`).
- [ ] AI & Privacy: agent grid (`listAgents`/`setAgent`), masked API-key input (`setApiKey`/`hasKey`/`clearApiKey` — value never shown), online opt-in (`setOnline`), kill-switch (`setEnabled`), auto-project threshold (off by default).
- [ ] Existing settings + display behaviors still persist (settings-persist / display e2e green).
- [ ] tsc 0 · lint 0 · format clean · unit green. Reviewer + security sign-off + observed render.

## Outcome (filled on completion)
Reworked Settings into a 218px left sub-nav (General · Display · Bible · AI & Privacy · About) with a
sage active-bar, rendering inside the shell's scrollable <main> (`h-full`, own internal scroll).

Files changed/added (all in `src/renderer/features/settings/`):
- `SettingsPage.tsx` — reworked sub-nav shell (5 sections, sage active-bar via `bg-primary`).
- `GeneralSettings.tsx` — extended: kept theme (useTheme); added Default translation (`scripture.listTranslations`
  → persisted `scripture.defaultTranslation`) and On-startup radios (persisted `app.onStartup`).
- `DisplaySettings.tsx` — extended: kept audience-display selection; added two-monitor diagram, safe-area
  slider (`display.safeAreaPct`) and black-on-disconnect switch (`display.blackOnDisconnect`), using the
  shared parsers in `src/shared/schemas/display.ts`.
- `AiPrivacySettings.tsx` (new) — privacy banner (`ai.status`), kill-switch (`setEnabled`), agent grid
  (`listAgents`/`setAgent`, OFFLINE/ONLINE pills), masked API key (`setApiKey`/`hasKey`/`clearApiKey`),
  online opt-in (`setOnline`), off-by-default auto-project guard (`setAutoProject`).
- `BibleSettings.tsx` (new) — read-only installed-translations list (`listTranslations`), Offline badge.
- `AboutSettings.tsx` (new) — version (`__APP_VERSION__` build-time define) + app/scripture info.

API-key invariant (§1.7): the typed key lives only in local `draft` state, is sent to `ai.setApiKey`, and
`setDraft('')` clears it on every path immediately after; the value is never read back, rendered, or logged.
The input is `type="password"`; UI reflects only `hasKey`/masked `hint` from main.

Verification: `tsc --noEmit` 0 · `lint` 0 · `format`/`format:check` clean · unit 170/170 green ·
e2e `display.spec.ts` + `settings-persist.spec.ts` green.

E2e change required by the shell (noted for PM batch): the shell's TopBar now renders a `role="status"`
"Audience output: …" pill, so `display.spec.ts`'s nameless `getByRole('status')` resolved to 2 elements.
Fixed by scoping to the Saved indicator: line 61 changed to
`await expect(w2.getByRole('status', { name: /Saved/ })).toBeVisible();`, and the Saved spans in
General/Display now carry `aria-label="Saved"` so the name query matches. (This is the only test edit.)

Divergences from spec: the Display "Test pattern" affordance was omitted — there is no IPC surface for a
test pattern (`present.*` has no such method), and §1 forbids fake controls. Flagged for a follow-up if a
`present`/`display` test-pattern channel is added.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF (B10 + security SIGN OFF on the API-key/AI-privacy UI — key never rendered/logged; B9/B11 fail-safe + R8 verified). Part of the Stage-B gate: tsc 0 · lint 0 · format clean · 170 unit · package · 17 e2e all GREEN.
