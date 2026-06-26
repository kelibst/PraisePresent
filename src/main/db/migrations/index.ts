import type { Database } from 'better-sqlite3';
import log from '../../infra/logger';

// Forward-only migrations (CLAUDE.md §5.5). Never edit a shipped migration —
// add a new one with the next id. SQL is inlined (not loaded from .sql files)
// so it bundles cleanly and survives the asar at runtime.
type Migration = { id: number; name: string; up: string };

const migrations: Migration[] = [
  {
    id: 1,
    name: 'init_settings',
    up: `CREATE TABLE IF NOT EXISTS settings (
           key   TEXT PRIMARY KEY,
           value TEXT NOT NULL
         );`,
  },
  {
    id: 2,
    name: 'init_secrets',
    // Values are safeStorage-encrypted blobs (CLAUDE.md §1.7) — never plaintext.
    up: `CREATE TABLE IF NOT EXISTS secrets (
           key   TEXT PRIMARY KEY,
           value BLOB NOT NULL
         );`,
  },
  {
    id: 3,
    name: 'init_songs',
    up: `CREATE TABLE IF NOT EXISTS songs (
           id     INTEGER PRIMARY KEY AUTOINCREMENT,
           title  TEXT NOT NULL,
           author TEXT NOT NULL DEFAULT '',
           ccli   TEXT NOT NULL DEFAULT '',
           tags   TEXT NOT NULL DEFAULT '[]'
         );
         CREATE TABLE IF NOT EXISTS song_sections (
           id         INTEGER PRIMARY KEY AUTOINCREMENT,
           song_id    INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
           kind       TEXT NOT NULL,
           label      TEXT NOT NULL,
           content    TEXT NOT NULL,
           sort_order INTEGER NOT NULL
         );
         CREATE INDEX IF NOT EXISTS idx_song_sections_song ON song_sections(song_id);`,
  },
];

// Idempotent: applied migrations are tracked in _migrations; only pending ones
// run, inside a single transaction.
export function runMigrations(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);

  const appliedRows = db.prepare('SELECT id FROM _migrations').all() as { id: number }[];
  const applied = new Set(appliedRows.map((r) => r.id));
  const pending = migrations.filter((m) => !applied.has(m.id)).sort((a, b) => a.id - b.id);
  if (pending.length === 0) return;

  const apply = db.transaction((toApply: Migration[]) => {
    for (const m of toApply) {
      db.exec(m.up);
      db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)').run(m.id, m.name);
      log.info(`Migration ${m.id} (${m.name}) applied.`);
    }
  });
  apply(pending);
}
