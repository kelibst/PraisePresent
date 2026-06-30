import type {
  PresentState,
  PresentSlide,
  PresentMode,
  Transition,
  SlideBackground,
  PresentDeckPayload,
  PresentCursorPayload,
} from '@/shared/schemas/present';

// Pure client-side reconciler for the split present broadcast (B1). It caches the
// rarely-changing deck (by `rev`) and applies the frequently-changing cursor deltas
// locally, re-exposing the SAME unified `PresentState` the renderer already consumes.
//
// Deliberately free of any electron/node/zod imports so Vitest can unit-test the
// ordering/merge logic in isolation (CLAUDE.md §5.8). The preload wires this to the
// `present:deck`/`present:cursor` ipcRenderer channels; this module is the "no
// business logic" merge glue that keeps the bridge thin (§5.2).
//
// Ordering guarantee: main sends the deck BEFORE the cursor when both change, and
// IPC to a single webContents is delivered in send order. The `rev` guard is
// defense-in-depth: a cursor for a superseded deck (rev < cached) is dropped, and a
// cursor that arrives before its deck (rev > cached) is buffered and applied when
// that deck lands.

// Mirrors DEFAULT_TRANSITION from the schema. Inlined (not imported) so this pure
// module pulls in no zod runtime — it is overwritten on the first message and is
// never emitted before a deck has been seen (`current()` returns null until then).
const INITIAL_TRANSITION: Transition = { type: 'fade', durationMs: 400 };

export type PresentReconciler = {
  /** Seed from a full PresentState (e.g. `present:get-state` on a late mount). */
  seed(state: PresentState): PresentState;
  /** Apply a deck push. Returns the merged state to emit. */
  applyDeck(payload: PresentDeckPayload): PresentState;
  /**
   * Apply a cursor push. Returns the merged state to emit, or `null` when nothing
   * should be emitted: a superseded cursor (older rev) or one buffered ahead of its
   * deck.
   */
  applyCursor(payload: PresentCursorPayload): PresentState | null;
  /** The current merged state, or `null` if no deck has been seen yet. */
  current(): PresentState | null;
};

export function createPresentReconciler(): PresentReconciler {
  let deck: PresentSlide[] = [];
  let rev = -1;
  let index = 0;
  let mode: PresentMode = 'black';
  let transition: Transition = INITIAL_TRANSITION;
  // The service-wide default background rides the deck payload (deck-level). Kept
  // as a stable reference across cursor moves so memoized slide layers don't churn.
  let defaultBackground: SlideBackground | null = null;
  let hasDeck = false;
  let pendingCursor: PresentCursorPayload | null = null;

  function snapshot(): PresentState {
    return { mode, deck, index, transition, rev: rev < 0 ? 0 : rev, defaultBackground };
  }

  return {
    seed(state) {
      deck = state.deck;
      rev = state.rev;
      index = state.index;
      mode = state.mode;
      transition = state.transition;
      defaultBackground = state.defaultBackground ?? null;
      hasDeck = true;
      pendingCursor = null;
      return snapshot();
    },

    applyDeck(payload) {
      // A re-broadcast of the deck we already hold (e.g. the OTHER window reloaded
      // and main re-pushed to BOTH windows) carries the same `rev` → identical
      // contents (main bumps `rev` on every deck change). Keep the SAME deck
      // reference so memoized media layers don't needlessly remount their
      // <video>/<img> (B3). mode/index ride the cursor, so the snapshot is correct.
      if (hasDeck && payload.rev === rev) {
        return snapshot();
      }
      deck = payload.deck;
      rev = payload.rev;
      defaultBackground = payload.defaultBackground ?? null;
      hasDeck = true;
      // A cursor that raced ahead of this deck applies now, if it matches.
      if (pendingCursor && pendingCursor.rev === rev) {
        index = pendingCursor.index;
        mode = pendingCursor.mode;
        transition = pendingCursor.transition;
      }
      // Drop any stale buffered cursor regardless (it can never apply now).
      pendingCursor = null;
      return snapshot();
    },

    applyCursor(payload) {
      // Superseded: belongs to a deck we've already replaced. Ignore (ordering guard).
      if (hasDeck && payload.rev < rev) return null;
      // Ahead of its deck: buffer and wait for the matching deck push.
      if (!hasDeck || payload.rev > rev) {
        pendingCursor = payload;
        return null;
      }
      index = payload.index;
      mode = payload.mode;
      transition = payload.transition;
      return snapshot();
    },

    current() {
      return hasDeck ? snapshot() : null;
    },
  };
}
