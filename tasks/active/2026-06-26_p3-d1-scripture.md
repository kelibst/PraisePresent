# P3-D1 — Scripture domain (critical path)
- **ID:** 2026-06-26_p3-d1-scripture
- **Phase:** 3
- **Assigned agent type:** implementer + reviewer + tester + security
- **Status:** pending

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

## Outcome
