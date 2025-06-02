// Global type definitions for PraisePresent

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      removeListener: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export {}; // Make this file a module 