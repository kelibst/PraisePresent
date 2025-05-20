// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Export empty object to make this a module
export {};

// No need to redeclare the Window interface since it's in global.d.ts

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
