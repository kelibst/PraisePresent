import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import {
  setDeckInput,
  gotoInput,
  setBackgroundInput,
  updateTextInput,
  setTransitionInput,
} from '@/shared/schemas/present';
import {
  dispatchPresent,
  setDeck,
  setBackground,
  updateText,
  getLiveState,
} from '../windows/windowManager';
import { handle } from './registry';
import type { PresentState } from '@/shared/schemas/present';

// Live-presentation control surface. Each handler validates its payload, mutates
// main's single source of truth through the reducer, and re-broadcasts to both
// windows (CLAUDE.md §5.3). The renderer is never trusted; main re-clamps (§5.7).
export function registerPresentHandlers(): void {
  handle(CHANNELS.present.setDeck, setDeckInput, ({ deck, index, transition }): void => {
    setDeck(deck, index, transition);
  });

  handle(CHANNELS.present.goto, gotoInput, ({ index }): void => {
    dispatchPresent({ type: 'goto', index });
  });

  // Set/clear a slide background on the live deck. The schema has already
  // re-validated the color (safe-form allow-list) / url; the reducer clamps the
  // index and never changes mode — the audience can only fail safe (§5.7).
  handle(
    CHANNELS.present.setBackground,
    setBackgroundInput,
    ({ index, background, applyToAll }): void => {
      setBackground(background, index, applyToAll);
    },
  );

  // Replace a slide's text on the live deck. The schema has bounded the line
  // count/length; the reducer clamps the index AND hard-rejects the edit when the
  // target slide is `locked` (scripture) — the renderer can never edit scripture
  // text even via a crafted call (§5.3). Mode/index are never changed (§5.7).
  handle(CHANNELS.present.updateText, updateTextInput, ({ index, lines }): void => {
    updateText(lines, index);
  });

  // Change ONLY the transition. The transition rides the cursor payload, so this is
  // a cursor-only broadcast — no full-deck round-trip (B1, fixes the old pattern of
  // re-sending the whole deck just to swap the transition type).
  handle(CHANNELS.present.setTransition, setTransitionInput, ({ transition }): void => {
    dispatchPresent({ type: 'setTransition', transition });
  });

  // No-input controls.
  handle(CHANNELS.present.next, z.undefined(), (): void => {
    dispatchPresent({ type: 'next' });
  });
  handle(CHANNELS.present.prev, z.undefined(), (): void => {
    dispatchPresent({ type: 'prev' });
  });
  handle(CHANNELS.present.black, z.undefined(), (): void => {
    dispatchPresent({ type: 'black' });
  });
  handle(CHANNELS.present.blank, z.undefined(), (): void => {
    dispatchPresent({ type: 'blank' });
  });
  handle(CHANNELS.present.clear, z.undefined(), (): void => {
    dispatchPresent({ type: 'clear' });
  });

  // A view (e.g. the presenter page) mounting mid-service reads current state so
  // its preview is correct before the next broadcast (§5.4).
  handle(CHANNELS.present.getState, z.undefined(), (): PresentState => getLiveState());
}
