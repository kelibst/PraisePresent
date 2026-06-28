import type { Result } from '@/shared/types/result';
import type { PresentState, PresentSlide, Transition } from '@/shared/schemas/present';
import type { Song, SongCreate, SongImportText, SongSummary } from '@/shared/schemas/song';
import type { Plan, PlanCreate, PlanSummary } from '@/shared/schemas/plan';
import type {
  BibleBook,
  BibleSearchResult,
  BibleTranslation,
  BibleVerse,
} from '@/shared/schemas/scripture';
import type { DisplayInfo, AudienceSelection } from '@/shared/schemas/display';
import type { MediaItem } from '@/shared/schemas/media';

// The typed surface exposed on `window.api` by the preload bridge. The renderer
// imports ONLY this type and calls `window.api` — never electron/ipcRenderer
// (CLAUDE.md §5.2). Every request method returns a typed Result.
export interface Api {
  settings: {
    get(key: string): Promise<Result<string | null>>;
    set(key: string, value: string): Promise<Result<void>>;
  };
  display: {
    /** Enumerate connected displays (main-side `screen`). */
    list(): Promise<Result<DisplayInfo[]>>;
    /** Read the persisted audience-display choice (displayId null = auto). */
    getAudience(): Promise<Result<AudienceSelection>>;
    /** Choose the audience display (null = auto); persists + re-places live. */
    setAudience(displayId: number | null): Promise<Result<AudienceSelection>>;
  };
  present: {
    /** Replace the live deck (and optionally the start index + transition). */
    setDeck(deck: PresentSlide[], index?: number, transition?: Transition): Promise<Result<void>>;
    next(): Promise<Result<void>>;
    prev(): Promise<Result<void>>;
    goto(index: number): Promise<Result<void>>;
    black(): Promise<Result<void>>;
    blank(): Promise<Result<void>>;
    clear(): Promise<Result<void>>;
    /** Read current live state (for a view mounting mid-service). */
    getState(): Promise<Result<PresentState>>;
    /** Subscribe to live-state pushes; returns an unsubscribe function. */
    onState(callback: (state: PresentState) => void): () => void;
  };
  songs: {
    list(): Promise<Result<SongSummary[]>>;
    get(id: number): Promise<Result<Song | null>>;
    create(input: SongCreate): Promise<Result<number>>;
    update(input: Song): Promise<Result<void>>;
    delete(id: number): Promise<Result<void>>;
    importText(input: SongImportText): Promise<Result<number>>;
  };
  plans: {
    list(): Promise<Result<PlanSummary[]>>;
    get(id: number): Promise<Result<Plan | null>>;
    create(input: PlanCreate): Promise<Result<number>>;
    update(input: Plan): Promise<Result<void>>;
    delete(id: number): Promise<Result<void>>;
    estimate(id: number): Promise<Result<number>>;
  };
  scripture: {
    listTranslations(): Promise<Result<BibleTranslation[]>>;
    listBooks(): Promise<Result<BibleBook[]>>;
    /** Verses of a whole chapter (book → chapter → verses) for the browser. */
    getChapter(bookNumber: number, chapter: number): Promise<Result<BibleVerse[]>>;
    /** Resolve a free-text reference ("John 3:16", "Gen 1:1-3") to its verses. */
    lookupReference(query: string): Promise<Result<BibleVerse[]>>;
    searchKeyword(query: string, limit?: number): Promise<Result<BibleSearchResult[]>>;
  };
  media: {
    /** All library items (newest first). */
    list(): Promise<Result<MediaItem[]>>;
    /** Open the OS file picker (main) and register the chosen files. */
    import(): Promise<Result<MediaItem[]>>;
    /** Register already-known paths (picker/drag-drop); returns the library. */
    add(paths: string[]): Promise<Result<MediaItem[]>>;
    /** Remove a library item (does not delete the original file). */
    remove(id: number): Promise<Result<MediaItem[]>>;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
