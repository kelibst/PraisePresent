import { registerSettingsHandlers } from './settingsHandlers';
import { registerDisplayHandlers } from './displayHandlers';
import { registerCapabilityHandlers } from './capabilityHandlers';
import { registerPresentHandlers } from './presentHandlers';
import { registerSongHandlers } from './songHandlers';
import { registerPlanHandlers } from './planHandlers';
import { registerScriptureHandlers } from './scriptureHandlers';
import { registerMediaHandlers } from './mediaHandlers';
import { registerAiHandlers } from './aiHandlers';
import { registerSearchHandlers } from './searchHandlers';

// Register every IPC domain once, on app ready (CLAUDE.md §5.3). New domains
// (scripture/media/ai) register here as they land.
export function registerIpcHandlers(): void {
  registerSettingsHandlers();
  registerDisplayHandlers();
  registerCapabilityHandlers();
  registerPresentHandlers();
  registerSongHandlers();
  registerPlanHandlers();
  registerScriptureHandlers();
  registerMediaHandlers();
  registerAiHandlers();
  registerSearchHandlers();
}
