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

// A single projectable slide: one or more text lines plus an optional reference
// label (e.g. "John 3:16"), and optionally a media element. Text and media can
// coexist (text overlays the media).
export const presentSlide = z.object({
  id: z.string().min(1),
  lines: z.array(z.string()),
  reference: z.string().optional(),
  media: slideMedia.optional(),
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
export const presentState = z.object({
  mode: presentMode,
  deck: z.array(presentSlide),
  index: z.number().int().min(0),
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

export type PresentMode = z.infer<typeof presentMode>;
export type SlideMediaKind = z.infer<typeof slideMediaKind>;
export type SlideMedia = z.infer<typeof slideMedia>;
export type PresentSlide = z.infer<typeof presentSlide>;
export type TransitionType = z.infer<typeof transitionType>;
export type Transition = z.infer<typeof transition>;
export type PresentState = z.infer<typeof presentState>;
export type SetDeckInput = z.infer<typeof setDeckInput>;
export type GotoInput = z.infer<typeof gotoInput>;

// The default transition (compositor fade). Exported so both sides agree.
export const DEFAULT_TRANSITION: Transition = { type: 'fade', durationMs: 400 };

// The fail-safe state: empty deck, black mode. The audience never shows anything
// unintended, and anything can reset to this (§5.7).
export const FAILSAFE: PresentState = {
  mode: 'black',
  deck: [],
  index: 0,
  transition: DEFAULT_TRANSITION,
};
