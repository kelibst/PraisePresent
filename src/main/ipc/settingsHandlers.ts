import { CHANNELS } from '@/shared/constants/channels';
import { settingsGetRequest, settingsSetRequest } from '@/shared/schemas/settings';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { handle } from './registry';

// Settings IPC backed by SQLite (truth lives in the DB — CLAUDE.md §1.5).
export function registerSettingsHandlers(): void {
  handle(CHANNELS.settings.get, settingsGetRequest, ({ key }): string | null =>
    settingsRepository.get(key),
  );
  handle(CHANNELS.settings.set, settingsSetRequest, ({ key, value }): void => {
    settingsRepository.set(key, value);
  });
}
