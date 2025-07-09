import { LiveDisplayStatus, LiveDisplayResult } from '../shared/liveDisplayUtils';
import { DisplayInfo } from '../services/DisplayManager';

export interface DisplaySettings {
  selectedLiveDisplayId: number | null;
  isLiveDisplayActive: boolean;
  liveDisplayFullscreen: boolean;
  liveDisplayAlwaysOnTop: boolean;
  testMode: boolean;
}

declare global {
  interface Window {
    electron: {
      displayManager: {
        getDisplays: () => Promise<{
          displays: DisplayInfo[];
          primaryDisplay: DisplayInfo | null;
          secondaryDisplay: DisplayInfo | null;
        }>;
        captureDisplay: (displayId: number) => Promise<string>;
        testDisplay: (displayId: number) => Promise<{ success: boolean }>;
        saveSettings: (settings: any) => Promise<DisplaySettings>;
        getSettings: () => Promise<DisplaySettings>;
        syncState: (reduxState: any) => Promise<{
          selectedLiveDisplayId: number | null;
          isLiveDisplayActive: boolean;
          liveDisplayStatus: LiveDisplayStatus;
        }>;
        initializeLiveDisplay: (displayId: number) => Promise<LiveDisplayResult>;
      };
      liveDisplay: {
        create: (config: { displayId: number }) => Promise<LiveDisplayResult>;
        show: () => Promise<{ success: boolean }>;
        hide: () => Promise<{ success: boolean }>;
        close: () => Promise<{ success: boolean }>;
        getStatus: () => Promise<LiveDisplayStatus>;
        sendContent: (content: any) => Promise<{ success: boolean }>;
        clearContent: () => Promise<{ success: boolean }>;
        showBlack: () => Promise<{ success: boolean }>;
        showLogo: () => Promise<{ success: boolean }>;
      };
    };
  }
} 