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
    setState: (state) => ipcRenderer.invoke(CHANNELS.present.setState, state),
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
};

contextBridge.exposeInMainWorld('api', api);
