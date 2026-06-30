import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SongSummary } from '@/shared/schemas/song';
import type { MediaItem } from '@/shared/schemas/media';
import type { BibleSearchResult } from '@/shared/schemas/scripture';

// searchService fans one query over the scripture/song/media services. Those are
// mocked here so the aggregator is tested in isolation under Node (CLAUDE.md
// §5.8): we assert grouping, per-group caps, case-insensitive song/media
// matching, and fail-safe behavior when a single domain throws.

const searchKeyword = vi.fn<(q: string, limit: number) => BibleSearchResult[]>();
const songList = vi.fn<() => SongSummary[]>();
const mediaList = vi.fn<() => MediaItem[]>();

vi.mock('./scriptureService', () => ({
  scriptureService: { searchKeyword: (q: string, l: number) => searchKeyword(q, l) },
}));
vi.mock('./songService', () => ({
  songService: { list: () => songList() },
}));
vi.mock('./mediaService', () => ({
  mediaService: { list: () => mediaList() },
}));

import { searchService } from './searchService';

function verse(reference: string): BibleSearchResult {
  return {
    bookNumber: 43,
    bookName: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world',
    reference,
  };
}

function song(id: number, title: string, author = '', tags: string[] = []): SongSummary {
  return { id, title, author, ccli: '', tags };
}

function media(id: number, name: string): MediaItem {
  return { id, name, path: `/m/${id}`, kind: 'image', createdAt: '2026-01-01' };
}

beforeEach(() => {
  vi.clearAllMocks();
  searchKeyword.mockReturnValue([]);
  songList.mockReturnValue([]);
  mediaList.mockReturnValue([]);
});

describe('searchService.query', () => {
  it('groups results by domain over the three services', () => {
    searchKeyword.mockReturnValue([verse('John 3:16')]);
    songList.mockReturnValue([song(1, 'Amazing Grace'), song(2, 'How Great')]);
    mediaList.mockReturnValue([media(1, 'grace-bg.png')]);

    const res = searchService.query('grace', 10);
    expect(res.scripture).toHaveLength(1);
    expect(res.songs.map((s) => s.title)).toEqual(['Amazing Grace']);
    expect(res.media.map((m) => m.name)).toEqual(['grace-bg.png']);
  });

  it('matches songs case-insensitively across title, author, and tags', () => {
    songList.mockReturnValue([
      song(1, 'Holy Holy', 'Anonymous', ['communion']),
      song(2, 'Doxology', 'Thomas Ken', []),
      song(3, 'Refiner', 'Maverick', ['HOLY-week']),
    ]);
    const res = searchService.query('HOLY', 10);
    expect(res.songs.map((s) => s.id).sort()).toEqual([1, 3]);
  });

  it('caps each group at the limit independently', () => {
    songList.mockReturnValue(Array.from({ length: 20 }, (_, i) => song(i + 1, `Song ${i + 1}`)));
    mediaList.mockReturnValue(
      Array.from({ length: 20 }, (_, i) => media(i + 1, `song-${i + 1}.png`)),
    );
    const res = searchService.query('song', 3);
    expect(res.songs).toHaveLength(3);
    expect(res.media).toHaveLength(3);
    // The scripture cap is honored by passing the limit straight to FTS5.
    expect(searchKeyword).toHaveBeenCalledWith('song', 3);
  });

  it('returns empty groups for a blank query without hitting the services', () => {
    const res = searchService.query('   ', 10);
    expect(res).toEqual({ scripture: [], songs: [], media: [] });
    expect(searchKeyword).not.toHaveBeenCalled();
    expect(songList).not.toHaveBeenCalled();
    expect(mediaList).not.toHaveBeenCalled();
  });

  it('fails safe: one domain throwing yields an empty group, others survive', () => {
    searchKeyword.mockImplementation(() => {
      throw new Error('FTS5 down');
    });
    songList.mockReturnValue([song(1, 'Grace')]);
    mediaList.mockReturnValue([media(1, 'grace.png')]);

    const res = searchService.query('grace', 10);
    expect(res.scripture).toEqual([]); // failed domain → empty, no throw
    expect(res.songs).toHaveLength(1);
    expect(res.media).toHaveLength(1);
  });
});
