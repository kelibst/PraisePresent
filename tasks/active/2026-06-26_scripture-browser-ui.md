# Scripture browser UI (book → chapter → verses) — the page looks empty without it
- **ID:** 2026-06-26_scripture-browser-ui
- **Phase:** 3 (D1 follow-up b, promoted to its own task)
- **Assigned agent type:** implementer + reviewer
- **Status:** pending

## Why (observed-run finding 2026-06-26)
The Scripture page is **search-only**: a Reference/Keyword box + Search button, and a big empty area below. The 31,095 WEB verses ARE imported and FTS works (verified in the live DB), but a user opening Scripture sees a blank/black page and concludes "there are no scriptures." A worship app needs to **browse and read** the Bible (pick a book → chapter → see verses), not only search by reference.

## Goal
Add a Bible browser to `src/renderer/features/scripture/ScripturePage.tsx` (or a sibling component): a book picker (66 books, OT/NT grouping — `window.api.scripture.listBooks()` already exists) → chapter picker → the chapter's verses rendered for reading, each selectable to **present to audience** (reuse the D2 deck: present a chapter as a multi-verse deck, or a single verse). Keep the existing reference/keyword search as a second mode/tab. Opening the page should show *something* (e.g. default to Genesis 1 or John 1, or a book grid) — never an empty black screen.

## Scope
- **Re-add the `getChapter` path removed at D1 close** (CLAUDE.md §1.9 — it was removed as dead code precisely because this UI didn't exist yet; now it does): `bibleRepository.getChapter(bookNumber, chapter)` → `scriptureService` → `scripture:get-chapter` channel + zod schema → preload bridge → `api.d.ts`. (Recover the exact removed code from commit `7c4316e` / its review — it was a clean stack.)
- `src/renderer/features/scripture/` — the browser UI (book/chapter nav + verse list). `listBooks` + the new `getChapter` feed it.
- Present integration: reuse `window.api.present.setDeck(...)` (D2). A "Present chapter" builds a verse-per-slide deck; clicking a verse presents from there.

## Rules
- §1.5 (verses from `window.api`, already persisted), §5.2/§5.3 (zod-validated IPC), §5.4 (keyboard/accessible — operated live), §5.6 (brand tokens), §5.9 (<300 LOC — split browser vs search components).

## Acceptance
- [ ] Opening Scripture shows readable verses (a default chapter or a book grid), not a blank page.
- [ ] Book → chapter → verses navigation works offline against the bundled WEB.
- [ ] A chapter/verse can be presented to the audience (D2 deck).
- [ ] `getChapter` stack restored with zod validation; unit/e2e cover it.
- [ ] reviewer sign-off; UI observed running.

## Outcome
