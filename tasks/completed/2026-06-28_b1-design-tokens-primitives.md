# B1 — Design tokens (sage green) + UI primitives
- **ID:** 2026-06-28_b1-design-tokens-primitives
- **Phase:** UX-revival (Stage B)
- **Assigned agent type:** implementer (+ reviewer)
- **Status:** done (reviewer SIGN OFF 2026-06-28)

## Goal
Encode the approved `PraisePresent.dc.html` design system as tokens + shadcn primitives so B2 (shell)
and every screen build on ONE source of truth. Brand is now **Sage Green `#6E9559` / `#9CBE82`**
(CLAUDE.md §5.6, already updated). No screen UI here — tokens + primitives only.

## Design palette (from the approved design — map to tokens; do NOT hard-code hex in components later)
- Page bg `#070b15` · top bar / rail / panel-2 `#0a0f1c` · panel-1 `#0c1322` · panel-alt `#0a1020` ·
  live-pane `#090d1a`. Borders `#141c30`/`#161e34`/`#1b2440`/`#1f2940`; input border `#25304e`.
- Accent sage `#6E9559` (+ deep `#4A6741`, light `#9CBE82`, hover `#577C49`); accent-tint
  `rgba(106,142,90,0.13–0.22)`. Live/success `#9CBE82`/`#34d399`. Warn `#d9a441`. Error `#e2796b`.
- Text: primary `#f1f5f9` · body `#e2e8f0` · label `#cbd5e1` · muted `#94a3b8`/`#7c879f` · dim `#5e6b85`/`#64748b`.
- Radii 8–13px; the `pp-pulse`, `pp-eq`, `pp-sweep` keyframes (see design `<style>`).

## Scope (files/areas)
- `tailwind.config.js` + `src/renderer/styles/globals.css` — the **single** global stylesheet (§5.6).
  Map the palette to CSS variables / Tailwind theme tokens. The design is **dark-first**: map these
  exact values to the **dark** theme, and derive a coherent **light** counterpart that keeps the sage
  accent (the app keeps its existing light/dark/system toggle — `src/renderer/lib/theme.tsx`; do not
  remove it). Add the three keyframes + matching Tailwind animation utilities. Replace the old Deep
  Purple `--primary` with sage; keep the shadcn token names the existing `ui/` components consume so
  nothing breaks.
- `src/renderer/components/ui/` — extend the existing primitives (button/card/dialog/sheet) to the new
  tokens, and ADD the primitives the design needs, as proper shadcn-style components on the tokens:
  `input`, `textarea`, `select`/dropdown-menu, `switch` (toggle), `tabs`, `tooltip`, `command` (for the
  ⌘K palette), `badge`, `scroll-area` (optional). Install the matching `@radix-ui/*` / `cmdk` deps as
  needed (allowed). No competing variants — one canonical component per concern (§1.9, §5.6).

## Rules that apply
- §5.6 (one stylesheet, tokens not hex, extend not fork), §5.4 (accessible primitives — keyboard,
  semantic), §1.9 (no second way to do a thing), §5.9 (naming). Renderer-only; no electron/node.

## Acceptance criteria
- [ ] Sage-green tokens live in tailwind + globals.css; `--primary` is sage; existing screens still
      render (now green) with no broken token references.
- [ ] Light + dark both coherent; theme toggle still works.
- [ ] New primitives (input/textarea/select/switch/tabs/tooltip/command/badge) exist, tokenized, a11y-correct.
- [ ] `pp-pulse`/`pp-eq`/`pp-sweep` available as utilities/classes.
- [ ] tsc 0 · lint 0 · format clean · unit green · `bun run package` still builds. Reviewer sign-off.
- [ ] No hard-coded hex introduced in any component; no electron/node in renderer.

## Outcome (filled on completion)

## Outcome (2026-06-28 — DONE, reviewer SIGN OFF)
Sage-green token layer in the single globals.css + tailwind.config.js (design hex mapped exactly to dark; coherent sage light counterpart; theme toggle preserved). `--primary` now sage #6E9559. Added 9 tokenized a11y primitives (input, textarea, label, badge, switch, tabs, tooltip, select, command/cmdk) + pp-pulse/pp-eq/pp-sweep animation utilities + a --pp-* surface/text namespace. Deps: @radix-ui/{label,select,switch,tabs,tooltip} + cmdk (all used). No hex in components, existing token names preserved, package builds. Gate: tsc 0 · lint 0 · 150 unit · package OK.
