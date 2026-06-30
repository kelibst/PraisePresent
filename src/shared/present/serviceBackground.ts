import { slideBackground } from '@/shared/schemas/present';
import type { PresentSlide, SlideBackground } from '@/shared/schemas/present';

// The service-wide DEFAULT slide background (CLAUDE.md §1.5 — persisted as truth
// in SQLite via the existing `settings:get/set` IPC; §1.9 — reuses the optional
// per-slide `background` field rather than inventing a second background concept).
//
// The operator sets one background (a color or an image/video) in Settings →
// Presentation. It is LIVE present state (broadcast to both windows) and is
// resolved at render time by `effectiveBackground` against every slide that lacks
// its own `background`, so scripture/song/AI-detected slides share a consistent
// look without re-setting it each time — and changing it updates whatever is
// already on screen, not just future decks. A per-slide override (M4
// `BackgroundEditor`) always wins; an unset/empty default = the gradient backdrop.
//
// Pure module: no platform APIs, no side effects (§5.2). `serialize`/`parse` are
// used by main to persist the default in SQLite (§1.5); `effectiveBackground` is
// the render-time resolver used by the audience + presenter preview surfaces.

// Settings key (one source — kept beside the (de)serializers).
export const SERVICE_BACKGROUND_KEY = 'present.serviceBackground';

// Serialize the chosen default for the string-valued settings store. `null`
// (no default) is stored as the empty string, the same as "never set".
export function serializeServiceBackground(background: SlideBackground | null): string {
  return background ? JSON.stringify(background) : '';
}

// Parse a stored default back into a validated `SlideBackground`, or `null` when
// unset/empty/invalid. Re-validates with the zod schema so a hand-edited or
// tampered settings row can NEVER push an unsafe color/url into a live slide that
// reaches the audience compositor (§5.3, §5.7) — anything unrecognized fails safe
// to "no default" rather than throwing or leaking junk to the projector.
export function parseServiceBackground(raw: string | null | undefined): SlideBackground | null {
  if (!raw) return null;
  try {
    const parsed = slideBackground.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    // Malformed JSON in the settings row — fail safe to no default.
    return null;
  }
}

// Resolve the background a slide should actually paint, at RENDER time (never
// baked into the slide). Precedence:
//   1. an explicit per-slide `background` (operator override) ALWAYS wins;
//   2. otherwise, a slide that is itself a media display gets NO default — its
//      image/video already fills the surface, so a background would be invisible
//      and would needlessly load a second asset (the operator asked for media,
//      not a backdrop);
//   3. otherwise (a text slide: scripture/song/custom) → the service default.
// Returns `undefined` when nothing should paint (→ the gradient backdrop). Pure.
export function effectiveBackground(
  slide: Pick<PresentSlide, 'background' | 'media'>,
  defaultBackground: SlideBackground | null,
): SlideBackground | undefined {
  if (slide.background) return slide.background;
  if (slide.media) return undefined;
  return defaultBackground ?? undefined;
}
