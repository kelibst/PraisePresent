import { CHANNELS } from '@/shared/constants/channels';
import { presentState } from '@/shared/schemas/present';
import { setLiveState } from '../windows/windowManager';
import { handle } from './registry';

// Presenter sets the live state; main validates and broadcasts it to the
// audience window (CLAUDE.md §5.3).
export function registerPresentHandlers(): void {
  handle(CHANNELS.present.setState, presentState, (state): void => {
    setLiveState(state);
  });
}
