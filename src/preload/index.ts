import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@/shared/constants/channels';
import type { Api } from './api';
import type { PresentState } from '@/shared/schemas/present';
import type { AiCandidate, TranscriptSegment } from '@/shared/schemas/ai';

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
  present: {
    setDeck: (deck, index, transition) =>
      ipcRenderer.invoke(CHANNELS.present.setDeck, { deck, index, transition }),
    next: () => ipcRenderer.invoke(CHANNELS.present.next),
    prev: () => ipcRenderer.invoke(CHANNELS.present.prev),
    goto: (index) => ipcRenderer.invoke(CHANNELS.present.goto, { index }),
    black: () => ipcRenderer.invoke(CHANNELS.present.black),
    blank: () => ipcRenderer.invoke(CHANNELS.present.blank),
    clear: () => ipcRenderer.invoke(CHANNELS.present.clear),
    getState: () => ipcRenderer.invoke(CHANNELS.present.getState),
    onState: (callback) => {
      const listener = (_event: unknown, state: PresentState) => callback(state);
      ipcRenderer.on(CHANNELS.present.state, listener);
      return () => ipcRenderer.removeListener(CHANNELS.present.state, listener);
    },
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
    downloadModel: (agentId) => ipcRenderer.invoke(CHANNELS.ai.downloadModel, { agentId }),
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
