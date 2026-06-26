import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@/shared/constants/channels';
import type { Api } from './api';
import type { PresentState } from '@/shared/schemas/present';

// Minimal typed bridge — NO business logic (CLAUDE.md §5.2). Each method just
// forwards to a zod-validated main-process handler over a FIXED channel.
const api: Api = {
  settings: {
    get: (key) => ipcRenderer.invoke(CHANNELS.settings.get, { key }),
    set: (key, value) => ipcRenderer.invoke(CHANNELS.settings.set, { key, value }),
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
  scripture: {
    listTranslations: () => ipcRenderer.invoke(CHANNELS.scripture.listTranslations),
    listBooks: () => ipcRenderer.invoke(CHANNELS.scripture.listBooks),
    lookupReference: (query) => ipcRenderer.invoke(CHANNELS.scripture.lookupReference, { query }),
    searchKeyword: (query, limit) =>
      ipcRenderer.invoke(CHANNELS.scripture.searchKeyword, { query, limit }),
  },
};

contextBridge.exposeInMainWorld('api', api);
