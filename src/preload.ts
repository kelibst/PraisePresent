// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Export empty object to make this a module
export {};

// Add window interface extension
declare global {
  interface Window {
    // No modifiers on electronAPI
    electronAPI: {
      minimize: () => void;
      maximize: () => void;
      unmaximize: () => void;
      close: () => void;
      onMaximized: (callback: () => void) => void;
      onUnmaximized: (callback: () => void) => void;
      offMaximized: (callback: () => void) => void;
      offUnmaximized: (callback: () => void) => void;
      onThemeUpdate: (callback: (event: Electron.IpcRendererEvent, theme: string) => void) => void;
      setTheme: (theme: string) => void;
      getSystemTheme: () => Promise<string>;
      database: {
        getBibles: () => Promise<any[]>;
        getScripture: (bibleId: string, book: number, chapter: number, fromVerse: number, toVerse: number) => Promise<any>;
      }
    };
  }
}

// Expose protected APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  unmaximize: () => ipcRenderer.send('window-unmaximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Window state events
  onMaximized: (callback) => ipcRenderer.on('window-is-maximized', callback),
  onUnmaximized: (callback) => ipcRenderer.on('window-is-unmaximized', callback),
  offMaximized: (callback) => ipcRenderer.removeListener('window-is-maximized', callback),
  offUnmaximized: (callback) => ipcRenderer.removeListener('window-is-unmaximized', callback),
  
  // Theme handling
  onThemeUpdate: (callback) => ipcRenderer.on('theme-update', callback),
  setTheme: (theme) => ipcRenderer.send('theme-set', theme),
  getSystemTheme: () => ipcRenderer.invoke('theme-get'),
  
  // Database APIs
  database: {
    getBibles: () => ipcRenderer.invoke('db:get-bibles'),
    getScripture: (bibleId, book, chapter, fromVerse, toVerse) =>
      ipcRenderer.invoke('db:get-scripture', bibleId, book, chapter, fromVerse, toVerse),
  }
});
