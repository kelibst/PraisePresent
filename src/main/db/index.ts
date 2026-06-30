import { getDb, closeDb } from './connection';
import { runMigrations } from './migrations';

// Open the connection and apply pending migrations. Call once on app ready.
export function initDatabase(): void {
  runMigrations(getDb());
}

export { getDb, closeDb };
