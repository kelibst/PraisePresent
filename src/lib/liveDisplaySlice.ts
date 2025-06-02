import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  LiveContentItem, 
  LiveDisplayStatus, 
  LiveDisplayMode, 
  ContentTransition, 
  LiveContentQueue,
  LiveDisplayError,
  TransitionAnimation
} from '../types/LiveContent';

// State interface
export interface LiveDisplayState {
  // Current content and display state
  currentLiveContent: LiveContentItem | null;
  isLiveActive: boolean;
  displayMode: LiveDisplayMode;
  
  // Display connection and status
  status: LiveDisplayStatus;
  isConnected: boolean;
  lastHeartbeat: number | null;
  
  // Content queue for service management
  contentQueue: LiveContentQueue;
  
  // Transition settings
  transitions: ContentTransition;
  
  // Error handling
  errors: LiveDisplayError[];
  lastError: LiveDisplayError | null;
  
  // Loading states
  isLoading: boolean;
  isTransitioning: boolean;
  
  // Performance tracking
  lastContentUpdate: number | null;
  contentHistory: LiveContentItem[];
  maxHistorySize: number;
}

// Default transition settings
const defaultTransition: TransitionAnimation = {
  type: 'fade',
  duration: 500,
  easing: 'ease-in-out'
};

// Initial state
const initialState: LiveDisplayState = {
  currentLiveContent: null,
  isLiveActive: false,
  displayMode: {
    mode: 'presentation',
    isActive: false,
    lastUpdated: Date.now()
  },
  status: {
    isConnected: false,
    displayId: null,
    currentContent: null,
    mode: {
      mode: 'presentation',
      isActive: false,
      lastUpdated: Date.now()
    },
    windowStatus: {
      isVisible: false,
      isFullscreen: false
    }
  },
  isConnected: false,
  lastHeartbeat: null,
  contentQueue: {
    items: [],
    currentIndex: -1,
    autoAdvance: false,
    autoAdvanceDelay: 5000
  },
  transitions: {
    enabled: true,
    defaultTransition,
    scriptureTransition: { ...defaultTransition, duration: 800 },
    songTransition: { ...defaultTransition, type: 'slide', direction: 'up' },
    announcementTransition: { ...defaultTransition, type: 'zoom', duration: 600 },
    mediaTransition: { ...defaultTransition, duration: 300 }
  },
  errors: [],
  lastError: null,
  isLoading: false,
  isTransitioning: false,
  lastContentUpdate: null,
  contentHistory: [],
  maxHistorySize: 50
};

// Async thunks for live display operations
export const initializeLiveDisplay = createAsyncThunk(
  'liveDisplay/initialize',
  async (displayId: number) => {
    // IPC call to initialize live display window
    const result = await window.electronAPI?.invoke('live-display:create', displayId);
    return result;
  }
);

export const sendContentToLive = createAsyncThunk(
  'liveDisplay/sendContent',
  async (content: LiveContentItem) => {
    // IPC call to send content to live display
    const result = await window.electronAPI?.invoke('live-display:sendContent', content);
    return { content, result };
  }
);

export const clearLiveDisplay = createAsyncThunk(
  'liveDisplay/clear',
  async () => {
    // IPC call to clear live display
    const result = await window.electronAPI?.invoke('live-display:clearContent');
    return result;
  }
);

export const showBlackScreen = createAsyncThunk(
  'liveDisplay/showBlack',
  async () => {
    // IPC call to show black screen
    const result = await window.electronAPI?.invoke('live-display:showBlack');
    return result;
  }
);

export const showLogoScreen = createAsyncThunk(
  'liveDisplay/showLogo',
  async () => {
    // IPC call to show logo screen
    const result = await window.electronAPI?.invoke('live-display:showLogo');
    return result;
  }
);

export const getLiveDisplayStatus = createAsyncThunk(
  'liveDisplay/getStatus',
  async () => {
    // IPC call to get live display status
    const status = await window.electronAPI?.invoke('live-display:getStatus');
    return status;
  }
);

// Live display slice
const liveDisplaySlice = createSlice({
  name: 'liveDisplay',
  initialState,
  reducers: {
    // Content management
    setLiveContent: (state, action: PayloadAction<LiveContentItem>) => {
      const content = action.payload;
      state.currentLiveContent = content;
      state.lastContentUpdate = Date.now();
      state.displayMode.content = content;
      state.displayMode.lastUpdated = Date.now();
      
      // Add to history
      state.contentHistory.unshift(content);
      if (state.contentHistory.length > state.maxHistorySize) {
        state.contentHistory = state.contentHistory.slice(0, state.maxHistorySize);
      }
    },

    clearLiveContent: (state) => {
      state.currentLiveContent = null;
      state.displayMode.content = undefined;
      state.displayMode.lastUpdated = Date.now();
    },

    // Display mode management
    setDisplayMode: (state, action: PayloadAction<LiveDisplayMode['mode']>) => {
      state.displayMode.mode = action.payload;
      state.displayMode.lastUpdated = Date.now();
    },

    toggleLiveDisplay: (state) => {
      state.isLiveActive = !state.isLiveActive;
      state.displayMode.isActive = state.isLiveActive;
      state.displayMode.lastUpdated = Date.now();
    },

    setLiveActive: (state, action: PayloadAction<boolean>) => {
      state.isLiveActive = action.payload;
      state.displayMode.isActive = action.payload;
      state.displayMode.lastUpdated = Date.now();
    },

    // Connection and status management
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      state.status.isConnected = action.payload;
      if (!action.payload) {
        state.lastHeartbeat = null;
      }
    },

    updateDisplayStatus: (state, action: PayloadAction<Partial<LiveDisplayStatus>>) => {
      state.status = { ...state.status, ...action.payload };
    },

    setHeartbeat: (state) => {
      state.lastHeartbeat = Date.now();
    },

    // Content queue management
    addToQueue: (state, action: PayloadAction<LiveContentItem>) => {
      state.contentQueue.items.push(action.payload);
    },

    removeFromQueue: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      state.contentQueue.items = state.contentQueue.items.filter(item => item.id !== itemId);
      // Adjust current index if necessary
      if (state.contentQueue.currentIndex >= state.contentQueue.items.length) {
        state.contentQueue.currentIndex = Math.max(0, state.contentQueue.items.length - 1);
      }
    },

    moveInQueue: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      const items = [...state.contentQueue.items];
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      state.contentQueue.items = items;
    },

    setCurrentQueueIndex: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.contentQueue.items.length) {
        state.contentQueue.currentIndex = index;
      }
    },

    nextInQueue: (state) => {
      if (state.contentQueue.currentIndex < state.contentQueue.items.length - 1) {
        state.contentQueue.currentIndex += 1;
      }
    },

    previousInQueue: (state) => {
      if (state.contentQueue.currentIndex > 0) {
        state.contentQueue.currentIndex -= 1;
      }
    },

    clearQueue: (state) => {
      state.contentQueue.items = [];
      state.contentQueue.currentIndex = -1;
    },

    setAutoAdvance: (state, action: PayloadAction<boolean>) => {
      state.contentQueue.autoAdvance = action.payload;
    },

    setAutoAdvanceDelay: (state, action: PayloadAction<number>) => {
      state.contentQueue.autoAdvanceDelay = action.payload;
    },

    // Transition settings
    updateTransitionSettings: (state, action: PayloadAction<Partial<ContentTransition>>) => {
      state.transitions = { ...state.transitions, ...action.payload };
    },

    setDefaultTransition: (state, action: PayloadAction<TransitionAnimation>) => {
      state.transitions.defaultTransition = action.payload;
    },

    setContentTypeTransition: (state, action: PayloadAction<{ 
      contentType: keyof Omit<ContentTransition, 'enabled' | 'defaultTransition'>; 
      transition: TransitionAnimation 
    }>) => {
      const { contentType, transition } = action.payload;
      state.transitions[contentType] = transition;
    },

    // Error handling
    addError: (state, action: PayloadAction<Omit<LiveDisplayError, 'timestamp'>>) => {
      const error: LiveDisplayError = {
        ...action.payload,
        timestamp: Date.now()
      };
      state.errors.unshift(error);
      state.lastError = error;
      
      // Keep only last 20 errors
      if (state.errors.length > 20) {
        state.errors = state.errors.slice(0, 20);
      }
    },

    clearErrors: (state) => {
      state.errors = [];
      state.lastError = null;
    },

    clearLastError: (state) => {
      state.lastError = null;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setTransitioning: (state, action: PayloadAction<boolean>) => {
      state.isTransitioning = action.payload;
    },

    // History management
    clearHistory: (state) => {
      state.contentHistory = [];
    },

    setMaxHistorySize: (state, action: PayloadAction<number>) => {
      state.maxHistorySize = action.payload;
      if (state.contentHistory.length > action.payload) {
        state.contentHistory = state.contentHistory.slice(0, action.payload);
      }
    },

    // Quick actions for common operations
    sendScriptureToLive: (state, action: PayloadAction<{
      reference: string;
      text: string;
      translation: string;
      book: string;
      chapter: number;
      verse: number;
    }>) => {
      const { reference, text, translation, book, chapter, verse } = action.payload;
      const scriptureContent: LiveContentItem = {
        id: `scripture-${Date.now()}`,
        type: 'scripture',
        timestamp: Date.now(),
        reference,
        text,
        translation,
        book,
        chapter,
        verse
      };
      
      state.currentLiveContent = scriptureContent;
      state.lastContentUpdate = Date.now();
      state.displayMode.content = scriptureContent;
      state.displayMode.lastUpdated = Date.now();
      
      // Add to history
      state.contentHistory.unshift(scriptureContent);
      if (state.contentHistory.length > state.maxHistorySize) {
        state.contentHistory = state.contentHistory.slice(0, state.maxHistorySize);
      }
    },

    sendSlideToLive: (state, action: PayloadAction<{
      title: string;
      content: string;
      subtitle?: string;
    }>) => {
      const { title, content, subtitle } = action.payload;
      const slideContent: LiveContentItem = {
        id: `slide-${Date.now()}`,
        type: 'slide',
        timestamp: Date.now(),
        title,
        content,
        subtitle
      };
      
      state.currentLiveContent = slideContent;
      state.lastContentUpdate = Date.now();
      state.displayMode.content = slideContent;
      state.displayMode.lastUpdated = Date.now();
      
      // Add to history
      state.contentHistory.unshift(slideContent);
      if (state.contentHistory.length > state.maxHistorySize) {
        state.contentHistory = state.contentHistory.slice(0, state.maxHistorySize);
      }
    }
  },

  extraReducers: (builder) => {
    // Initialize live display
    builder
      .addCase(initializeLiveDisplay.pending, (state) => {
        state.isLoading = true;
        state.lastError = null;
      })
      .addCase(initializeLiveDisplay.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.success) {
          state.isConnected = true;
          state.status.isConnected = true;
          state.status.displayId = action.meta.arg;
        }
      })
      .addCase(initializeLiveDisplay.rejected, (state, action) => {
        state.isLoading = false;
        const error: LiveDisplayError = {
          code: 'INIT_FAILED',
          message: action.error.message || 'Failed to initialize live display',
          timestamp: Date.now(),
          context: { displayId: action.meta.arg }
        };
        state.errors.unshift(error);
        state.lastError = error;
      });

    // Send content to live
    builder
      .addCase(sendContentToLive.pending, (state) => {
        state.isTransitioning = true;
        state.lastError = null;
      })
      .addCase(sendContentToLive.fulfilled, (state, action) => {
        state.isTransitioning = false;
        if (action.payload?.result?.success) {
          const content = action.payload.content;
          state.currentLiveContent = content;
          state.lastContentUpdate = Date.now();
          state.displayMode.content = content;
          state.displayMode.lastUpdated = Date.now();
          
          // Add to history
          state.contentHistory.unshift(content);
          if (state.contentHistory.length > state.maxHistorySize) {
            state.contentHistory = state.contentHistory.slice(0, state.maxHistorySize);
          }
        }
      })
      .addCase(sendContentToLive.rejected, (state, action) => {
        state.isTransitioning = false;
        const error: LiveDisplayError = {
          code: 'SEND_CONTENT_FAILED',
          message: action.error.message || 'Failed to send content to live display',
          timestamp: Date.now(),
          context: { content: action.meta.arg }
        };
        state.errors.unshift(error);
        state.lastError = error;
      });

    // Clear live display
    builder
      .addCase(clearLiveDisplay.pending, (state) => {
        state.isTransitioning = true;
      })
      .addCase(clearLiveDisplay.fulfilled, (state) => {
        state.isTransitioning = false;
        state.currentLiveContent = null;
        state.displayMode.content = undefined;
        state.displayMode.lastUpdated = Date.now();
      })
      .addCase(clearLiveDisplay.rejected, (state, action) => {
        state.isTransitioning = false;
        const error: LiveDisplayError = {
          code: 'CLEAR_FAILED',
          message: action.error.message || 'Failed to clear live display',
          timestamp: Date.now()
        };
        state.errors.unshift(error);
        state.lastError = error;
      });

    // Show black screen
    builder
      .addCase(showBlackScreen.fulfilled, (state) => {
        state.displayMode.mode = 'black';
        state.displayMode.lastUpdated = Date.now();
      });

    // Show logo screen
    builder
      .addCase(showLogoScreen.fulfilled, (state) => {
        state.displayMode.mode = 'logo';
        state.displayMode.lastUpdated = Date.now();
      });

    // Get status
    builder
      .addCase(getLiveDisplayStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = action.payload;
          state.isConnected = action.payload.isConnected;
          state.lastHeartbeat = Date.now();
        }
      });
  }
});

// Export actions
export const {
  setLiveContent,
  clearLiveContent,
  setDisplayMode,
  toggleLiveDisplay,
  setLiveActive,
  setConnectionStatus,
  updateDisplayStatus,
  setHeartbeat,
  addToQueue,
  removeFromQueue,
  moveInQueue,
  setCurrentQueueIndex,
  nextInQueue,
  previousInQueue,
  clearQueue,
  setAutoAdvance,
  setAutoAdvanceDelay,
  updateTransitionSettings,
  setDefaultTransition,
  setContentTypeTransition,
  addError,
  clearErrors,
  clearLastError,
  setLoading,
  setTransitioning,
  clearHistory,
  setMaxHistorySize,
  sendScriptureToLive,
  sendSlideToLive
} = liveDisplaySlice.actions;

// Export reducer
export default liveDisplaySlice.reducer;

// Selectors
export const selectCurrentLiveContent = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.currentLiveContent;

export const selectIsLiveActive = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.isLiveActive;

export const selectDisplayMode = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.displayMode;

export const selectLiveDisplayStatus = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.status;

export const selectIsConnected = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.isConnected;

export const selectContentQueue = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.contentQueue;

export const selectCurrentQueueItem = (state: { liveDisplay: LiveDisplayState }) => {
  const { items, currentIndex } = state.liveDisplay.contentQueue;
  return currentIndex >= 0 && currentIndex < items.length ? items[currentIndex] : null;
};

export const selectTransitionSettings = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.transitions;

export const selectLiveDisplayErrors = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.errors;

export const selectLastError = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.lastError;

export const selectIsLoading = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.isLoading;

export const selectIsTransitioning = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.isTransitioning;

export const selectContentHistory = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.contentHistory;

export const selectLastContentUpdate = (state: { liveDisplay: LiveDisplayState }) => 
  state.liveDisplay.lastContentUpdate; 