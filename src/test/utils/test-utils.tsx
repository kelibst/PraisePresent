import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: typeof store;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    store: testStore = store,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={testStore}>{children}</Provider>;
  }

  return {
    store: testStore,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock display data
export const mockDisplays = [
  {
    id: 1,
    label: 'Primary Display',
    friendlyName: 'Primary Monitor',
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1,
    rotation: 0,
    touchSupport: 'unavailable' as const,
    isPrimary: true,
  },
  {
    id: 2,
    label: 'Secondary Display',
    friendlyName: 'Secondary Monitor',
    bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
    workArea: { x: 1920, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1,
    rotation: 0,
    touchSupport: 'unavailable' as const,
    isPrimary: false,
  },
];

export const mockDisplayState = {
  displays: mockDisplays,
  primaryDisplay: mockDisplays[0],
  secondaryDisplay: mockDisplays[1],
  selectedLiveDisplay: null,
  settings: {
    selectedLiveDisplayId: null,
    isLiveDisplayActive: false,
    liveDisplayFullscreen: true,
    liveDisplayAlwaysOnTop: true,
    testMode: false,
  },
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),
  displayCaptures: {},
  capturingDisplays: [],
  liveDisplayContent: null,
  liveDisplayTheme: null,
}; 