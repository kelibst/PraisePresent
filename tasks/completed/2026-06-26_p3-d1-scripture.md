# P3-D1 — Scripture domain (critical path)
- **ID:** 2026-06-26_p3-d1-scripture
- **Phase:** 3
- **Assigned agent type:** implementer + reviewer + tester + security
- **Status:** in-progress

## Goal
ScriptureService + bibleRepository; Bible schema (translations/books/chapters/verses) + FTS5 index; BibleApiClient hydrates SQLite once → offline-first; search by reference, keyword, topic; projection formatting + auto-split; project to audience via Phase 2 broadcast.

## Scope
- `src/main/db/`: bible schema migration + FTS5; `bibleRepository`. `src/main/services/scriptureService.ts`. `src/main/net/bibleApiClient.ts` (CSP connect-src adds the host via Phase 2 mechanism). `src/renderer/features/scripture/`.

## Rules
- §1.5, §5.3, §5.5, §5.7. Profiling gate (FTS5 vs Rust napi-rs — file task if insufficient). Licensing R17: ship only permissively-licensed translations (WEB); verify terms before bundling.

## Acceptance
- [ ] reference/keyword/topic search returns correct verses **offline**
- [ ] selecting a verse projects dual-screen
- [ ] search benchmarked; Rust task filed if FTS5 insufficient
- [ ] licensing cleared for shipped texts
- [ ] reviewer + security sign-off

## BLOCKERS (needs user decision/assets)
- Which Bible translation(s) to bundle (licensing — default WEB public-domain); whether a Bible API key/host is available for hydration.

## Design decisions (PM, 2026-06-26)
- **Dataset SOURCED + licensing CLEARED:** getbible v2 `https://api.getbible.net/v2/web.json` — World English Bible, **`distribution_license: "Public Domain"`**, 66 books, 31,095 verses (Gen→Rev). Provenance: ebible.org / Michael Paul Johnson.
- **Bundling:** `scripts/generate-bible-data.mjs` fetches the raw JSON at DEV time, normalizes to a compact shape, and writes a **gzipped** bundle (`web.json.gz`, ~1.4MB) committed to the repo. Hydration reads the bundle at runtime — NO network at runtime (offline-first). Generator documents provenance; output is committed so builds are reproducible offline.
- **Migration 5** (forward-only): `bible_translations`, `bible_books` (canonical 1–66 w/ name, abbreviation, testament, osisId), `bible_verses (translation_id, book_id, chapter, verse, text)` UNIQUE(translation_id,book_id,chapter,verse), + FTS5 `bible_verses_fts` (external-content, `tokenize='porter unicode61'`) populated at hydration.
- **Reference parser** is a PURE module (`scriptureReference.ts`) → Vitest-testable without the native DB ("John 3:16", "Gen 1:1-3", "Psalm 23", "1 John 2").
- **Asset shipping:** the .gz must be present in BOTH `bun run dev` and the PACKAGED asar (extend the forge `packageAfterCopy` hook or Vite copy) → security sign-off (touches forge.config.ts).

## Outcome (DONE 2026-06-26)
Full Scripture vertical slice shipped. **Reviewer PASS + Security SIGN-OFF** (both re-ran the gate / threat-modeled the diff independently; implementer did not self-review — §7).

**Built:** migration 5 (`bible_translations`/`bible_books`/`bible_verses` + external-content FTS5 `bible_verses_fts`, `tokenize='porter unicode61'`); `bibleRepository` (parameterized queries only; idempotent `hydrate()`, reference lookup, bm25 keyword search); pure `scriptureReference.ts` parser (Vitest-tested: ranges, numbered books, abbreviations, whole-chapter, bad input); `bibleBundle.ts` (main-only gz loader, packaged `process.resourcesPath` + dev repo-root resolution); `scriptureService` (offline hydration, fail-safe); `scriptureHandlers` (zod via `handle()` registry); `scripture:*` channels + preload bridge (fixed channels); `ScripturePage.tsx` (reference/keyword tabs, present-to-audience reusing `present.setState`); `/scripture` route; `scripts/generate-bible-data.mjs` (dev-time generator, hard-fails unless `distribution_license === "Public Domain"`).

**Dataset:** `resources/bible/web.json.gz` — **1.24 MB gz** (4.17 MB raw), World English Bible, **Public Domain**, 66 books / 31,095 verses (Gen→Rev). Shipped via forge `extraResource: ['resources/bible']`; verified present in `out/.../resources/bible/`. **No runtime network** — fully offline.

**Acceptance:** reference/keyword search correct + offline ✔; verse projects dual-screen (e2e asserts audience window) ✔; **benchmarked: FTS5 keyword ~1.1ms, reference lookup (Psalm 119/176v) ~4ms → no Rust task needed** ✔; licensing cleared (WEB public-domain) ✔; reviewer + security sign-off ✔.

**Gate:** tsc 0 · lint 0 · format clean · **38 Vitest unit** (was 25) · **8 Playwright-Electron e2e** (was 7) · package ships the asset.

**Post-review cleanup (§1.9):** removed two newly-introduced dead stacks before close — `getChapter` (full repo→service→channel→handler→bridge→schema stack, no caller) and `chunkForProjection` (exported+tested, never wired). Both belong to D2 (chapter browse / multi-verse slide navigation) and will be rebuilt there in context. `listTranslations`/`listBooks` kept (standard domain `list` surface; forward-looking picker).

**Follow-ups handed to D2 (presentation engine):** (a) multi-verse passage projection needs slide chunking + next/prev navigation; (b) chapter-browse UI (re-add a get-chapter path). Both logged in context.md §7.

Not committed by the implementer; PM committed after sign-off.