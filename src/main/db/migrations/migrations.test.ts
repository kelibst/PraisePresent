import { describe, it, expect } from 'vitest';
import type { Database } from 'better-sqlite3';
import { runMigrations } from './index';

// Minimal fake of the better-sqlite3 surface runMigrations uses, with stateful
// _migrations tracking — lets us assert idempotency without the native binary.
function makeFakeDb() {
  const applied = new Set<number>();
  const execed: string[] = [];
  const db = {
    exec: (sql: string) => {
      execed.push(sql);
    },
    prepare: (sql: string) => ({
      all: () => (sql.includes('FROM _migrations') ? [...applied].map((id) => ({ id })) : []),
      run: (...args: unknown[]) => {
        if (sql.includes('INSERT INTO _migrations')) applied.add(args[0] as number);
      },
      get: () => undefined,
    }),
    transaction: (fn: (arg: unknown) => void) => (arg: unknown) => fn(arg),
  };
  return { db: db as unknown as Database, applied, execed };
}

describe('migration runner', () => {
  it('applies all pending migrations on a fresh db', () => {
    const { db, applied } = makeFakeDb();
    runMigrations(db);
    // At least the first migrations are recorded; count grows as domains land.
    expect(applied.has(1)).toBe(true);
    expect(applied.has(2)).toBe(true);
    expect(applied.size).toBeGreaterThanOrEqual(2);
  });

  it('is idempotent — a second run applies nothing new', () => {
    const { db, applied, execed } = makeFakeDb();
    runMigrations(db);
    const sizeAfterFirst = applied.size;
    const countAfterFirst = execed.length;
    runMigrations(db);
    // Only the _migrations CREATE TABLE re-runs; no migration's own DDL re-applies.
    const reAppliedMigrationSql = execed
      .slice(countAfterFirst)
      .filter((s) => /CREATE TABLE IF NOT EXISTS (settings|secrets|songs)/.test(s));
    expect(reAppliedMigrationSql).toHaveLength(0);
    expect(applied.size).toBe(sizeAfterFirst); // nothing new applied
  });
});
