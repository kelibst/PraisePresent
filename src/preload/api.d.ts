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

// The typed surface exposed on `window.api` by the preload bridge. The renderer
// imports ONLY this type and calls `window.api` — never electron/ipcRenderer
// (CLAUDE.md §5.2). Every request method returns a typed Result.
export interface Api {
  settings: {
    get(key: string): Promise<Result<string | null>>;
    set(key: string, value: string): Promise<Result<void>>;
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
    /** Resolve a free-text reference ("John 3:16", "Gen 1:1-3") to its verses. */
    lookupReference(query: string): Promise<Result<BibleVerse[]>>;
    searchKeyword(query: string, limit?: number): Promise<Result<BibleSearchResult[]>>;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
