import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  displayManager: {
    getDisplays: () => ipcRenderer.invoke('display:getDisplays'),
    captureDisplay: (displayId: number) => ipcRenderer.invoke('display:captureDisplay', displayId),
    testDisplay: (displayId: number) => ipcRenderer.invoke('display:testDisplay', displayId),
    saveSettings: (settings: any) => ipcRenderer.invoke('display:saveSettings', settings),
    getSettings: () => ipcRenderer.invoke('display:getSettings'),
    syncState: (reduxState: any) => ipcRenderer.invoke('display:syncState', reduxState),
    initializeLiveDisplay: (displayId: number) => ipcRenderer.invoke('display:initializeLiveDisplay', displayId),
  },
  liveDisplay: {
    create: (config: { displayId: number }) => ipcRenderer.invoke('live-display:create', config),
    show: () => ipcRenderer.invoke('live-display:show'),
    hide: () => ipcRenderer.invoke('live-display:hide'),
    close: () => ipcRenderer.invoke('live-display:close'),
    getStatus: () => ipcRenderer.invoke('live-display:getStatus'),
    sendContent: (content: any) => ipcRenderer.invoke('live-display:sendContent', content),
    clearContent: () => ipcRenderer.invoke('live-display:clearContent'),
    showBlack: () => ipcRenderer.invoke('live-display:showBlack'),
    showLogo: () => ipcRenderer.invoke('live-display:showLogo'),
    // Event listeners for live display content
    onContentUpdate: (callback: (content: any) => void) => {
      ipcRenderer.on('live-content-update', (_, content) => callback(content));
      return () => ipcRenderer.removeAllListeners('live-content-update');
    },
    onContentClear: (callback: () => void) => {
      ipcRenderer.on('live-content-clear', () => callback());
      return () => ipcRenderer.removeAllListeners('live-content-clear');
    },
    onShowBlack: (callback: () => void) => {
      ipcRenderer.on('live-show-black', () => callback());
      return () => ipcRenderer.removeAllListeners('live-show-black');
    },
    onShowLogo: (callback: () => void) => {
      ipcRenderer.on('live-show-logo', () => callback());
      return () => ipcRenderer.removeAllListeners('live-show-logo');
    },
    onThemeUpdate: (callback: (theme: any) => void) => {
      ipcRenderer.on('live-theme-update', (_, theme) => callback(theme));
      return () => ipcRenderer.removeAllListeners('live-theme-update');
    },
  },
  notes: {
    create: (request: any) => ipcRenderer.invoke('notes:create', request),
    list: (options?: any) => ipcRenderer.invoke('notes:list', options),
    getById: (id: string) => ipcRenderer.invoke('notes:getById', id),
    update: (request: any) => ipcRenderer.invoke('notes:update', request),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id),
    search: (query: string) => ipcRenderer.invoke('notes:search', query),
    getCategories: () => ipcRenderer.invoke('notes:getCategories'),
    getTags: () => ipcRenderer.invoke('notes:getTags'),
  },
});
