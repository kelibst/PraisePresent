export {}; // This file needs to be a module

// Define the global window object
declare global {
  interface Window {
    electronAPI: {
      // Window controls
      minimize: () => void;
      maximize: () => void;
      unmaximize: () => void;
      close: () => void;
      
      // Window state events
      onMaximized: (callback: () => void) => Electron.IpcRenderer;
      onUnmaximized: (callback: () => void) => Electron.IpcRenderer;
      offMaximized: (callback: () => void) => void;
      offUnmaximized: (callback: () => void) => void;
      
      // Theme handling
      onThemeUpdate: (callback: (event: any, theme: string) => void) => Electron.IpcRenderer;
      setTheme: (theme: string) => void;
      getSystemTheme: () => Promise<string>;
      
      // Database APIs
      database: {
        getBibles: () => Promise<any[]>;
        getScripture: (bibleId: string, book: number, chapter: number, fromVerse: number, toVerse: number) => Promise<any>;
      }
    };
  }
} 