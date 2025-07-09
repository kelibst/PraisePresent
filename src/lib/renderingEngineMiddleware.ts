import { Middleware } from '@reduxjs/toolkit';
import { renderingEngine } from '@/services/RenderingEngine';
import { setDisplays, setSelectedLiveDisplay, updateDisplaySettings } from './displaySlice';
import { DisplayInfo } from '@/services/DisplayManager';

/**
 * Redux middleware to synchronize RenderingEngine state with Redux store
 */
export const renderingEngineMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();

  // Sync display information changes
  if (setDisplays.match(action)) {
    const displays = action.payload;
    const primaryDisplay = displays.find((d: DisplayInfo) => d.isPrimary);
    
    if (primaryDisplay) {
      renderingEngine.setDisplayInfo(primaryDisplay);
    }
  }

  // Sync selected live display changes
  if (setSelectedLiveDisplay.match(action)) {
    const displayId = action.payload;
    if (displayId && state.display?.displays) {
      const selectedDisplay = state.display.displays.find((d: DisplayInfo) => d.id === displayId);
      if (selectedDisplay) {
        renderingEngine.setDisplayInfo(selectedDisplay);
      }
    }
  }

  // Sync display settings changes
  if (updateDisplaySettings.match(action)) {
    // Handle any display settings that affect rendering
    const settings = action.payload;
    console.log('Display settings updated:', settings);
    // Add specific handling for settings that affect rendering
  }

  return result;
};

/**
 * Observer pattern for RenderingEngine state changes
 */
export class RenderingEngineObserver {
  private static instance: RenderingEngineObserver;
  private listeners: Array<(state: any) => void> = [];

  private constructor() {}

  public static getInstance(): RenderingEngineObserver {
    if (!RenderingEngineObserver.instance) {
      RenderingEngineObserver.instance = new RenderingEngineObserver();
    }
    return RenderingEngineObserver.instance;
  }

  public subscribe(listener: (state: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public notify(state: any): void {
    this.listeners.forEach(listener => listener(state));
  }
}

export const renderingEngineObserver = RenderingEngineObserver.getInstance(); 