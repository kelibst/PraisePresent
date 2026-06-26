import { CHANNELS } from '@/shared/constants/channels';
import { settingsGetRequest, settingsSetRequest } from '@/shared/schemas/settings';
import { handle } from './registry';

// In-memory store for the T1 contract demo. P2-T2 replaces this with the SQLite
// settingsRepository (truth lives in SQLite — CLAUDE.md §1.5).
const store = new Map<string, string>();

export function registerSettingsHandlers(): void {
  handle(CHANNELS.settings.get, settingsGetRequest, ({ key }): string | null => store.get(key) ?? null);
  handle(CHANNELS.settings.set, settingsSetRequest, ({ key, value }): void => {
    store.set(key, value);
  });
}
