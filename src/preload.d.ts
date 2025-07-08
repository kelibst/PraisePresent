import { DisplayInfo } from './services/DisplayManager';

declare global {
  interface Window {
    electronAPI: {
      invoke(channel: 'display:getDisplays'): Promise<DisplayInfo[]>;
      invoke(channel: 'display:getPrimaryDisplay'): Promise<DisplayInfo | null>;
      invoke(channel: 'display:getSecondaryDisplay'): Promise<DisplayInfo | null>;
      invoke(channel: 'display:captureDisplay', displayId: number): Promise<string | null>;
      invoke(channel: 'display:updateSettings', settings: any): Promise<any>;
      on(channel: 'display:changed', callback: Function): void;
      off(channel: 'display:changed', callback: Function): void;
    }
  }
} 