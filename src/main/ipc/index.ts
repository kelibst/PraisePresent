import { registerSettingsHandlers } from './settingsHandlers';
import { registerPresentHandlers } from './presentHandlers';
import { registerSongHandlers } from './songHandlers';

// Register every IPC domain once, on app ready (CLAUDE.md §5.3). New domains
// (scripture/media/plans/ai) register here as they land.
export function registerIpcHandlers(): void {
  registerSettingsHandlers();
  registerPresentHandlers();
  registerSongHandlers();
}
