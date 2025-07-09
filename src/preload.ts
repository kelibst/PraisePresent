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
  },
});
