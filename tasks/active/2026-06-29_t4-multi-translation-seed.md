# Seed multiple public-domain Bibles + wire translation-aware scripture
- **ID:** 2026-06-29_t4-multi-translation-seed
- **Phase:** 3 (D1 Scripture)
- **Assigned agent type:** implementer (+ reviewer + security pending)
- **Status:** in-progress (implementation + tests done; awaiting reviewer + security sign-off)

## Goal
Bundle several offline public-domain Bible translations and make the whole scripture stack
translation-aware: every read is scoped to the active translation, switchable from the Scripture
pane and Settings → Bible via the shared `scripture.defaultTranslation` setting. WEB stays the
seed default.

## Scope (files/areas)
- `scripts/generate-bible-data.mjs` — generalized from WEB-only to a configured PD set
  (WEB, KJV, ASV, YLT, BBE, WBT/Webster) via getbible v2; per-translation license assertion
  (fail-loud), 66-book + verse-count validation; writes `resources/bible/<key>.json.gz` each.
- `resources/bible/*.json.gz` — 6 bundles (web, kjv, asv, ylt, basicenglish, wb), ~1.3 MB gz each.
- `src/main/services/bibleBundle.ts` — `loadBibleBundles()` scans the bible dir for all `*.json.gz`.
- `src/main/db/repositories/bibleRepository.ts` — all reads now take `translationId`
  (listBooks/getChapter/lookupReference/searchKeyword); added `getTranslationId`,
  `getDefaultTranslationId` (prefers WEB), `rebuildFts`, and a deferred-FTS option on `hydrate`.
- `src/main/services/scriptureService.ts` — hydrate all bundles (defer FTS → one rebuild),
  seed WEB as default on first run, resolve the active translation from settings per read.
  Public service API unchanged (AI detector / search service / IPC handlers untouched).
- `src/renderer/features/scripture/SearchPane.tsx` — translation chip → live `<select>` switcher
  that persists the shared key and re-resolves the staged passage in the new translation.
- `src/renderer/features/settings/BibleSettings.tsx` — copy fix (ships 6 translations, not WEB-only).
- `tests/e2e/scripture.spec.ts` — new multi-translation regression test.

## Rules that apply
- §1.5 offline-first / truth in SQLite · §1.7/§5.3 (no new IPC; reuses settings + scripture channels)
- §5.5 repository layer, parameterized queries · §5.6 tokens only · §1.9 one source of truth
- §7 / R17 licensing gate — only public-domain text bundled (KJV note documented in generator)

## Acceptance criteria
- [x] 6 PD translations bundled and hydrated side by side.
- [x] Reads scoped to the active translation (no cross-translation duplication).
- [x] Translation switch persists + re-resolves; WEB seed default preserved.
- [x] tsc 0 · lint 0 · prettier clean · 257 unit tests · scripture e2e (3 incl. new multi-translation).
- [x] Reviewer sign-off — PASS (code clean; one minor callback-stability fix applied in SearchPane).
- [x] Security sign-off — PASS (all SQL parameterized, no secrets, no new IPC, fail-safe, no traversal).
- [ ] **Commit the bundles** — `git add resources/bible/*.json.gz` (5 new + modified web.json.gz, ~7.7 MB)
      is the ONE remaining blocker both reviewers raised: without it a clean checkout/CI ships WEB only
      and the new e2e fails. Not committed yet (PM has unrelated in-flight work; §5.10 commit-on-request).

## Outcome (filled on completion)
Implementation complete and verified locally; reviewer + security both PASS the code. NOT committed
(PM has unrelated uncommitted work on the branch). No PM-owned files touched (preload/channels/
ipc-index untouched — translation switching reuses the existing settings IPC). Remaining step before
close: commit the six `resources/bible/*.json.gz` bundles alongside the code so CI/clean builds carry
the full set. KJV bundled as PD with documented US-PD vs UK-Crown-copyright note (maintainer flag).
