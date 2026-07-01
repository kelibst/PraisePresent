# M3 — Bible management in Settings
- **ID:** 2026-06-29_m3-bible-management-settings · **Phase:** UX-merge (M3) · **Agent:** implementer (+ reviewer; security if new IPC)
- **Status:** in-progress

## Goal
Turn Settings → Bible from a read-only stub into real management: list installed translations, **set the
default translation** (persisted), and an **import/manage** affordance for translations. Real download/import
of a new translation is **deferred behind a stable interface** (no public PD source wired here — show a clear
"not available in this build / bundled WEB only" state, like the whisper stub). Independent of the M1 merge.

## Scope (files)
- `src/renderer/features/settings/BibleSettings.tsx` — translations list (`scripture.listTranslations`),
  a "Default translation" selector persisted via `settings` key `scripture.defaultTranslation` (B10 already
  introduced this key — reuse it), and an "Add / import translation" affordance (manage list, set default,
  remove non-bundled). Offline/bundled badges.
- IF an import action is wired: add `scripture:importTranslation` (+ maybe `scripture:removeTranslation`)
  channel + zod schema + main handler that, for now, is a guarded **stub** returning a clear status (never a
  fake success); preload + `api.d.ts`. If you instead keep import as a disabled affordance with no channel,
  that's acceptable (note it) — no fake controls (§1).
- Ensure the scripture source (used by the Present screen, post-M1) reads the default translation; if that
  wiring belongs to M1's screen, just persist the key here and note it for M1.

## Rules
§1.3 (window.api only), §1.7/§5.3 (zod IPC if added), §5.5 (reuse bibleRepository/scriptureService — no
duplication), §5.6 (tokens/primitives, no hex), §1.9, §1 (no fake-ready controls). Security sign-off if new IPC.

## Acceptance
- [ ] Settings → Bible lists real translations, sets + persists a default, shows offline/bundled state.
- [ ] Import/manage affordance is either wired to a guarded stub channel (clear "not available" status) or a clearly-disabled control — never faked.
- [ ] No duplicated Bible logic; reuses existing scripture IPC/services.
- [ ] tsc 0 · lint 0 · format clean · unit green; settings e2e still green. Reviewer (+ security if IPC) sign-off.

## Outcome (filled on completion)

**Status:** done (reviewer SIGN OFF 2026-06-29)

**What changed**
- `src/renderer/features/settings/BibleSettings.tsx` — rebuilt from the read-only stub into the
  canonical Bible-management panel: (1) a **Default translation** selector (`ui/select`) persisted via
  `settings.set(DEFAULT_TRANSLATION_KEY)` with a transient "Saved" status; (2) the **Installed
  translations** list with an `Offline` section badge and per-row `Default` / `Bundled` badges; (3) a
  deferred **Add translation** affordance — a clearly **disabled** `Button` wrapped in a focusable span
  with an explanatory `Tooltip` ("not available in this build … offline WEB text only"). All data via
  `window.api.scripture.listTranslations` + `window.api.settings.get/set` (§1.3). Tokens only, no hex.
- `src/shared/schemas/scripture.ts` — added `export const DEFAULT_TRANSLATION_KEY = 'scripture.defaultTranslation'`
  as the single source of truth for the persisted key.
- `src/renderer/features/settings/GeneralSettings.tsx` — **removed** the duplicate default-translation
  section (selector + state + load/save) and its now-unused `DEFAULT_TRANSLATION_KEY` declaration and
  Select/translation imports. General now owns only theme + startup. This resolves the §1.9 "one way to
  do a thing" issue: the default translation lives exclusively in Settings → Bible.

**Default-translation persistence:** key `scripture.defaultTranslation` via `settings:get/set` (truth in
SQLite). Loads stored value, else falls back to the first installed translation. The Scripture browser
should read this key when M1 lands (note for M1 — no screen wiring done here, per scope).

**Import/manage presentation:** chose option (b) — a clearly-disabled control with tooltip — over a stub
channel. Rationale: only bundled WEB exists and no download source is wired, so a disabled+explained
affordance is equally honest (§1, no fake success), stays within renderer-only scope, and avoids adding
an unused IPC surface that would need a security review. Remove/un-bundle of translations is not offered
since all installed translations are bundled (non-removable) in this build.

**Settings e2e:** `tests/e2e/settings-persist.spec.ts` uses only the generic `settings.set/get('lang')`
flow with no Bible/translation selectors — unaffected, no changes needed.

**Verification:** `bunx tsc --noEmit` → 0 · `bun run lint` → 0 · `bun run format` + `format:check` clean ·
`bun run test` → 170 passed (21 files).

**Divergences:** none from the brief. Note for PM/M1: the default-translation control was previously
(unexpectedly) duplicated in GeneralSettings; consolidated here per §1.9.

## PM sign-off (2026-06-29)
Reviewer SIGN OFF: window.api-only, default-translation persists via settings, §1.9 dup removed from GeneralSettings, "Add translation" honestly disabled (no fake/no new IPC), tokens not hex. tsc 0 · lint 0 · 170 unit.
