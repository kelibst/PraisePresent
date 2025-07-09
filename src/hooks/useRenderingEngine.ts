import { useEffect, useState } from 'react';
import { renderingEngine } from '@/services/RenderingEngine';
import { renderingEngineObserver } from '@/lib/renderingEngineMiddleware';
import { DisplayInfo } from '@/services/DisplayManager';

export interface RenderingEngineState {
  displayInfo: DisplayInfo | null;
  currentTheme: any | null;
  currentSlide: any | null;
  isReady: boolean;
}

/**
 * Hook to observe RenderingEngine state changes
 */
export const useRenderingEngineState = (): RenderingEngineState => {
  const [state, setState] = useState<RenderingEngineState>({
    displayInfo: null,
    currentTheme: null,
    currentSlide: null,
    isReady: false,
  });

  useEffect(() => {
    const unsubscribe = renderingEngineObserver.subscribe((notification) => {
      switch (notification.type) {
        case 'DISPLAY_INFO_CHANGED':
          setState(prev => ({
            ...prev,
            displayInfo: notification.displayInfo,
            isReady: true,
          }));
          break;
        case 'THEME_CHANGED':
          setState(prev => ({
            ...prev,
            currentTheme: notification.theme,
          }));
          break;
        case 'SLIDE_RENDERED':
          setState(prev => ({
            ...prev,
            currentSlide: notification.slide,
          }));
          break;
      }
    });

    return unsubscribe;
  }, []);

  return state;
};

/**
 * Hook to get RenderingEngine instance with state synchronization
 */
export const useRenderingEngine = () => {
  const state = useRenderingEngineState();

  return {
    engine: renderingEngine,
    state,
    isReady: state.isReady,
  };
}; 