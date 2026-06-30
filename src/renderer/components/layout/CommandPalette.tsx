import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Music, Image as ImageIcon } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import type { SearchResults } from '@/shared/schemas/search';

// Global ⌘K palette (CLAUDE.md §5.4). Fans one query over scripture/songs/media
// via `window.api.search.query` (A6) and shows grouped results. Choosing a hit
// navigates to that domain page — this is a discovery/jump affordance for B2; the
// per-screen "go live / add to schedule" actions land with the screen re-skins.
//
// cmdk does its own substring filtering on item text, which would fight live
// server results; we disable it (`shouldFilter={false}`) and drive the list from
// `search.query` directly.

const EMPTY: SearchResults = { scripture: [], songs: [], media: [] };

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  // Guards against an out-of-order response overwriting a newer one.
  const seq = useRef(0);

  // Reset transient state whenever the palette closes.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(EMPTY);
      setLoading(false);
    }
  }, [open]);

  // Debounced live search over the real data (§1.3 — window.api only).
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ticket = ++seq.current;
    const handle = setTimeout(() => {
      void window.api.search.query(q).then((res) => {
        if (ticket !== seq.current) return; // a newer query superseded this one
        setResults(res.ok ? res.data : EMPTY);
        setLoading(false);
      });
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults =
    results.scripture.length > 0 || results.songs.length > 0 || results.media.length > 0;
  const trimmed = query.trim();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search scripture, songs, media…"
      />
      <CommandList>
        {trimmed.length === 0 ? (
          <CommandEmpty>Type to search scripture, songs and media.</CommandEmpty>
        ) : !hasResults && !loading ? (
          <CommandEmpty>No results for “{trimmed}”.</CommandEmpty>
        ) : null}

        {results.scripture.length > 0 && (
          <CommandGroup heading="Scripture">
            {results.scripture.map((hit) => (
              <CommandItem
                key={`scripture-${hit.bookNumber}-${hit.chapter}-${hit.verse}`}
                value={`scripture-${hit.reference}`}
                onSelect={() => go('/scripture')}
              >
                <BookOpen aria-hidden="true" />
                <span className="font-medium">{hit.reference}</span>
                <span className="truncate text-pp-text-muted">{hit.text}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.songs.length > 0 && (
          <CommandGroup heading="Songs">
            {results.songs.map((song) => (
              <CommandItem
                key={`song-${song.id}`}
                value={`song-${song.id}`}
                onSelect={() => go('/songs')}
              >
                <Music aria-hidden="true" />
                <span className="font-medium">{song.title}</span>
                {song.author && <span className="truncate text-pp-text-muted">{song.author}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.media.length > 0 && (
          <CommandGroup heading="Media">
            {results.media.map((item) => (
              <CommandItem
                key={`media-${item.id}`}
                value={`media-${item.id}`}
                onSelect={() => go('/media')}
              >
                <ImageIcon aria-hidden="true" />
                <span className="font-medium">{item.name}</span>
                <span className="truncate text-pp-text-muted">{item.kind}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
