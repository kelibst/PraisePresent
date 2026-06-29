import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PaneHeader } from '@/renderer/components/common';
import { Input } from '@/renderer/components/ui/input';
import { cn } from '@/renderer/lib/utils';
import type { SongSummary } from '@/shared/schemas/song';

// Pane 1: the song library. PaneHeader + sage "New Song", a search box (matches
// title/author/CCLI), category filter chips derived from song tags (always an
// "All" chip; per-tag chips only when tags exist), and the selectable song-row
// list. Selection shows a sage left bar + tint. Pure view — all data + actions
// come from the parent (CLAUDE.md §1.3); keyboard operable (§5.4).

type Props = {
  songs: SongSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
};

const ALL = 'All';

export default function LibraryPane({ songs, selectedId, onSelect, onNew }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);

  // Categories are the distinct, title-cased song tags, fronted by "All".
  const categories = useMemo(() => {
    const tags = new Set<string>();
    for (const s of songs) for (const tag of s.tags) if (tag.trim()) tags.add(tag.trim());
    return [ALL, ...Array.from(tags).sort((a, b) => a.localeCompare(b))];
  }, [songs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((s) => {
      const inCategory = category === ALL || s.tags.some((t) => t.trim() === category);
      if (!inCategory) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.ccli.toLowerCase().includes(q)
      );
    });
  }, [songs, query, category]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-pp-border-soft bg-pp-surface-1">
      <PaneHeader
        label={
          <span role="heading" aria-level={1}>
            Songs
          </span>
        }
        actions={
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded-md bg-pp-accent px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-pp-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            <Plus className="size-3.5" aria-hidden /> New Song
          </button>
        }
      />

      <div className="flex flex-col gap-3 p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-pp-text-dim"
            aria-hidden
          />
          <Input
            aria-label="Search songs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, lyrics…"
            className="h-9 pl-8"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  category === cat
                    ? 'bg-pp-accent text-primary-foreground'
                    : 'bg-pp-surface-2 text-pp-text-muted hover:bg-pp-surface-alt',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-3">
        {filtered.map((s) => {
          const selected = s.id === selectedId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-current={selected || undefined}
                className={cn(
                  'w-full rounded-md border-l-2 px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                  selected
                    ? 'border-pp-accent bg-pp-accent/10'
                    : 'border-transparent hover:bg-pp-surface-2',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-pp-text-primary">{s.title}</span>
                  {s.ccli && (
                    <span className="shrink-0 rounded bg-pp-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-pp-text-dim">
                      CCLI {s.ccli}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-pp-text-muted">
                  {s.author ? `${s.author} · ` : ''}
                  {s.tags.length > 0 ? s.tags.join(' · ') : 'Song'}
                </p>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-pp-text-dim">
            {songs.length === 0 ? 'No songs yet — add one.' : 'No songs match.'}
          </li>
        )}
      </ul>
    </section>
  );
}
