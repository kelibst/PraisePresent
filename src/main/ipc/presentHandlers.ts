import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import { setDeckInput, gotoInput } from '@/shared/schemas/present';
import { dispatchPresent, setDeck, getLiveState } from '../windows/windowManager';
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
