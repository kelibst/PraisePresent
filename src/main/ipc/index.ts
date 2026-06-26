import { registerSettingsHandlers } from './settingsHandlers';
import { registerPresentHandlers } from './presentHandlers';
import { registerSongHandlers } from './songHandlers';
import { registerPlanHandlers } from './planHandlers';
import { registerScriptureHandlers } from './scriptureHandlers';

// Register every IPC domain once, on app ready (CLAUDE.md §5.3). New domains
// (scripture/media/ai) register here as they land.
export function registerIpcHandlers(): void {
  registerSettingsHandlers();
  registerPresentHandlers();
  registerSongHandlers();
  registerPlanHandlers();
  registerScriptureHandlers();
}
