import { useCallback, useEffect, useState } from 'react';
import type { PresentState } from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import type { BibleVerse } from '@/shared/schemas/scripture';
import { versesToDeck, verseId } from './scriptureDeck';

// Owns the Scripture screen's staging + live-mirror state (CLAUDE.md §1.3 — all
// IPC through window.api; §1.5 — present truth lives in main, this is a view
// cache). A "staged" passage is the verses the operator has lined up plus the
// index of the verse to lead with. Sending live builds a one-verse-per-slide
// deck and calls present.setDeck (same shape the scripture e2e exercises). The
// hook also subscribes to present state so Pane 3 mirrors what's on screen.

export type StagedPassage = {
  /** The contiguous passage (a verse, a range, or a single keyword hit). */
  verses: BibleVerse[];
  /** Index within `verses` of the verse to lead the deck with. */
  index: number;
};

export type ScripturePresenter = {
  /** Current staged passage, or null when nothing is staged. */
  staged: StagedPassage | null;
  /** Live present state (mirrors main); FAILSAFE until the first push. */
  live: PresentState;
  /** Stage a passage at a given lead index (replaces any prior staging). */
  stage: (verses: BibleVerse[], index: number) => void;
  /** Clear the staged passage (does not touch what's live). */
  clearStaged: () => void;
  /** Move the lead verse within the staged passage. */
  setStagedIndex: (index: number) => void;
  /** Project the staged passage to the audience, leading with the lead verse. */
  sendLive: () => void;
  /** Stage the passage live but it is the caller's start index (alias of sendLive). */
  setAsNext: () => void;
  /** Live controls (mirror the present domain). */
  next: () => void;
  prev: () => void;
  black: () => void;
  clear: () => void;
};

export function useScripturePresenter(): ScripturePresenter {
  const [staged, setStaged] = useState<StagedPassage | null>(null);
  const [live, setLive] = useState<PresentState>(FAILSAFE);

  // Mirror the live deck so Pane 3 shows on-screen-now + next (§5.4).
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await window.api.present.getState();
      if (active && res.ok) setLive(res.data);
    })();
    const unsubscribe = window.api.present.onState((state) => {
      if (active) setLive(state);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const stage = useCallback((verses: BibleVerse[], index: number) => {
    if (verses.length === 0) {
      setStaged(null);
      return;
    }
    const clamped = Math.min(Math.max(index, 0), verses.length - 1);
    setStaged({ verses, index: clamped });
  }, []);

  const clearStaged = useCallback(() => setStaged(null), []);

  const setStagedIndex = useCallback((index: number) => {
    setStaged((prev) => {
      if (!prev) return prev;
      const clamped = Math.min(Math.max(index, 0), prev.verses.length - 1);
      return { ...prev, index: clamped };
    });
  }, []);

  const sendLive = useCallback(() => {
    if (!staged) return;
    void window.api.present.setDeck(versesToDeck(staged.verses), staged.index);
  }, [staged]);

  // "Set as Next" stages the same deck live; with present's single-deck model
  // this is the same call as sendLive — kept as a distinct verb for the UI.
  const setAsNext = sendLive;

  const next = useCallback(() => void window.api.present.next(), []);
  const prev = useCallback(() => void window.api.present.prev(), []);
  const black = useCallback(() => void window.api.present.black(), []);
  const clear = useCallback(() => void window.api.present.clear(), []);

  return {
    staged,
    live,
    stage,
    clearStaged,
    setStagedIndex,
    sendLive,
    setAsNext,
    next,
    prev,
    black,
    clear,
  };
}

/** Whether a staged verse is the one currently live (by stable verse id). */
export function isVerseLive(live: PresentState, v: BibleVerse): boolean {
  if (live.mode !== 'slide') return false;
  const slide = live.deck[live.index];
  return slide?.id === verseId(v);
}
