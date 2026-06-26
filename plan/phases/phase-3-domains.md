# Phase 3 — Core Product Domains (PM Brief)

> **Goal:** build the SRS core on the Phase 2 foundation, in dependency order, ending at a **functional MVP**: an operator can build a real service (songs + scripture + media), present it dual-screen, and have it persist. Each domain ships behind tests.

**Effort:** ~14 weeks · **Branch prefix:** `phase3/`

---

## Entry gate
- Phase 2 exit gate green: IPC + SQLite + dual-window + tests all working.

## PM start sequence
1. Read this brief, `CLAUDE.md` §5, the SRS (`docs/Project.md` §3.1–3.6), `revival/01-codebase-audit.md` §6 (gap matrix) and §7 (architecture), `revival/04-implementation-timeline.md` §Phase 3.
2. Audit CAMS — note that `features/planning/ServicesPage.tsx` currently renders **static fixture data**; the planning domain must replace it with real persisted data.
3. Decompose per domain below. Domains 1–2 are critical path and partly overlap; 3–5 follow. Each domain = its own slice of `src/main/services/`, `src/main/db/repositories/`, IPC channels, and `src/renderer/features/<domain>/`.

---

## Domain tasks (each: `implementer` + `reviewer` + `tester`; `security` for any new endpoint/IPC)

### D1 — Scripture `[critical path & product differentiator]` (Weeks 9–13)
- **Scope:** `ScriptureService` + `bibleRepository`; Bible schema (translations/books/chapters/verses) + **FTS5** index; `BibleApiClient` to hydrate SQLite **once → offline-first**; search by **reference**, **keyword**, and **topic** (the EasyWorship differentiator, SRS §3.2.2); projection formatting + auto-split long passages; render scripture to the audience window via the Phase 2 broadcast.
- **Rules:** §1.5, §5.3, §5.5, §5.7. CSP `connect-src` adds the Bible API host (Phase 2 mechanism).
- **Profiling gate:** benchmark topic + fuzzy + multi-translation search. If FTS5 is insufficient, file a CAMS task for the **Rust napi-rs search module** (`revival/04` §4) behind the existing `ScriptureService` interface — no upstream change.
- **Content licensing (R17):** ship only permissively-licensed translations by default (e.g. WEB); verify each translation's terms before bundling; legal review queued before any restricted text.
- **Done:** reference/keyword/topic search returns correct verses offline; selecting a verse projects it dual-screen; benchmarks recorded; licensing cleared for shipped texts.

### D2 — Presentation engine (Weeks 12–17, overlaps D1)
- **Scope:** slide model + renderer; transitions (fade/cut/dissolve) at ≥30 fps; presenter preview (current + next); live controls + **keyboard shortcuts** (operated under pressure — §5.4); black/blank/clear driven from main.
- **Rules:** §5.4, §5.7. **Done:** a slide deck presents dual-screen with transitions; keyboard navigation covers all live controls; audience path fails safe to black.

### D3 — Songs (Weeks 16–19)
- **Scope:** `SongService` + `songRepository`; schema (title/author/CCLI/tags + verse/chorus/bridge structure); editor; import (plain text / OpenLyrics / CCLI); arrangement ordering; projection formatting.
- **Rules:** §5.5, §5.9, R17 (CCLI reporting hook). **Done:** create/import/edit/present a song; CCLI metadata captured.

### D4 — Media (Weeks 18–21)
- **Scope:** `MediaService` + `mediaRepository`; library with folders/tags; image/video/audio playback + backgrounds — **lean on Chromium/FFmpeg** (this is why we stayed on Electron, `revival/03`). Validate/handle corrupt files gracefully.
- **Rules:** §5.5, §5.7. **Done:** import/organize media; video background plays smoothly on the audience window; corrupt files don't crash.

### D5 — Service planning (Weeks 20–22)
- **Scope:** replace the static `servicesData` fixture with **real persisted plans** of mixed elements (songs/scripture/media/custom); drag-drop reorder; recurring templates; duration estimate. Retire `src/shared/fixtures/servicesData.ts`.
- **Rules:** §1.5, §5.4, §5.5. **Done:** build, save, reload, and present a complete real service; fixture deleted; no static data remains.

---

## Verification & review
- After each domain: `reviewer` checks against CLAUDE.md §5 + the SRS section; `tester` confirms unit + e2e (including a present-to-audience e2e); UI work is **observed running** (`run`/`verify` skills), not just compiled.
- PM tracks honest **"% of SRS implemented"** (R14) and updates `docs/` progress notes per domain.
- Performance budgets enforced in CI from D2 onward (transition fps, search latency).

## Exit gate (MVP — advance to Phase 4 when ALL true)
- [ ] Scripture: reference/keyword/topic search works **offline**; projects dual-screen; search benchmarked (Rust module filed if needed).
- [ ] Presentation: slides + transitions + presenter preview + keyboard live controls; fails safe to black.
- [ ] Songs + Media: create/import/present; media plays on audience window.
- [ ] Planning: build/save/reload/present a real multi-element service; static fixture removed.
- [ ] Perf budgets met; content licensing cleared for shipped Bibles/songs.
- [ ] Each domain has unit + e2e coverage; CI green on 3 OSes.
- [ ] CAMS tasks closed; PM synthesis reported.

## Risks (`docs/revival/06-risk-assessment.md`)
- **R5** perf misses → budgets in CI, profile per domain. **R13** scope explosion → MVP is the line; SRS Phases 2–3 (cloud sync, mobile, collab) are **post-v1**, do not start them. **R17** licensing → cleared in D1/D3 before shipping. **R6** Rust module → only if D1 profiling demands, behind a stable interface.
