import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@/shared/constants/channels';
import type { Api } from './api';

// Minimal typed bridge — NO business logic (CLAUDE.md §5.2). Each method just
// forwards to a zod-validated main-process handler and returns its Result.
const api: Api = {
  settings: {
    get: (key) => ipcRenderer.invoke(CHANNELS.settings.get, { key }),
    set: (key, value) => ipcRenderer.invoke(CHANNELS.settings.set, { key, value }),
  },
};

contextBridge.exposeInMainWorld('api', api);
