import type { PresentState, PresentSlide, Transition } from '@/shared/schemas/present';
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
      return {
        mode,
        deck: action.deck,
        index,
        transition: action.transition ?? state.transition ?? DEFAULT_TRANSITION,
      };
    }
    case 'next':
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
    case 'black':
      // Hard fail-safe: forget the deck entirely so nothing can leak back.
      return { ...FAILSAFE, transition: state.transition };
    case 'blank':
      // Keep the deck/index (so resume is instant) but stop showing it.
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
