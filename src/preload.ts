// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  unmaximize: () => ipcRenderer.send('window-unmaximize'),
  close: () => ipcRenderer.send('window-close'),
  onMaximized: (callback: () => void) => ipcRenderer.on('window-is-maximized', callback),
  onUnmaximized: (callback: () => void) => ipcRenderer.on('window-is-unmaximized', callback),
  offMaximized: (callback: () => void) => ipcRenderer.removeListener('window-is-maximized', callback),
  offUnmaximized: (callback: () => void) => ipcRenderer.removeListener('window-is-unmaximized', callback),
  
  // Add theme handling
  onThemeUpdate: (callback: (event: Electron.IpcRendererEvent, theme: string) => void) => 
    ipcRenderer.on('theme-update', callback),
  setTheme: (theme: string) => ipcRenderer.send('theme-set', theme),
  getSystemTheme: () => ipcRenderer.invoke('theme-get'),
});
