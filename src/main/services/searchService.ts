import { scriptureService } from './scriptureService';
import { songService } from './songService';
import { mediaService } from './mediaService';
import log from '../infra/logger';
import type { SearchResults } from '@/shared/schemas/search';
import type { SongSummary } from '@/shared/schemas/song';
import type { MediaItem } from '@/shared/schemas/media';

// Global-search aggregator (CLAUDE.md §5). Fans ONE query over the existing
// scripture/song/media services and returns typed, per-domain groups — each
// independently capped. It REUSES those services and adds no new Bible/song/media
// logic: scripture keyword search is FTS5 (scriptureService.searchKeyword); songs
// and media have no keyword index, so we filter their `list()` by a simple
// case-insensitive substring (title/author/tags for songs, name for media).
//
// Fail-safe (§5.7): if any one domain's service throws, its group comes back
// empty and the others still return — a search box never crashes the operator.

function matchesSong(song: SongSummary, needle: string): boolean {
  if (song.title.toLowerCase().includes(needle)) return true;
  if (song.author.toLowerCase().includes(needle)) return true;
  return song.tags.some((t) => t.toLowerCase().includes(needle));
}

function matchesMedia(item: MediaItem, needle: string): boolean {
  return item.name.toLowerCase().includes(needle);
}

// Run one domain, capped, never throwing — a failing service yields an empty
// group rather than failing the whole search.
function safeGroup<T>(domain: string, run: () => T[]): T[] {
  try {
    return run();
  } catch (e) {
    log.warn(`search: ${domain} group failed —`, e);
    return [];
  }
}

export const searchService = {
  // `limit` caps EACH group independently (the schema bounds it at the boundary).
  query(query: string, limit: number): SearchResults {
    const needle = query.trim().toLowerCase();
    if (!needle) return { scripture: [], songs: [], media: [] };

    const scripture = safeGroup('scripture', () =>
      // FTS5 keyword search already returns ranked, capped rows.
      scriptureService.searchKeyword(query, limit),
    );

    const songs = safeGroup('songs', () =>
      songService
        .list()
        .filter((s) => matchesSong(s, needle))
        .slice(0, limit),
    );

    const media = safeGroup('media', () =>
      mediaService
        .list()
        .filter((m) => matchesMedia(m, needle))
        .slice(0, limit),
    );

    return { scripture, songs, media };
  },
};
