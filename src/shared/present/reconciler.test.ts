import { describe, it, expect } from 'vitest';
import { createPresentReconciler } from './reconciler';
import type {
  PresentSlide,
  PresentDeckPayload,
  PresentCursorPayload,
} from '@/shared/schemas/present';
import { DEFAULT_TRANSITION } from '@/shared/schemas/present';

function slide(id: string): PresentSlide {
  return { id, lines: [id] };
}
const deck = [slide('a'), slide('b'), slide('c')];

function deckPayload(rev: number): PresentDeckPayload {
  return { rev, deck, defaultBackground: null };
}
function cursorPayload(
  rev: number,
  index: number,
  mode: 'slide' | 'black' = 'slide',
): PresentCursorPayload {
  return { rev, index, mode, transition: DEFAULT_TRANSITION };
}

describe('present reconciler (deck/cursor merge)', () => {
  it('has no state until a deck (or seed) arrives', () => {
    const r = createPresentReconciler();
    expect(r.current()).toBeNull();
    // A cursor before any deck is buffered, not emitted.
    expect(r.applyCursor(cursorPayload(0, 1))).toBeNull();
    expect(r.current()).toBeNull();
  });

  it('merges a deck push and a cursor push into one PresentState', () => {
    const r = createPresentReconciler();
    const afterDeck = r.applyDeck(deckPayload(1));
    expect(afterDeck.deck).toHaveLength(3);
    expect(afterDeck.rev).toBe(1);
    const afterCursor = r.applyCursor(cursorPayload(1, 2));
    expect(afterCursor).not.toBeNull();
    expect(afterCursor!.index).toBe(2);
    expect(afterCursor!.deck).toBe(deck); // same deck reference (stable for memo/B3)
    expect(afterCursor!.mode).toBe('slide');
  });

  it('keeps the deck reference stable across cursor moves (media stability — B3)', () => {
    const r = createPresentReconciler();
    const d = r.applyDeck(deckPayload(3));
    const c1 = r.applyCursor(cursorPayload(3, 0))!;
    const c2 = r.applyCursor(cursorPayload(3, 1))!;
    expect(c1.deck).toBe(d.deck);
    expect(c2.deck).toBe(d.deck);
  });

  it('a re-broadcast of the same rev keeps the deck reference stable (no remount — B3)', () => {
    const r = createPresentReconciler();
    const first = r.applyDeck(deckPayload(2));
    // A NEW array with the same rev (e.g. the other window reloaded → main re-pushed
    // a freshly-deserialized deck). The reconciler must keep its existing reference.
    const second = r.applyDeck({
      rev: 2,
      deck: [slide('a'), slide('b'), slide('c')],
      defaultBackground: null,
    });
    expect(second.deck).toBe(first.deck); // identity preserved, not the new array
    expect(second.rev).toBe(2);
  });

  it('ignores a superseded cursor (rev older than the cached deck)', () => {
    const r = createPresentReconciler();
    r.applyDeck(deckPayload(5));
    // A cursor for an older deck must be dropped (ordering guard).
    expect(r.applyCursor(cursorPayload(4, 1))).toBeNull();
    // The current state still reflects the new deck, not the stale cursor.
    expect(r.current()!.rev).toBe(5);
  });

  it('buffers a cursor that arrives before its deck, then applies it when the deck lands', () => {
    const r = createPresentReconciler();
    r.applyDeck(deckPayload(1));
    // A cursor for the NEXT deck (rev 2) arrives early — buffered, not emitted.
    expect(r.applyCursor(cursorPayload(2, 2))).toBeNull();
    expect(r.current()!.index).toBe(0); // unchanged until its deck arrives
    // The matching deck lands → the buffered cursor is applied.
    const merged = r.applyDeck(deckPayload(2));
    expect(merged.index).toBe(2);
    expect(merged.rev).toBe(2);
  });

  it('seed() establishes full state for a late mount', () => {
    const r = createPresentReconciler();
    const seeded = r.seed({
      mode: 'slide',
      deck,
      index: 1,
      transition: DEFAULT_TRANSITION,
      rev: 7,
      defaultBackground: null,
    });
    expect(seeded.index).toBe(1);
    expect(seeded.rev).toBe(7);
    expect(r.current()).not.toBeNull();
    // A cursor for that same rev applies on top of the seed.
    expect(r.applyCursor(cursorPayload(7, 2))!.index).toBe(2);
  });

  it('a black cursor (mode change) is applied without a deck change', () => {
    const r = createPresentReconciler();
    r.applyDeck(deckPayload(2));
    const black = r.applyCursor(cursorPayload(2, 0, 'black'));
    expect(black!.mode).toBe('black');
  });

  it('carries the service default background from the deck payload into state', () => {
    const r = createPresentReconciler();
    const bg = { type: 'color', color: '#000000' } as const;
    const merged = r.applyDeck({ rev: 1, deck, defaultBackground: bg });
    expect(merged.defaultBackground).toEqual(bg);
    // It persists across cursor-only moves (stable reference, no churn).
    const afterCursor = r.applyCursor(cursorPayload(1, 1))!;
    expect(afterCursor.defaultBackground).toEqual(bg);
  });
});
