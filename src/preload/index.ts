import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@/shared/constants/channels';
import type { Api } from './api';
import type {
  PresentState,
  PresentDeckPayload,
  PresentCursorPayload,
} from '@/shared/schemas/present';
import { createPresentReconciler } from '@/shared/present/reconciler';
import type { AiCandidate, AiStatus, TranscriptSegment } from '@/shared/schemas/ai';

// The split present broadcast (B1) arrives on two channels — `present:deck` (rare)
// and `present:cursor` (hot). One reconciler per preload instance (i.e. per window)
// merges them into the single `PresentState` every renderer consumer expects, and
// fans it out to all `onState` subscribers. This is pure transport glue, not
// business logic — it does no DB/network/validation (§5.2).
function createPresentStateBridge() {
  const reconciler = createPresentReconciler();
  const subscribers = new Set<(state: PresentState) => void>();

  const emit = (state: PresentState | null) => {
    if (!state) return;
    for (const cb of subscribers) cb(state);
  };

  ipcRenderer.on(CHANNELS.present.deck, (_event, payload: PresentDeckPayload) =>
    emit(reconciler.applyDeck(payload)),
  );
  ipcRenderer.on(CHANNELS.present.cursor, (_event, payload: PresentCursorPayload) =>
    emit(reconciler.applyCursor(payload)),
  );

  return (callback: (state: PresentState) => void): (() => void) => {
    subscribers.add(callback);
    // Seed the new subscriber immediately. If a deck has already arrived, use it;
    // otherwise pull current state from main once (covers a consumer that mounts
    // after the initial load push — §5.4) without waiting for the next action.
    const current = reconciler.current();
    if (current) {
      callback(current);
    } else {
      void ipcRenderer.invoke(CHANNELS.present.getState).then((res) => {
        if (res?.ok && !reconciler.current()) callback(reconciler.seed(res.data));
      });
    }
    return () => subscribers.delete(callback);
  };
}

const onPresentState = createPresentStateBridge();

// Minimal typed bridge — NO business logic (CLAUDE.md §5.2). Each method just
// forwards to a zod-validated main-process handler over a FIXED channel.
const api: Api = {
  settings: {
    get: (key) => ipcRenderer.invoke(CHANNELS.settings.get, { key }),
    set: (key, value) => ipcRenderer.invoke(CHANNELS.settings.set, { key, value }),
  },
  display: {
    list: () => ipcRenderer.invoke(CHANNELS.display.list),
    getAudience: () => ipcRenderer.invoke(CHANNELS.display.getAudience),
    setAudience: (displayId) => ipcRenderer.invoke(CHANNELS.display.setAudience, { displayId }),
  },
  capability: {
    get: () => ipcRenderer.invoke(CHANNELS.capability.get),
    setOverride: (override) => ipcRenderer.invoke(CHANNELS.capability.setOverride, { override }),
  },
  present: {
    setDeck: (deck, index, transition) =>
      ipcRenderer.invoke(CHANNELS.present.setDeck, { deck, index, transition }),
    next: () => ipcRenderer.invoke(CHANNELS.present.next),
    prev: () => ipcRenderer.invoke(CHANNELS.present.prev),
    goto: (index) => ipcRenderer.invoke(CHANNELS.present.goto, { index }),
    setBackground: (background, index, applyToAll) =>
      ipcRenderer.invoke(CHANNELS.present.setBackground, { background, index, applyToAll }),
    setDefaultBackground: (background) =>
      ipcRenderer.invoke(CHANNELS.present.setDefaultBackground, { background }),
    updateText: (lines, index) => ipcRenderer.invoke(CHANNELS.present.updateText, { lines, index }),
    setTransition: (transition) =>
      ipcRenderer.invoke(CHANNELS.present.setTransition, { transition }),
    black: () => ipcRenderer.invoke(CHANNELS.present.black),
    blank: () => ipcRenderer.invoke(CHANNELS.present.blank),
    clear: () => ipcRenderer.invoke(CHANNELS.present.clear),
    getState: () => ipcRenderer.invoke(CHANNELS.present.getState),
    // Merged deck+cursor pushes, re-exposed as the unified PresentState stream.
    onState: (callback) => onPresentState(callback),
  },
  songs: {
    list: () => ipcRenderer.invoke(CHANNELS.songs.list),
    get: (id) => ipcRenderer.invoke(CHANNELS.songs.get, { id }),
    create: (input) => ipcRenderer.invoke(CHANNELS.songs.create, input),
    update: (input) => ipcRenderer.invoke(CHANNELS.songs.update, input),
    delete: (id) => ipcRenderer.invoke(CHANNELS.songs.delete, { id }),
    importText: (input) => ipcRenderer.invoke(CHANNELS.songs.importText, input),
  },
  plans: {
    list: () => ipcRenderer.invoke(CHANNELS.plans.list),
    get: (id) => ipcRenderer.invoke(CHANNELS.plans.get, { id }),
    create: (input) => ipcRenderer.invoke(CHANNELS.plans.create, input),
    update: (input) => ipcRenderer.invoke(CHANNELS.plans.update, input),
    delete: (id) => ipcRenderer.invoke(CHANNELS.plans.delete, { id }),
    estimate: (id) => ipcRenderer.invoke(CHANNELS.plans.estimate, { id }),
  },
  ai: {
    submitText: (text) => ipcRenderer.invoke(CHANNELS.ai.submitText, { text }),
    listAgents: () => ipcRenderer.invoke(CHANNELS.ai.listAgents),
    listSources: (sources) => ipcRenderer.invoke(CHANNELS.ai.listSources, { sources }),
    setSource: (sourceId) => ipcRenderer.invoke(CHANNELS.ai.setSource, { sourceId }),
    modelStatus: (agentId) => ipcRenderer.invoke(CHANNELS.ai.modelStatus, { agentId }),
    downloadModel: (agentId, modelId) =>
      ipcRenderer.invoke(CHANNELS.ai.downloadModel, { agentId, modelId }),
    listModels: () => ipcRenderer.invoke(CHANNELS.ai.listModels),
    setPreferredModel: (modelId) =>
      ipcRenderer.invoke(CHANNELS.ai.setPreferredModel, { modelId }),
    deleteModel: (modelId) => ipcRenderer.invoke(CHANNELS.ai.deleteModel, { modelId }),
    status: () => ipcRenderer.invoke(CHANNELS.ai.status),
    setMode: (mode) => ipcRenderer.invoke(CHANNELS.ai.setMode, { mode }),
    setEnabled: (enabled) => ipcRenderer.invoke(CHANNELS.ai.setEnabled, { enabled }),
    setAgent: (agentId) => ipcRenderer.invoke(CHANNELS.ai.setAgent, { agentId }),
    setOnline: (online) => ipcRenderer.invoke(CHANNELS.ai.setOnline, { online }),
    setAutoProject: (config) => ipcRenderer.invoke(CHANNELS.ai.setAutoProject, config),
    setTranscriptOnly: (transcriptOnly) =>
      ipcRenderer.invoke(CHANNELS.ai.setTranscriptOnly, { transcriptOnly }),
    startListening: () => ipcRenderer.invoke(CHANNELS.ai.startListening),
    stopListening: () => ipcRenderer.invoke(CHANNELS.ai.stopListening),
    // Fire-and-forget PCM stream (renderer → main) — NOT an invoke. Each frame is
    // 16 kHz mono 16-bit PCM the renderer captured; main routes it to the active
    // ASR session. No business logic here — just transport (§5.2).
    sendAudioFrame: (pcm, sampleRate) =>
      ipcRenderer.send(CHANNELS.ai.audioFrame, { pcm, sampleRate }),
    setApiKey: (agentId, apiKey) => ipcRenderer.invoke(CHANNELS.ai.setApiKey, { agentId, apiKey }),
    hasKey: (agentId) => ipcRenderer.invoke(CHANNELS.ai.hasKey, { agentId }),
    clearApiKey: (agentId) => ipcRenderer.invoke(CHANNELS.ai.clearApiKey, { agentId }),
    onCandidates: (callback) => {
      const listener = (_event: unknown, candidates: AiCandidate[]) => callback(candidates);
      ipcRenderer.on(CHANNELS.ai.candidates, listener);
      return () => ipcRenderer.removeListener(CHANNELS.ai.candidates, listener);
    },
    onTranscript: (callback) => {
      const listener = (_event: unknown, segment: TranscriptSegment) => callback(segment);
      ipcRenderer.on(CHANNELS.ai.transcript, listener);
      return () => ipcRenderer.removeListener(CHANNELS.ai.transcript, listener);
    },
    onStatus: (callback) => {
      const listener = (_event: unknown, status: AiStatus) => callback(status);
      ipcRenderer.on(CHANNELS.ai.statusChanged, listener);
      return () => ipcRenderer.removeListener(CHANNELS.ai.statusChanged, listener);
    },
  },
  media: {
    list: () => ipcRenderer.invoke(CHANNELS.media.list),
    import: () => ipcRenderer.invoke(CHANNELS.media.import),
    add: (paths) => ipcRenderer.invoke(CHANNELS.media.add, { paths }),
    remove: (id) => ipcRenderer.invoke(CHANNELS.media.remove, { id }),
  },
  search: {
    query: (query, limit) => ipcRenderer.invoke(CHANNELS.search.query, { query, limit }),
  },
  scripture: {
    listTranslations: () => ipcRenderer.invoke(CHANNELS.scripture.listTranslations),
    listBooks: () => ipcRenderer.invoke(CHANNELS.scripture.listBooks),
    getChapter: (bookNumber, chapter) =>
      ipcRenderer.invoke(CHANNELS.scripture.getChapter, { bookNumber, chapter }),
    lookupReference: (query) => ipcRenderer.invoke(CHANNELS.scripture.lookupReference, { query }),
    searchKeyword: (query, limit) =>
      ipcRenderer.invoke(CHANNELS.scripture.searchKeyword, { query, limit }),
  },
};

contextBridge.exposeInMainWorld('api', api);
