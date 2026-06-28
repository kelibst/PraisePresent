# PraisePresent — Claude Design Prompt Kit

> Purpose: a reusable set of prompts you paste into **Claude (claude.ai)** to generate a high‑fidelity visual design for every screen of PraisePresent. The goal is a **calm, easy, fast operator console** in the spirit of the classic EasyWorship 2009 workflow — modernized with our brand and shadcn/Tailwind stack.
>
> How to use: paste **Section A (Master Context)** first, then append **one** per‑screen block from Section C (or the flagship Bible‑search block in Section D). Claude returns a single self‑contained HTML+Tailwind mockup you can preview, iterate on, then hand to an implementer to port to React/shadcn.

---

## 0. Design north star (decisions made for you)

These are the opinionated calls so every screen is consistent. Don't re-decide them per screen.

- **Audience over operator.** The thing being projected is sacred. The live/output preview is always visible; nothing the operator does should risk a stack trace on the projector.
- **Dark-first console.** Operators work in dim booths/stages. Default theme is **dark**; light theme is a toggle, not the default. Low chrome, high contrast, big legible type.
- **Keyboard-first, under pressure.** Every primary action shows its shortcut. Mouse is the fallback, not the requirement. Targets are large (≥40px) and forgiving.
- **One obvious way to do a thing.** No competing patterns. Match EasyWorship's clarity: search → pick → it's on the schedule → it's live.
- **Three‑pane workspace** is the spine of the app (Library/Search → Schedule/Build → Live/Output). Feature pages live inside that frame.
- **Brand:** Deep Purple `#5E3B9E` = primary/active/selected only. Not a wash; it's the accent that tells the eye "this is selected / this is live‑ready."

---

## A. MASTER CONTEXT BLOCK (paste this first, every time)

```
You are designing the UI for "PraisePresent", a desktop (Electron) worship-presentation app
for churches: scripture, songs, media, service planning, dual-screen live presentation, and
AI scripture detection. The operator runs it LIVE during a service, often in a dim room, often
under time pressure, sometimes by a volunteer who is not technical. Design must be EASY,
CALM, FAST, and KEYBOARD-FRIENDLY — never busy or clever.

DELIVERABLE
- Output ONE self-contained HTML file using Tailwind via CDN (<script src="https://cdn.tailwindcss.com"></script>).
- Inline a small <script> that sets the Tailwind theme tokens (below) so colors are exact.
- High fidelity: real-looking content (real Bible references, real song titles), real spacing,
  hover/active/selected states shown, focus rings visible. No lorem ipsum.
- Use lucide-style inline SVG icons (simple line icons), not emoji.
- It should look like a polished native desktop app, not a website. No marketing hero, no footer.

DESIGN LANGUAGE
- Dark-first operator console. Background near-black, panels slightly lifted, hairline borders.
- Brand primary = Deep Purple #5E3B9E, used ONLY for: primary buttons, the selected row/item,
  the "live-ready" accent, active nav item, focus ring. Everything else is neutral grays.
- Typography: system font stack (-apple-system, 'Segoe UI', Roboto, sans-serif). Generous size
  for anything the operator reads at a glance. Numbers (chapter/verse) are tabular.
- Corners: rounded-lg (0.5rem). Soft, approachable, not sharp.
- Density: comfortable but information-rich, like a pro DAW or EasyWorship — not airy like a
  consumer landing page.
- Motion: subtle only (150ms ease). Nothing bouncy. The audience output uses fade/dissolve.

EXACT THEME TOKENS (HSL) — wire these into tailwind.config and use semantic classes:
  Dark (default):
    --background 222 84% 5%      --foreground 210 40% 98%
    --card 222 47% 9%            --muted 217 33% 17%   --muted-foreground 215 20% 65%
    --primary 261 45% 55%  (Deep Purple #5E3B9E family)   --primary-foreground 210 40% 98%
    --border 217 33% 17%         --ring 261 45% 60%        --destructive 0 63% 45%
  Light (toggle): background 0 0% 100%, foreground 222 84% 5%, primary 261 46% 43%, etc.

GLOBAL LAYOUT (the frame every screen lives in)
- Left vertical NAV RAIL (icon + label): Home, Scripture, Songs, Media, Plans, Live Detect (AI),
  Present, Settings. Active item uses the purple accent (left bar + tint). ~220px wide,
  collapsible to icons.
- The main area is a THREE-PANE workspace where it applies:
    Pane 1 (Library/Search) → Pane 2 (Schedule/Build) → Pane 3 (Live/Output preview).
- A thin TOP BAR: current service name, a global search, theme toggle, and a prominent
  LIVE/BLACK status pill (shows whether the audience screen is showing content or is blacked out).
- Bottom: a slim status strip (audience display connected? which monitor? fps ok?).

NON-NEGOTIABLES
- Show keyboard shortcut hints on primary actions (e.g. "Next →", "Black B", "Clear Esc").
- Show a real audience-output preview (16:9) wherever presentation is involved.
- Accessible: visible focus rings, semantic structure, AA contrast.

I will now tell you WHICH screen to design. Design only that screen, full-bleed, at 1440×900.
```

---

## B. Screen inventory (what to generate, in priority order)

| # | Screen | Why it matters | Prompt block |
|---|--------|----------------|--------------|
| 1 | **Scripture / Bible search** (flagship) | Core daily task; EasyWorship's killer feature | **Section D** |
| 2 | **App shell** (nav rail + top bar + 3‑pane frame) | The frame everything reuses | C‑1 |
| 3 | **Presenter / Live console** | The live-operation moment of truth | C‑2 |
| 4 | **Audience output** (what's projected) | The sacred surface; designed separately | C‑3 |
| 5 | **Service planning** (list + detail/editor) | How a service is built | C‑4 |
| 6 | **Songs** library + import + section editor | Second-most-used content type | C‑5 |
| 7 | **Media** library grid + present | Backgrounds/video/audio | C‑6 |
| 8 | **Live Detect (AI)** | Differentiator; text→candidates→stage | C‑7 |
| 9 | **Settings** (General + Display) | Display setup is critical first-run | C‑8 |
| 10 | **Home / Dashboard** | Calm landing + quick start | C‑9 |

Generate in this order. Screens 2–4 establish the visual system; everything else inherits it.

---

## C. Per-screen prompt blocks (append after the Master Context)

### C‑1 — App shell / global frame
```
DESIGN: the global app shell only (no specific feature content yet).
Show the left nav rail with all 8 items (Home, Scripture, Songs, Media, Plans, Live Detect,
Present, Settings) with the active item = Scripture. Show the top bar (service name
"Sunday 1st Service", global search, theme toggle, LIVE/BLACK status pill currently "BLACK").
Show the empty three-pane workspace with labeled, lightly-outlined drop zones:
Pane 1 "Library / Search", Pane 2 "Schedule", Pane 3 "Live Output (16:9 preview) + Next preview".
Show the bottom status strip: "Audience: Display 2 connected · 1080p · 60fps".
This is the chrome the rest of the app sits inside — make it feel solid and quiet.
```

### C‑2 — Presenter / Live console
```
DESIGN: the live presentation console (Pane 3 expanded into a full presenter cockpit).
- Big CURRENT slide preview (16:9, what's live now) with the verse/song text rendered as it
  appears on the projector. Beside/below it a smaller NEXT slide preview.
- A vertical slide list (the deck) on the left: each verse/section is one slide; the live one
  is highlighted purple, the next has a thin outline.
- Transport controls with shortcut hints: Previous (←), Next (→ / Space), Black (B),
  Clear (Esc), Logo/Hold, and a transition picker (Cut / Fade / Dissolve).
- Status: which display, fps, and a big unmistakable state badge: LIVE / BLACK / CLEARED.
- This screen is operated by feel in a dark room: huge targets, current state obvious from 3m away.
```

### C‑3 — Audience output (projected surface)
```
DESIGN: the audience/projector output itself (full 16:9, no app chrome) in 3 states shown as
three stacked frames:
  1) Scripture slide: large centered verse text + small reference bottom-corner, optional
     background image dimmed for legibility.
  2) Song slide: lyric lines, clean, high contrast, lower-third reference/credit optional.
  3) BLACK (fail-safe) state — pure black, nothing else.
Typography must be readable from the back of a room: large, high contrast, safe margins,
no clutter. Show one variant on a photo background (with a dark scrim) and one on solid color.
```

### C‑4 — Service planning (list + detail)
```
DESIGN two views side by side:
A) Services list: cards/rows of upcoming services (name, date, item count, est. duration),
   a "New Service" primary button.
B) Service detail / builder: ordered list of plan items (mix of Song, Scripture, Media,
   Custom text — each with a type icon), reorder controls (up/down), per-item duration,
   a running total duration badge, and a "Present" primary action. Right side shows the
   live-output preview of the selected item.
Make "build a service in under a minute" feel obvious.
```

### C‑5 — Songs
```
DESIGN the Songs feature inside the 3-pane frame:
Pane1: searchable song library list (title, author, CCLI#, tags). Pane2: the selected song's
sections (Verse 1 / Chorus / Bridge) as a vertical list of slide-cards (editable). Pane3:
live-output preview of the selected section. Include an "Import" button that opens a dialog
for pasting plain text with Verse/Chorus/Bridge labels. Show a tag filter and a "+ New Song".
```

### C‑6 — Media
```
DESIGN the Media library: a responsive grid of thumbnails (images, video with a play badge,
audio with a waveform/disc badge). Each tile shows name + kind. Hover reveals "Present" and
"Remove". Top: "Import media" button + filter chips (All / Images / Video / Audio). Right rail:
selected item large preview + "Set as background" / "Present" actions. Handle the empty state
gracefully ("Drop files here or click Import").
```

### C‑7 — Live Detect (AI scripture detection)
```
DESIGN the AI Live Detect panel:
- A large TEXT input ("paste or speak what's being said") with a mic toggle (online/offline mode
  selector) and a clear ON-AIR-PRIVACY indicator when online AI is active (+ a hard kill switch).
- A CANDIDATE QUEUE: detected references as cards (e.g. "John 3:16 — 96% confidence") with the
  resolved verse text preview, sorted by confidence. Human-in-the-loop: each card has
  "Stage" and "Send Live" — nothing auto-projects by default.
- A small history of recently sent references. Right side: live-output preview.
- Make the trust model obvious: AI suggests, operator confirms.
```

### C‑8 — Settings (General + Display)
```
DESIGN a settings screen with a left sub-nav (General, Display, Bible, AI/Privacy, About).
Show two tabs filled in:
A) General: theme (dark default), default Bible translation, startup behavior.
B) Display: a visual monitor picker (diagram of Display 1 = control, Display 2 = audience),
   resolution readout, a "Test pattern / Identify" button, margins/safe-area sliders, and a
   fail-safe "Black on disconnect" toggle (on). This is first-run-critical — make it foolproof.
```

### C‑9 — Home / Dashboard
```
DESIGN a calm home screen: a greeting, a big "Continue last service" / "New service" pair,
recent services, and quick-jump tiles (Scripture, Songs, Media). Plus a clear status of the
audience display. Keep it uncluttered — this is a launchpad, not a dashboard full of metrics.
```

---

## D. FLAGSHIP — Bible book & verse search (EasyWorship‑2009 style)

This is the feature you specifically asked for. First, the exact interaction spec (so the design
is built on real behavior, not guesses). Then the paste-ready design prompt.

### D.1 How EasyWorship's reference search actually behaves (researched)

Sources:
- [EasyWorship — Scriptures (official)](https://support.easyworship.com/support/solutions/articles/24000020401-scriptures)
- [EasyWorship — Song & Scripture Search](https://support.easyworship.com/support/solutions/articles/24000019682-song-and-scripture-search)
- [EasyWorship features](https://easyworship.com/software/features)

The behavior we are copying (and improving):

1. **One always-present reference field.** You type the reference as natural text: `John 3:16`.
2. **Book auto-complete as you type.** Type `1 The` → it completes to **1 Thessalonians**. Type
   `joh` → **John**. The matching book is auto-selected/highlighted.
3. **Spacebar advances the cursor through the parts:** book → (space) → chapter → (space) → verse.
   So `John` `<space>` `3` `<space>` `16`.
4. **Ranges supported inline:** `John 1:1-7` highlights verses 1–7 in the results list.
5. **Results update live** in the resource list below as you type; you double-click / press Enter
   to go live, or drag to the schedule.
6. **Reference vs Keyword toggle:** an icon in the field flips between *reference* search
   (line-list icon) and *contextual keyword* search (magnifying-glass icon).

### D.2 The two behaviors YOU specifically called out (make these explicit in the design)

- **The field is never empty and cannot be cleared to nothing.** It always holds a valid
  reference. On launch it **defaults to `Genesis 1:1`** (`Gen 1:1`). If the operator deletes
  everything, it snaps back to the last valid reference rather than going blank — so the app is
  never in an undefined state on a live stage.
- **Instant nearest-book selection by first letters.** The moment you type `j`, the nearest
  book starting with J is selected automatically (no Enter needed); keep typing `jo`, `joh` and
  it narrows to **John**. A small dropdown shows the matching books with the top match
  highlighted; ↑/↓ changes the pick, the rest of the reference (chapter/verse) is preserved.

### D.3 Full interaction spec (hand this to the implementer too)

- **Input parsing (every keystroke):** parse the field into `{book, chapter, verse, verseEnd?}`.
  Tolerant: case-insensitive, accepts `John 3:16`, `john 3 16`, `jn 3:16` (common abbreviations),
  `1 jn 1:9`, `John 3:16-18`, `Ps 23`. Leading numbers for numbered books (`1`,`2`,`3`) handled.
- **Book matching:** prefix + fuzzy/abbreviation match against the 66-book list (incl. common
  abbreviations). Nearest match auto-selected; full list of matches shown in a dropdown.
- **Cursor model:** Space (or `:`) moves to the next segment. Backspace at the start of a segment
  returns to the previous one. The three segments (Book / Chapter / Verse) are visually distinct
  "chips" or zones so the operator always sees where they are.
- **Live results:** below the field, render the resolved verse(s) full-text. For a range, show
  each verse as its own row (one slide per verse). Selected/first row highlighted.
- **Commit:** `Enter` = send live (or stage, configurable); `Shift+Enter` or drag = add to
  schedule; `↑/↓` move the highlighted result; `Tab` moves focus between field and results.
- **Never-empty guarantee:** debounced validation; on invalid/empty, revert the displayed
  resolved verse to the last valid one and show a quiet inline hint, not an error dialog.
- **Translation selector** next to the field (default from Settings; WEB is the bundled default).
- **Keyword mode toggle:** flips the same field into FTS5 keyword search; results show verses
  containing the phrase with the matched term highlighted.
- **Performance:** resolves from the local bundled Bible (offline, FTS5) — feels instant
  (<5ms). No spinner needed.

### D.4 PASTE-READY design prompt (append after the Master Context block)

```
DESIGN: the Scripture / Bible search screen — this is the app's flagship feature and must feel
EFFORTLESS, in the spirit of EasyWorship 2009's legendary reference search. Build it inside the
three-pane workspace.

THE SEARCH FIELD (the star of the screen):
- A single, prominent reference input at the top of Pane 1. It is NEVER empty: it currently
  shows "Genesis 1:1" as the default. Render the reference as three visually distinct segments
  the eye can read at a glance: [ Book ] [ Chapter ] [ Verse ], e.g. [John] [3] [16].
- To its left, a small toggle icon that switches between REFERENCE mode (line-list icon, active)
  and KEYWORD mode (magnifying-glass icon). To its right, a translation selector showing "WEB".
- Show the AUTOCOMPLETE behavior visually: depict the operator mid-type having entered "joh" —
  a compact dropdown lists matching books [John (highlighted), Joel, Jonah, Joshua, Job] with
  John selected as the nearest match. Add a tiny helper caption: "Type a book, Space for chapter,
  Space for verse — e.g. John 3:16. The field always keeps a valid reference."

RESULTS (Pane 1, below the field):
- The resolved verse(s) as a clean list. For "John 3:16-18" show three rows, one verse each
  (one slide per verse), verse numbers tabular, the first row selected (purple accent).
- Each row: verse number, verse text, and on hover quiet actions "Stage" and "Send Live →".

PANE 2 (Schedule): a short service so the screen feels real — a few items already added
(a song, this scripture) with reorder handles.

PANE 3 (Live Output): a 16:9 audience preview rendering the selected verse exactly as projected
(large centered text, small "John 3:16 · WEB" reference in a corner), plus a smaller NEXT preview.

KEYBOARD HINTS shown on-screen: "Enter Send Live", "Shift+Enter Add to schedule",
"↑/↓ Move", "Space next segment", "B Black".

Make the search field unmistakably the focal point. Calm, dark, fast, obvious. Real content only.
```

### D.5 Follow-up prompts to refine the flagship (use after the first render)

- "Now show the **KEYWORD search** state of the same screen: the toggle flipped to magnifying-glass, the field showing the phrase `love one another`, and results listing matching verses with the matched words highlighted."
- "Show the **empty/just-launched** state: field at `Genesis 1:1`, results showing Genesis 1:1, nothing staged yet — prove the app is never blank."
- "Show the **range + multi-verse deck** state: `Psalm 23:1-6` producing 6 result rows and a 6-slide deck preview in Pane 3."
- "Produce a **React + Tailwind + shadcn/ui** component version of this screen using our semantic tokens (bg-background, text-foreground, bg-primary, etc.), now that the look is approved."

---

## E. Workflow recommendation

1. Paste **A (Master Context)** + **C‑1 (App shell)** → lock the frame and palette.
2. Paste **A** + **D.4 (Bible search)** → nail the flagship; iterate with D.5.
3. Paste **A** + **C‑2 / C‑3** → lock presenter + audience output (the live moment).
4. Work down the Section B priority list, one screen per conversation turn, reusing **A** each time.
5. When a screen's look is approved, ask Claude for the **React+shadcn port** (D.5 last bullet) so it drops into `src/renderer/features/<feature>/` cleanly.
6. Keep every screen consistent by always re-pasting the **same Master Context block** — don't let the palette/layout drift between screens.

> Note: these are *design exploration* mockups (HTML+Tailwind). The real implementation must
> still obey CLAUDE.md (React function components, shadcn primitives in `components/ui`, semantic
> tokens, no hard-coded hex, data via `window.api`). Designs inform; they don't bypass the rules.
