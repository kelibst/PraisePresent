import { z } from 'zod';
import { songSummary } from './song';
import { bibleSearchResult } from './scripture';
import { mediaItem } from './media';

// Global-search domain schemas (CLAUDE.md §5.1/§5.3). The aggregator fans one
// query over the existing scripture/song/media services and returns typed,
// per-domain groups (each capped) — no new Bible/song/media logic. The ⌘K
// palette UI (Stage B2) consumes this; here we only define the boundary shape.

// Request: a free-text query plus an optional per-group cap (bounded so a hostile
// renderer can't ask for an unbounded scan). Default cap = 10 per group.
export const searchQueryRequest = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().positive().max(50).default(10),
});

// A scripture hit reuses the existing keyword-search row (verse + reference).
export const searchScriptureHit = bibleSearchResult;

// A song hit is the existing summary (id/title/author/ccli/tags).
export const searchSongHit = songSummary;

// A media hit is the existing library item.
export const searchMediaHit = mediaItem;

// Grouped results. Each group is independently capped at `limit`. Empty arrays
// when a domain has no matches (or its service is unavailable — fail-safe §5.7).
export const searchResults = z.object({
  scripture: z.array(searchScriptureHit),
  songs: z.array(searchSongHit),
  media: z.array(searchMediaHit),
});

export type SearchQueryRequest = z.infer<typeof searchQueryRequest>;
export type SearchScriptureHit = z.infer<typeof searchScriptureHit>;
export type SearchSongHit = z.infer<typeof searchSongHit>;
export type SearchMediaHit = z.infer<typeof searchMediaHit>;
export type SearchResults = z.infer<typeof searchResults>;
