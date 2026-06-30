import { getDb } from '../connection';
import type { Song, SongCreate, SongSection, SongSummary } from '@/shared/schemas/song';

// All song DB access behind this repository (CLAUDE.md §5.5); parameterized
// queries only. Song + sections are written atomically in a transaction.
type SongRow = { id: number; title: string; author: string; ccli: string; tags: string };
type SectionRow = { kind: string; label: string; content: string; sort_order: number };

function mapSection(r: SectionRow): SongSection {
  return {
    kind: r.kind as SongSection['kind'],
    label: r.label,
    content: r.content,
    sortOrder: r.sort_order,
  };
}

export const songRepository = {
  list(): SongSummary[] {
    const rows = getDb()
      .prepare('SELECT id, title, author, ccli, tags FROM songs ORDER BY title COLLATE NOCASE')
      .all() as SongRow[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      ccli: r.ccli,
      tags: JSON.parse(r.tags) as string[],
    }));
  },

  get(id: number): Song | null {
    const r = getDb()
      .prepare('SELECT id, title, author, ccli, tags FROM songs WHERE id = ?')
      .get(id) as SongRow | undefined;
    if (!r) return null;
    const sections = getDb()
      .prepare(
        'SELECT kind, label, content, sort_order FROM song_sections WHERE song_id = ? ORDER BY sort_order',
      )
      .all(id) as SectionRow[];
    return {
      id: r.id,
      title: r.title,
      author: r.author,
      ccli: r.ccli,
      tags: JSON.parse(r.tags) as string[],
      sections: sections.map(mapSection),
    };
  },

  create(input: SongCreate): number {
    const db = getDb();
    const tx = db.transaction((s: SongCreate): number => {
      const info = db
        .prepare('INSERT INTO songs (title, author, ccli, tags) VALUES (?, ?, ?, ?)')
        .run(s.title, s.author, s.ccli, JSON.stringify(s.tags));
      const songId = Number(info.lastInsertRowid);
      const insSection = db.prepare(
        'INSERT INTO song_sections (song_id, kind, label, content, sort_order) VALUES (?, ?, ?, ?, ?)',
      );
      for (const sec of s.sections) {
        insSection.run(songId, sec.kind, sec.label, sec.content, sec.sortOrder);
      }
      return songId;
    });
    return tx(input);
  },

  update(input: Song): void {
    const db = getDb();
    const tx = db.transaction((s: Song) => {
      db.prepare('UPDATE songs SET title = ?, author = ?, ccli = ?, tags = ? WHERE id = ?').run(
        s.title,
        s.author,
        s.ccli,
        JSON.stringify(s.tags),
        s.id,
      );
      db.prepare('DELETE FROM song_sections WHERE song_id = ?').run(s.id);
      const insSection = db.prepare(
        'INSERT INTO song_sections (song_id, kind, label, content, sort_order) VALUES (?, ?, ?, ?, ?)',
      );
      for (const sec of s.sections) {
        insSection.run(s.id, sec.kind, sec.label, sec.content, sec.sortOrder);
      }
    });
    tx(input);
  },

  delete(id: number): void {
    // FK ON DELETE CASCADE removes the sections (foreign_keys pragma is ON).
    getDb().prepare('DELETE FROM songs WHERE id = ?').run(id);
  },
};
