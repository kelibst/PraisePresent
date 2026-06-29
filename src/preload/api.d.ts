import type { Result } from '@/shared/types/result';
import type {
  PresentState,
  PresentSlide,
  Transition,
  SlideBackground,
} from '@/shared/schemas/present';
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
import type {
  AiCandidate,
  AiKeyStatus,
  AiModelStatus,
  AiStatus,
  AudioSource,
  AutoProjectConfig,
  DetectionMode,
  TranscriptionAgent,
  TranscriptSegment,
} from '@/shared/schemas/ai';
import type { SearchResults } from '@/shared/schemas/search';

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
    /**
     * Set (or clear, with `background: null`) a slide's background on the live
     * deck. `index` omitted → the current slide; `applyToAll` sets every slide.
     * Main re-validates the color/url and clamps the index (§5.7).
     */
    setBackground(
      background: SlideBackground | null,
      index?: number,
      applyToAll?: boolean,
    ): Promise<Result<void>>;
    /**
     * Replace a slide's text `lines` on the live deck. `index` omitted → the
     * current slide. Main bounds + clamps and REJECTS edits to a `locked`
     * (scripture) slide — the renderer is never trusted to honor the lock (§5.3).
     */
    updateText(lines: string[], index?: number): Promise<Result<void>>;
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
  search: {
    /** Fan one query over scripture/songs/media; returns grouped, capped results. */
    query(query: string, limit?: number): Promise<Result<SearchResults>>;
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
  ai: {
    /** Detect + resolve scripture references in free text (typed/pasted). */
    submitText(text: string): Promise<Result<AiCandidate[]>>;
    /** The built-in transcription agents (offline-local + online-cloud). */
    listAgents(): Promise<Result<TranscriptionAgent[]>>;
    /**
     * Push renderer-enumerated audio device labels (from `navigator.mediaDevices`)
     * to main and get back the merged source list (always includes the default).
     */
    listSources(sources: AudioSource[]): Promise<Result<AudioSource[]>>;
    /** Choose the active audio input source. Returns the new status. */
    setSource(sourceId: string): Promise<Result<AiStatus>>;
    /** Read a local engine's model-download-manager status (R6 stub today). */
    modelStatus(agentId: string): Promise<Result<AiModelStatus>>;
    /** Trigger a local model download — a no-op stub in this build (R6). */
    downloadModel(agentId: string): Promise<Result<AiModelStatus>>;
    /** Current orchestrator status (enabled/mode/listening/agent/online). */
    status(): Promise<Result<AiStatus>>;
    /** Set the detection mode (passive | drive). Returns the new status. */
    setMode(mode: DetectionMode): Promise<Result<AiStatus>>;
    /** Hard kill-switch: false forces listening off. Returns the new status. */
    setEnabled(enabled: boolean): Promise<Result<AiStatus>>;
    /** Choose the active transcription agent. Returns the new status. */
    setAgent(agentId: string): Promise<Result<AiStatus>>;
    /** Cloud opt-in (online mode). Returns the new status. */
    setOnline(online: boolean): Promise<Result<AiStatus>>;
    /** Configure the off-by-default auto-project guard. Returns the new status. */
    setAutoProject(config: AutoProjectConfig): Promise<Result<AiStatus>>;
    /** Suppress detection but keep showing the transcript. Returns the new status. */
    setTranscriptOnly(transcriptOnly: boolean): Promise<Result<AiStatus>>;
    /** Begin listening (stub in A1 — no-ops when the agent is unavailable). */
    startListening(): Promise<Result<AiStatus>>;
    /** Stop listening. Returns the new status. */
    stopListening(): Promise<Result<AiStatus>>;
    /** Store a cloud agent's API key in OS secure storage (value never returns). */
    setApiKey(agentId: string, apiKey: string): Promise<Result<AiKeyStatus>>;
    /** Whether a key is stored for an agent — a boolean only, never the value. */
    hasKey(agentId: string): Promise<Result<AiKeyStatus>>;
    /** Remove a stored key for an agent. Returns the new (keyless) status. */
    clearApiKey(agentId: string): Promise<Result<AiKeyStatus>>;
    /** Subscribe to pushed candidate batches; returns an unsubscribe function. */
    onCandidates(callback: (candidates: AiCandidate[]) => void): () => void;
    /** Subscribe to pushed transcript segments; returns an unsubscribe function. */
    onTranscript(callback: (segment: TranscriptSegment) => void): () => void;
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
