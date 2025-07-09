export interface LiveDisplayConfig {
  displayId: number;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
  frame?: boolean;
}

export interface LiveDisplayStatus {
  hasWindow: boolean;
  isVisible: boolean;
  currentDisplayId: number | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  isFullscreen: boolean;
}

export interface LiveDisplayResult {
  success: boolean;
  displayId?: number;
  error?: string;
  settings?: any;
}

export interface LiveDisplayContent {
  type: string;
  title?: string;
  content?: any;
  timestamp?: string;
}

export class LiveDisplayError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'LiveDisplayError';
  }
}

export const createInitialContent = (): LiveDisplayContent => ({
  type: 'placeholder',
  title: 'Live Display Ready',
  content: {
    mainText: 'PraisePresent Live Display',
    subText: 'Ready to display content',
    timestamp: new Date().toLocaleTimeString(),
  },
});

export const validateDisplayId = (displayId: number | null | undefined): number => {
  if (!displayId || typeof displayId !== 'number') {
    throw new LiveDisplayError('Invalid display ID provided', 'INVALID_DISPLAY_ID');
  }
  return displayId;
};

export const handleLiveDisplayError = (error: unknown, operation: string): LiveDisplayResult => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Live Display ${operation} failed:`, error);
  
  return {
    success: false,
    error: errorMessage,
  };
};

export const createSuccessResult = (displayId?: number, settings?: any): LiveDisplayResult => ({
  success: true,
  displayId,
  settings,
});

export const sendContentWithDelay = (
  sendFunction: (content: LiveDisplayContent) => void,
  delay: number = 1000
): void => {
  setTimeout(() => {
    sendFunction(createInitialContent());
  }, delay);
};

export const getDisplayValidationError = (displayId: number | null | undefined): string | null => {
  if (!displayId) {
    return "Please select a display for live output first";
  }
  return null;
}; 