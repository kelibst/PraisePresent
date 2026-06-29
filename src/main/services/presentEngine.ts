import type {
  PresentState,
  PresentSlide,
  Transition,
  SlideBackground,
} from '@/shared/schemas/present';
import { FAILSAFE, DEFAULT_TRANSITION } from '@/shared/schemas/present';

// Pure live-presentation reducer. Given the current state + an action it returns
// the next state, ALWAYS keeping `index` within the deck bounds and never
// throwing — the audience path must fail safe to black, never crash (§5.7).
//
// Deliberately free of any electron/node imports so Vitest can unit-test the
// clamping/empty-deck/transition logic without the native binary (context.md §2).

export type PresentAction =
  | { type: 'setDeck'; deck: PresentSlide[]; index?: number; transition?: Transition }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'goto'; index: number }
  | {
      type: 'setBackground';
      background: SlideBackground | null;
      index?: number;
      applyToAll?: boolean;
    }
  | { type: 'updateText'; lines: string[]; index?: number }
  | { type: 'setTransition'; transition: Transition }
  | { type: 'black' }
  | { type: 'blank' }
  | { type: 'clear' };

// Clamp an arbitrary index into [0, deck.length-1]; 0 for an empty deck.
function clampIndex(index: number, deckLength: number): number {
  if (deckLength <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  if (index > deckLength - 1) return deckLength - 1;
  return Math.floor(index);
}

export function reduce(state: PresentState, action: PresentAction): PresentState {
  switch (action.type) {
    case 'setDeck': {
      const index = clampIndex(action.index ?? 0, action.deck.length);
      // An empty deck can never be in `slide` mode — fall back to black (§5.7).
      const mode = action.deck.length > 0 ? 'slide' : 'black';
      // Deck contents changed → bump `rev` so the split broadcast ships the deck
      // (not just a cursor) and the reconciler invalidates any older cursor (B1).
      return {
        mode,
        deck: action.deck,
        index,
        transition: action.transition ?? state.transition ?? DEFAULT_TRANSITION,
        rev: state.rev + 1,
      };
    }
    case 'next':
      // Cursor-only: deck unchanged, `rev` preserved via spread.
      return {
        ...state,
        mode: slideOr(state),
        index: clampIndex(state.index + 1, state.deck.length),
      };
    case 'prev':
      return {
        ...state,
        mode: slideOr(state),
        index: clampIndex(state.index - 1, state.deck.length),
      };
    case 'goto':
      return { ...state, mode: slideOr(state), index: clampIndex(action.index, state.deck.length) };
    case 'setBackground': {
      // Set (or clear, when background === null) the background on one slide or
      // all of them. Never changes mode/index — purely a per-slide layer edit.
      // An empty deck is a no-op (nothing to paint); never throws (§5.7).
      if (state.deck.length === 0) return state;
      const next = action.background ?? undefined;
      const target = action.applyToAll
        ? null // all slides
        : clampIndex(action.index ?? state.index, state.deck.length);
      const deck = state.deck.map((slide, i) => {
        if (target !== null && i !== target) return slide;
        if (next) return { ...slide, background: next };
        // Drop the key entirely when clearing so the slide stays back-compatible.
        const cleared = { ...slide };
        delete cleared.background;
        return cleared;
      });
      // Deck contents changed → bump `rev` (B1).
      return { ...state, deck, rev: state.rev + 1 };
    }
    case 'updateText': {
      // Replace one slide's text lines on the live deck. Never moves the
      // audience (mode/index untouched). Defense-in-depth: a `locked` slide
      // (scripture) is read-only and this is a hard no-op even when the renderer
      // asks for an edit (§5.3). An empty deck is a no-op; never throws (§5.7).
      if (state.deck.length === 0) return state;
      const target = clampIndex(action.index ?? state.index, state.deck.length);
      if (state.deck[target].locked) return state;
      const deck = state.deck.map((slide, i) =>
        i === target ? { ...slide, lines: action.lines } : slide,
      );
      // Deck contents changed → bump `rev` (B1).
      return { ...state, deck, rev: state.rev + 1 };
    }
    case 'setTransition':
      // Cursor-only: the transition rides the cursor payload, so changing it never
      // re-sends the deck (fixes the old full-deck round-trip). `rev` preserved.
      return { ...state, transition: action.transition };
    case 'black':
      // Hard fail-safe: forget the deck entirely so nothing can leak back. The deck
      // changed (now empty) → bump `rev` so the reconciler clears its cached deck.
      return { ...FAILSAFE, transition: state.transition, rev: state.rev + 1 };
    case 'blank':
      // Keep the deck/index (so resume is instant) but stop showing it. Cursor-only.
      return { ...state, mode: 'blank' };
    case 'clear':
      // Clear the slide but keep the deck/index for resume; audience shows black.
      return { ...state, mode: 'clear' };
    default:
      return state;
  }
}

// Navigation only makes sense with a non-empty deck; otherwise stay safe (black).
function slideOr(state: PresentState): PresentState['mode'] {
  return state.deck.length > 0 ? 'slide' : 'black';
}
