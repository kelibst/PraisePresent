import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, Database.Database> = new Map();
  private dbDir: string;

  private constructor(dbDir: string) {
    this.dbDir = dbDir;
  }

  public static getInstance(dbDir?: string): DatabaseManager {
    if (!DatabaseManager.instance) {
      if (!dbDir) {
        throw new Error('Database directory must be provided on first initialization');
      }
      DatabaseManager.instance = new DatabaseManager(dbDir);
    }
    return DatabaseManager.instance;
  }

  public getConnection(bibleVersion: string): Database.Database {
    if (this.connections.has(bibleVersion)) {
      return this.connections.get(bibleVersion)!;
    }

    const dbPath = path.join(this.dbDir, `${bibleVersion}.sqlite`);
    
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file for ${bibleVersion} not found at ${dbPath}`);
    }

    const db = new Database(dbPath, { readonly: true });
    this.connections.set(bibleVersion, db);
    return db;
  }

  public closeAll(): void {
    this.connections.forEach(connection => connection.close());
    this.connections.clear();
  }
}
