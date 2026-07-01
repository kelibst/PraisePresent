import { z } from 'zod';

// Live presentation state. Owned by main and broadcast to BOTH the presenter and
// audience windows (CLAUDE.md §5.3). `black` is the fail-safe (§5.7).
export const presentMode = z.enum(['slide', 'black', 'blank', 'clear']);

// Optional media payload on a slide (Phase 3 D4). The audience renders this via
// the DB-allowlisted `app-media://` protocol; `kind` picks img/video/audio.
export const slideMediaKind = z.enum(['image', 'video', 'audio']);
export const slideMedia = z.object({
  kind: slideMediaKind,
  url: z.string().min(1), // e.g. app-media://media/12
});

// A slide background. Painted BENEATH any media/text layers on both the audience
// output and the preview (CLAUDE.md §5.7). Two kinds:
//   • color — a single safe CSS color string (see `safeCssColor`).
//   • media — an image or video served via the DB-allowlisted `app-media://`
//     protocol (audio can't be a background — it has no visual surface).
// A media background that fails to load falls back to black on the audience.
//
// `safeCssColor`: an allow-list of color FORMS only — hex (#rgb/#rgba/#rrggbb/
// #rrggbbaa), rgb()/rgba(), hsl()/hsla(), and the basic named colors. This keeps
// arbitrary CSS (e.g. `url(...)`, `expression(...)`, gradients, or anything with
// `;`/`}`) from ever reaching the audience compositor as an inline style (§5.7).
const NAMED_COLORS = new Set([
  'black',
  'white',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
  'gray',
  'grey',
  'cyan',
  'magenta',
  'transparent',
]);
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR = /^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+%?\s*)?\)$/;
const HSL_COLOR = /^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+%?\s*)?\)$/;

export function isSafeCssColor(value: string): boolean {
  const v = value.trim();
  if (v.length === 0 || v.length > 64) return false;
  if (NAMED_COLORS.has(v.toLowerCase())) return true;
  return HEX_COLOR.test(v) || RGB_COLOR.test(v) || HSL_COLOR.test(v);
}

export const safeCssColor = z
  .string()
  .refine(isSafeCssColor, { message: 'Unsafe or unrecognized CSS color' });

export const slideBackground = z.discriminatedUnion('type', [
  z.object({ type: z.literal('color'), color: safeCssColor }),
  z.object({
    type: z.literal('media'),
    kind: z.enum(['image', 'video']), // audio has no visual surface for a background
    url: z.string().min(1), // app-media://media/<id>
  }),
]);

// A single projectable slide: one or more text lines plus an optional reference
// label (e.g. "John 3:16"), and optionally a media element and a background. The
// paint order (bottom→top) is: background → media → text (text overlays media,
// media overlays the background). All layers are optional.
// Bounds for editable slide text. Bounded so a crafted IPC payload can never ask
// the audience compositor to render an unbounded wall of text (§5.7).
export const MAX_SLIDE_LINES = 64;
export const MAX_SLIDE_LINE_LENGTH = 2000;

export const presentSlide = z.object({
  id: z.string().min(1),
  lines: z.array(z.string()),
  reference: z.string().optional(),
  media: slideMedia.optional(),
  background: slideBackground.optional(),
  // Additive, optional. `true` = the slide's TEXT is read-only and may not be
  // edited (scripture: translation integrity). Absent/false = editable. Enforced
  // in BOTH the UI and main — a crafted `present:update-text` is rejected (§5.3).
  locked: z.boolean().optional(),
});

export const transitionType = z.enum(['cut', 'fade', 'dissolve']);

// How the audience view animates between slides. `cut` is instant (0ms);
// duration is bounded so a renderer can never be asked to animate forever.
export const transition = z.object({
  type: transitionType.default('fade'),
  durationMs: z.number().int().min(0).max(2000).default(400),
});

// The full live deck + cursor. The audience renders deck[index]; the presenter
// renders deck[index] (current) and deck[index+1] (next). Both are views (§5.4).
//
// `rev` is a monotonic deck-revision id, bumped by the reducer whenever the deck
// CONTENTS change (setDeck/setBackground/updateText/black). Transport actions
// (next/prev/goto/blank/clear/setTransition) leave `rev` untouched. The split
// broadcast (B1) uses it to send the deck only when `rev` changes, and the client
// reconciler uses it to ignore a cursor that belongs to a superseded deck.
export const presentState = z.object({
  mode: presentMode,
  deck: z.array(presentSlide),
  index: z.number().int().min(0),
  transition,
  rev: z.number().int().min(0).default(0),
  // The service-wide DEFAULT background (color | media), applied at RENDER time to
  // any slide that lacks its own `background` — a per-slide override always wins,
  // and a slide that is itself a media display is skipped (its media covers the
  // surface). It is live state (broadcast to both windows) so changing it from
  // Settings updates whatever is already on screen, not just future decks. `null`
  // = the gradient backdrop (today's behaviour). See `effectiveBackground`.
  defaultBackground: slideBackground.nullable().default(null),
});

// Split broadcast payloads (main -> windows). `deck` carries the slides + rev and
// is sent only on deck-changing actions; `cursor` carries the hot, tiny cursor and
// is sent on every transport action. The reconciler merges them into PresentState.
export const presentDeckPayload = z.object({
  rev: z.number().int().min(0),
  deck: z.array(presentSlide),
  // Rides the deck broadcast (deck-level, rarely changes). A change to the service
  // default bumps `rev`, so it ships on the next deck push and re-renders the
  // audience immediately.
  defaultBackground: slideBackground.nullable().default(null),
});

export const presentCursorPayload = z.object({
  rev: z.number().int().min(0),
  index: z.number().int().min(0),
  mode: presentMode,
  transition,
});

// IPC inputs (renderer -> main). The renderer is never trusted; main re-clamps.
export const setDeckInput = z.object({
  deck: z.array(presentSlide),
  index: z.number().int().min(0).default(0),
  transition: transition.optional(),
});

export const gotoInput = z.object({
  index: z.number().int().min(0),
});

// Set (or clear, with `background: null`) a slide's background on the LIVE deck.
// `index` omitted → the current slide; `applyToAll` overrides `index` and sets
// every slide. Main re-validates the color/url and clamps the index (§5.7).
export const setBackgroundInput = z.object({
  index: z.number().int().min(0).optional(),
  background: slideBackground.nullable(),
  applyToAll: z.boolean().optional(),
});

// Replace the text `lines` of a slide on the LIVE deck. `index` omitted → the
// current slide. Lines are bounded (count + length). Main re-clamps the index
// AND rejects the edit when the target slide is `locked` (scripture) — the
// renderer is never trusted to honor the lock (§5.3).
export const updateTextInput = z.object({
  index: z.number().int().min(0).optional(),
  lines: z.array(z.string().max(MAX_SLIDE_LINE_LENGTH)).max(MAX_SLIDE_LINES),
});

// Change ONLY the transition (no deck change → cursor-only broadcast). Replaces
// the old pattern of re-sending the whole deck just to swap the transition type.
export const setTransitionInput = z.object({
  transition,
});

// Set (or clear, with `null`) the SERVICE-WIDE default background. Persisted in
// main and applied to every slide that lacks its own background, across the
// current live deck AND future decks (§1.5). Main re-validates the color/url
// (the safe-form allow-list) before it can reach the audience compositor (§5.7).
export const setDefaultBackgroundInput = z.object({
  background: slideBackground.nullable(),
});

export type PresentMode = z.infer<typeof presentMode>;
export type SlideMediaKind = z.infer<typeof slideMediaKind>;
export type SlideMedia = z.infer<typeof slideMedia>;
export type SlideBackground = z.infer<typeof slideBackground>;
export type PresentSlide = z.infer<typeof presentSlide>;
export type TransitionType = z.infer<typeof transitionType>;
export type Transition = z.infer<typeof transition>;
export type PresentState = z.infer<typeof presentState>;
export type PresentDeckPayload = z.infer<typeof presentDeckPayload>;
export type PresentCursorPayload = z.infer<typeof presentCursorPayload>;
export type SetDeckInput = z.infer<typeof setDeckInput>;
export type GotoInput = z.infer<typeof gotoInput>;
export type SetBackgroundInput = z.infer<typeof setBackgroundInput>;
export type UpdateTextInput = z.infer<typeof updateTextInput>;
export type SetTransitionInput = z.infer<typeof setTransitionInput>;
export type SetDefaultBackgroundInput = z.infer<typeof setDefaultBackgroundInput>;

// The default transition (compositor fade). Exported so both sides agree.
export const DEFAULT_TRANSITION: Transition = { type: 'fade', durationMs: 400 };

// The fail-safe state: empty deck, black mode. The audience never shows anything
// unintended, and anything can reset to this (§5.7).
export const FAILSAFE: PresentState = {
  mode: 'black',
  deck: [],
  index: 0,
  transition: DEFAULT_TRANSITION,
  rev: 0,
  defaultBackground: null,
};
