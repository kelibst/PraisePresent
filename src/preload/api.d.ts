import type { Result } from '@/shared/types/result';
import type { PresentState } from '@/shared/schemas/present';
import type { Song, SongCreate, SongImportText, SongSummary } from '@/shared/schemas/song';
import type { Plan, PlanCreate, PlanSummary } from '@/shared/schemas/plan';

// The typed surface exposed on `window.api` by the preload bridge. The renderer
// imports ONLY this type and calls `window.api` — never electron/ipcRenderer
// (CLAUDE.md §5.2). Every request method returns a typed Result.
export interface Api {
  settings: {
    get(key: string): Promise<Result<string | null>>;
    set(key: string, value: string): Promise<Result<void>>;
  };
  present: {
    setState(state: PresentState): Promise<Result<void>>;
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
}

declare global {
  interface Window {
    api: Api;
  }
}
