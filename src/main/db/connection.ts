import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import log from '../infra/logger';

let db: Database.Database | null = null;

// Single SQLite connection at the userData path (CLAUDE.md §1.5). better-sqlite3
// is synchronous and main-process only (§5.5).
export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'praisepresent.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    log.info('SQLite opened at', dbPath);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
