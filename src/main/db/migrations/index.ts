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
  {
    id: 4,
    name: 'init_plans',
    up: `CREATE TABLE IF NOT EXISTS plans (
           id            INTEGER PRIMARY KEY AUTOINCREMENT,
           name          TEXT NOT NULL,
           scheduled_for TEXT,
           notes         TEXT NOT NULL DEFAULT ''
         );
         CREATE TABLE IF NOT EXISTS plan_items (
           id         INTEGER PRIMARY KEY AUTOINCREMENT,
           plan_id    INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
           kind       TEXT NOT NULL,
           ref_id     INTEGER,
           title      TEXT NOT NULL,
           content    TEXT NOT NULL DEFAULT '',
           sort_order INTEGER NOT NULL
         );
         CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON plan_items(plan_id);`,
  },
  {
    id: 5,
    name: 'init_scripture',
    // Bible text is hydrated once from the bundled WEB dataset (offline-first).
    // bible_verses_fts is an external-content FTS5 index over bible_verses.text;
    // it's kept in sync explicitly at hydration (no triggers — bulk load only).
    up: `CREATE TABLE IF NOT EXISTS bible_translations (
           id           INTEGER PRIMARY KEY AUTOINCREMENT,
           abbreviation TEXT NOT NULL UNIQUE,
           name         TEXT NOT NULL,
           license      TEXT NOT NULL DEFAULT ''
         );
         CREATE TABLE IF NOT EXISTS bible_books (
           number       INTEGER PRIMARY KEY,
           name         TEXT NOT NULL,
           abbreviation TEXT NOT NULL,
           osis_id      TEXT NOT NULL,
           testament    TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS bible_verses (
           id             INTEGER PRIMARY KEY AUTOINCREMENT,
           translation_id INTEGER NOT NULL REFERENCES bible_translations(id) ON DELETE CASCADE,
           book_number    INTEGER NOT NULL REFERENCES bible_books(number),
           chapter        INTEGER NOT NULL,
           verse          INTEGER NOT NULL,
           text           TEXT NOT NULL,
           UNIQUE(translation_id, book_number, chapter, verse)
         );
         CREATE INDEX IF NOT EXISTS idx_bible_verses_ref
           ON bible_verses(translation_id, book_number, chapter, verse);
         CREATE VIRTUAL TABLE IF NOT EXISTS bible_verses_fts USING fts5(
           text,
           content='bible_verses',
           content_rowid='id',
           tokenize='porter unicode61'
         );`,
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
