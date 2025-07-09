export interface DisplayInfo {
  id: number;
  label: string;
  friendlyName: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isPrimary: boolean;
  internal: boolean;
  rotation: number;
  scaleFactor: number;
}

export interface LiveDisplayStatus {
  hasWindow: boolean;
  isVisible: boolean;
  currentDisplayId: number | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  isFullscreen: boolean;
}

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
        initializeLiveDisplay: (displayId: number) => Promise<{
          success: boolean;
          displayId?: number;
          settings?: DisplaySettings;
          error?: string;
        }>;
      };
      liveDisplay: {
        create: (config: { displayId: number }) => Promise<{ success: boolean; displayId: number }>;
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