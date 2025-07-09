import { useSelector } from 'react-redux';
import { DisplayInfo } from '@/services/DisplayManager';
import { selectDisplays, selectPrimaryDisplay, selectSecondaryDisplay, selectSelectedLiveDisplay } from '@/lib/displaySlice';

export interface UseDisplayInfoResult {
  displays: DisplayInfo[];
  primaryDisplay: DisplayInfo | null;
  secondaryDisplay: DisplayInfo | null;
  selectedLiveDisplay: DisplayInfo | null;
  hasMultipleDisplays: boolean;
  getDisplayById: (id: number) => DisplayInfo | null;
}

/**
 * Hook to get centralized display information from Redux store
 */
export const useDisplayInfo = (): UseDisplayInfoResult => {
  const displays = useSelector(selectDisplays);
  const primaryDisplay = useSelector(selectPrimaryDisplay);
  const secondaryDisplay = useSelector(selectSecondaryDisplay);
  const selectedLiveDisplay = useSelector(selectSelectedLiveDisplay);

  const getDisplayById = (id: number): DisplayInfo | null => {
    return displays.find(display => display.id === id) || null;
  };

  return {
    displays,
    primaryDisplay,
    secondaryDisplay,
    selectedLiveDisplay,
    hasMultipleDisplays: displays.length > 1,
    getDisplayById,
  };
};

/**
 * Hook to get specific display information by ID
 */
export const useDisplayById = (displayId: number | null): DisplayInfo | null => {
  const displays = useSelector(selectDisplays);
  
  if (!displayId) return null;
  
  return displays.find(display => display.id === displayId) || null;
};

/**
 * Hook to get display bounds for a specific display
 */
export const useDisplayBounds = (displayId: number | null) => {
  const display = useDisplayById(displayId);
  
  if (!display) {
    return {
      bounds: null,
      workArea: null,
      scaleFactor: 1,
    };
  }

  return {
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
  };
}; 