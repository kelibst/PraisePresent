import { getDb } from '../connection';
import type { MediaItem, MediaKind } from '@/shared/schemas/media';

// All media DB access behind this repository (CLAUDE.md §5.5); parameterized
// queries only. The library references files by their original path — `path` is
// UNIQUE so adding the same file twice is idempotent (returns the existing row).
type MediaRow = {
  id: number;
  name: string;
  path: string;
  kind: string;
  created_at: string;
};

function mapMedia(r: MediaRow): MediaItem {
  return {
    id: r.id,
    name: r.name,
    path: r.path,
    kind: r.kind as MediaKind,
    createdAt: r.created_at,
  };
}

export const mediaRepository = {
  list(): MediaItem[] {
    const rows = getDb()
      .prepare(
        'SELECT id, name, path, kind, created_at FROM media ORDER BY created_at DESC, id DESC',
      )
      .all() as MediaRow[];
    return rows.map(mapMedia);
  },

  // The original path + the optional pre-scaled rendition path (B6b). Used ONLY by
  // the app-media:// protocol handler to allow-list which files may be served (§5.2):
  // the protocol serves the rendition when it exists on disk, else the original.
  getServeInfo(id: number): { original: string; rendition: string | null } | null {
    const r = getDb().prepare('SELECT path, rendition_path FROM media WHERE id = ?').get(id) as
      | { path: string; rendition_path: string | null }
      | undefined;
    if (!r) return null;
    return { original: r.path, rendition: r.rendition_path ?? null };
  },

  // Set (or clear with null) the cached rendition path for a media id (B6b).
  setRendition(id: number, renditionPath: string | null): void {
    getDb().prepare('UPDATE media SET rendition_path = ? WHERE id = ?').run(renditionPath, id);
  },

  // Idempotent add: insert, or return the existing row's id on the UNIQUE path.
  add(name: string, filePath: string, kind: MediaKind): number {
    const db = getDb();
    db.prepare(
      `INSERT INTO media (name, path, kind) VALUES (?, ?, ?)
       ON CONFLICT(path) DO UPDATE SET name = excluded.name`,
    ).run(name, filePath, kind);
    // Read the id back by the UNIQUE path: correct whether this was an insert or
    // an idempotent re-add (lastInsertRowid is unreliable on the UPDATE branch).
    const row = db.prepare('SELECT id FROM media WHERE path = ?').get(filePath) as { id: number };
    return row.id;
  },

  remove(id: number): void {
    getDb().prepare('DELETE FROM media WHERE id = ?').run(id);
  },
};
