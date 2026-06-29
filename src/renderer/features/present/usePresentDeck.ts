import { useCallback, useEffect, useState } from 'react';
import type { PresentState, TransitionType, SlideBackground } from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import type { BibleVerse } from '@/shared/schemas/scripture';
import { versesToDeck } from '@/renderer/features/scripture/scriptureDeck';

// THE single live-deck hook for the unified Present screen (CLAUDE.md §1.3 — all
// IPC through window.api; §1.5 — present truth lives in main, this is a view
// cache). It owns:
//   • staging state — the verses an operator has lined up plus the lead index;
//   • the ONE `present.onState` subscription on the whole screen (efficiency: no
//     pane subscribes on its own — they all read `live` from here).
// Sending live builds a one-verse-per-slide deck and calls present.setDeck (the
// same shape the scripture e2e exercises). Transport + transition controls mirror
// the present domain so the cockpit drives the same state the preview reflects.

export type StagedPassage = {
  /** The contiguous passage (a verse, a range, or a single keyword hit). */
  verses: BibleVerse[];
  /** Index within `verses` of the verse to lead the deck with. */
  index: number;
};

export type PresentDeck = {
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
  /**
   * Stage an arbitrary passage (e.g. an AI candidate) AND project it live in one
   * call, leading at `index`. Lets the Live Detect tab feed the SAME shared deck
   * without opening its own present subscription (efficiency, §1.9).
   */
  projectVerses: (verses: BibleVerse[], index?: number) => void;
  /** Stage the passage live starting at its lead index (alias of sendLive). */
  setAsNext: () => void;
  /** Live transport controls (mirror the present domain). */
  next: () => void;
  prev: () => void;
  goto: (index: number) => void;
  black: () => void;
  blank: () => void;
  clear: () => void;
  /** Re-broadcast the current deck with a new transition type. */
  setTransition: (type: TransitionType) => void;
  /**
   * Set (or clear, with `null`) the background of the current live slide, or of
   * every slide when `applyToAll` is true. Main re-validates + clamps (§5.7).
   */
  setBackground: (background: SlideBackground | null, applyToAll?: boolean) => void;
  /**
   * Replace the text of the current live slide (or the slide at `index`). Main
   * clamps + rejects edits to locked (scripture) slides — the live state push
   * is the source of truth, so a rejected edit simply leaves the deck unchanged.
   */
  updateText: (lines: string[], index?: number) => void;
};

export function usePresentDeck(): PresentDeck {
  const [staged, setStaged] = useState<StagedPassage | null>(null);
  const [live, setLive] = useState<PresentState>(FAILSAFE);

  // The single live-state subscription for the whole Present screen. Pulls
  // current state on mount so previews are correct even if the deck was set
  // before this screen mounted (no broadcast has fired yet) — §5.4.
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

  // Stage + project in one call (the staged state also updates so the preview
  // and deck rail reflect what was just sent). Used by the Live Detect tab to
  // route a reviewed candidate through the single shared deck.
  const projectVerses = useCallback((verses: BibleVerse[], index = 0) => {
    if (verses.length === 0) return;
    const clamped = Math.min(Math.max(index, 0), verses.length - 1);
    setStaged({ verses, index: clamped });
    void window.api.present.setDeck(versesToDeck(verses), clamped);
  }, []);

  // "Set as Next" stages the same deck live; with present's single-deck model
  // this is the same call as sendLive — kept as a distinct verb for the UI.
  const setAsNext = sendLive;

  const next = useCallback(() => void window.api.present.next(), []);
  const prev = useCallback(() => void window.api.present.prev(), []);
  const goto = useCallback((index: number) => void window.api.present.goto(index), []);
  const black = useCallback(() => void window.api.present.black(), []);
  const blank = useCallback(() => void window.api.present.blank(), []);
  const clear = useCallback(() => void window.api.present.clear(), []);

  // Re-broadcast the same deck with the new transition (main is the source).
  const setTransition = useCallback(
    (type: TransitionType) => {
      void window.api.present.setDeck(live.deck, live.index, {
        type,
        durationMs: live.transition.durationMs,
      });
    },
    [live.deck, live.index, live.transition.durationMs],
  );

  // Set/clear the live slide background. Targets the current live index (main
  // re-clamps); `applyToAll` overrides that and paints every slide.
  const setBackground = useCallback((background: SlideBackground | null, applyToAll = false) => {
    void window.api.present.setBackground(background, undefined, applyToAll);
  }, []);

  // Edit the live slide's text. `index` omitted → the current live slide (main
  // re-clamps and rejects locked/scripture slides).
  const updateText = useCallback((lines: string[], index?: number) => {
    void window.api.present.updateText(lines, index);
  }, []);

  return {
    staged,
    live,
    stage,
    clearStaged,
    setStagedIndex,
    sendLive,
    projectVerses,
    setAsNext,
    next,
    prev,
    goto,
    black,
    blank,
    clear,
    setTransition,
    setBackground,
    updateText,
  };
}
