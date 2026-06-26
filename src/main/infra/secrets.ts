import { safeStorage } from 'electron';
import { getDb } from '../db/connection';

// Encrypted secret storage for API keys etc. (CLAUDE.md §1.7). Values are
// encrypted with the OS secure storage (safeStorage, backed by the platform
// keyring) and persisted as BLOBs in SQLite. There is deliberately NO IPC
// channel that returns a decrypted secret — secrets live and die in main.
export const secrets = {
  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  },

  set(key: string, plaintext: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS secure storage is unavailable (no platform keyring).');
    }
    const encrypted = safeStorage.encryptString(plaintext);
    getDb()
      .prepare(
        `INSERT INTO secrets (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(key, encrypted);
  },

  get(key: string): string | null {
    const row = getDb().prepare('SELECT value FROM secrets WHERE key = ?').get(key) as
      | { value: Buffer }
      | undefined;
    if (!row) return null;
    return safeStorage.decryptString(row.value);
  },

  has(key: string): boolean {
    return getDb().prepare('SELECT 1 FROM secrets WHERE key = ?').get(key) !== undefined;
  },

  delete(key: string): void {
    getDb().prepare('DELETE FROM secrets WHERE key = ?').run(key);
  },
};
