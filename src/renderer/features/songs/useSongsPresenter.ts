import { useCallback, useEffect, useState } from 'react';
import type { PresentState } from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import type { Song, SongImportText, SongSummary } from '@/shared/schemas/song';
import { blocksToDeck } from '@/shared/lib/buildDeck';

// Owns the Songs screen's library + selected-song + live-mirror state
// (CLAUDE.md §1.3 — all IPC through window.api; §1.5 — present truth lives in
// main, this is a view cache). Unlike scripture, songs ARE editable here, so the
// hook exposes create / importText / update / delete in addition to presenting.
// A selected song's sections build an index-stable deck (one slide per section)
// via the shared blocksToDeck, so presenting section i leads the deck at i.

export type SongsPresenter = {
  /** Library list (summaries), newest-first as returned by main. */
  songs: SongSummary[];
  /** The fully-loaded selected song, or null when nothing is open. */
  selected: Song | null;
  /** Live present state (mirrors main); FAILSAFE until the first push. */
  live: PresentState;
  /** Last boundary error surfaced to the operator, or null. */
  error: string | null;
  /** Reload the library from main. */
  refresh: () => Promise<void>;
  /** Open (fully load) a song by id; clears any prior selection on failure. */
  open: (id: number) => Promise<void>;
  /** Create a song from plain lyric text; opens it on success. */
  importText: (input: SongImportText) => Promise<boolean>;
  /** Persist edits to the open song (title/author/ccli/sections). */
  update: (song: Song) => Promise<boolean>;
  /** Delete a song; clears selection if it was the open one. */
  remove: (id: number) => Promise<void>;
  /** Project the open song as a deck, leading with section `index`. */
  presentSection: (index: number) => void;
  /** Live controls (mirror the present domain). */
  next: () => void;
  black: () => void;
  clear: () => void;
};

export function useSongsPresenter(): SongsPresenter {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const [live, setLive] = useState<PresentState>(FAILSAFE);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await window.api.songs.list();
    if (res.ok) setSongs(res.data);
    else setError(res.error);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Mirror the live deck so Pane 3 shows on-screen-now + next (§5.4).
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await window.api.present.getState();
      if (active && res.ok) setLive(res.data);
    })();
    const unsubscribe = window.api.present.onState((state) => {
      if (active) setLive(state);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const open = useCallback(async (id: number) => {
    const res = await window.api.songs.get(id);
    if (res.ok) setSelected(res.data);
    else {
      setSelected(null);
      setError(res.error);
    }
  }, []);

  const importText = useCallback(
    async (input: SongImportText): Promise<boolean> => {
      const res = await window.api.songs.importText(input);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      await refresh();
      await open(res.data);
      return true;
    },
    [refresh, open],
  );

  const update = useCallback(
    async (song: Song): Promise<boolean> => {
      const res = await window.api.songs.update(song);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      await refresh();
      await open(song.id);
      return true;
    },
    [refresh, open],
  );

  const remove = useCallback(
    async (id: number) => {
      const res = await window.api.songs.delete(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSelected((prev) => (prev?.id === id ? null : prev));
      await refresh();
    },
    [refresh],
  );

  // Present the whole song as a deck (one slide per section), leading with the
  // clicked section. Index-stable: deck[i] mirrors sections[i] (see blocksToDeck).
  const presentSection = useCallback(
    (index: number) => {
      if (!selected) return;
      const deck = blocksToDeck(
        selected.sections.map((sec) => ({ text: sec.content, label: sec.label })),
        `song-${selected.id}`,
      );
      void window.api.present.setDeck(deck, index);
    },
    [selected],
  );

  const next = useCallback(() => void window.api.present.next(), []);
  const black = useCallback(() => void window.api.present.black(), []);
  const clear = useCallback(() => void window.api.present.clear(), []);

  return {
    songs,
    selected,
    live,
    error,
    refresh,
    open,
    importText,
    update,
    remove,
    presentSection,
    next,
    black,
    clear,
  };
}

/** Whether the open song's section `index` is the slide currently live. */
export function isSectionLive(live: PresentState, songId: number, index: number): boolean {
  if (live.mode !== 'slide') return false;
  return live.deck[live.index]?.id === `song-${songId}-${index}`;
}
