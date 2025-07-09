import { LiveDisplayStatus, LiveDisplayResult } from '../shared/liveDisplayUtils';
import { DisplayInfo } from '../services/DisplayManager';
import { CreateNoteRequest, UpdateNoteRequest, NotesListOptions, Note } from '../main/notes-main';

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
        // Event listeners
        onContentUpdate: (callback: (content: any) => void) => () => void;
        onContentClear: (callback: () => void) => () => void;
        onShowBlack: (callback: () => void) => () => void;
        onShowLogo: (callback: () => void) => () => void;
        onThemeUpdate: (callback: (theme: any) => void) => () => void;
      };
      notes: {
        create: (request: CreateNoteRequest) => Promise<{ success: boolean; note?: Note; error?: string }>;
        list: (options?: NotesListOptions) => Promise<{ success: boolean; notes?: Note[]; error?: string }>;
        getById: (id: string) => Promise<{ success: boolean; note?: Note; error?: string }>;
        update: (request: UpdateNoteRequest) => Promise<{ success: boolean; note?: Note; error?: string }>;
        delete: (id: string) => Promise<{ success: boolean; error?: string }>;
        search: (query: string) => Promise<{ success: boolean; notes?: Note[]; error?: string }>;
        getCategories: () => Promise<{ success: boolean; categories?: string[]; error?: string }>;
        getTags: () => Promise<{ success: boolean; tags?: string[]; error?: string }>;
      };
    };
  }
} 