import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createLiveDisplay,
  setLiveDisplayActive,
  selectSelectedLiveDisplay,
  selectDisplaySettings,
  selectDisplayError,
  setDisplayError,
  clearDisplayError,
} from "@/lib/displaySlice";
import type { AppDispatch } from "@/lib/store";

interface LiveDisplayStatus {
  hasWindow: boolean;
  isVisible: boolean;
  currentDisplayId: number | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  isFullscreen: boolean;
}

export const useLiveDisplay = () => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedDisplay = useSelector(selectSelectedLiveDisplay);
  const displaySettings = useSelector(selectDisplaySettings);
  const reduxError = useSelector(selectDisplayError);

  const [liveDisplayStatus, setLiveDisplayStatus] = useState<LiveDisplayStatus | null>(null);
  const [isCreatingLive, setIsCreatingLive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Combine Redux and local errors
  const error = reduxError || localError;

  const checkLiveDisplayStatus = useCallback(async () => {
    try {
      const status = await window.electron.liveDisplay.getStatus();
      setLiveDisplayStatus(status);
      setLocalError(null);
      dispatch(clearDisplayError());
    } catch (error) {
      const errorMessage = "Failed to get live display status";
      console.error(errorMessage, error);
      setLocalError(errorMessage);
    }
  }, [dispatch]);

  const createLive = useCallback(
    async (displayId: number) => {
      if (!displayId) {
        const errorMessage = "Please select a display for live output first";
        dispatch(setDisplayError(errorMessage));
        return false;
      }

      setIsCreatingLive(true);
      setLocalError(null);
      dispatch(clearDisplayError());

      try {
        // Use Redux thunk to create live display
        const resultAction = await dispatch(createLiveDisplay(displayId));
        if (createLiveDisplay.fulfilled.match(resultAction)) {
          await checkLiveDisplayStatus();
          dispatch(setLiveDisplayActive(true));
          return true;
        }
        return false;
      } catch (error) {
        const errorMessage = "Failed to create live display";
        console.error(errorMessage, error);
        dispatch(setDisplayError(errorMessage));
        return false;
      } finally {
        setIsCreatingLive(false);
      }
    },
    [dispatch, checkLiveDisplayStatus]
  );

  const showLive = useCallback(async () => {
    try {
      await window.electron.liveDisplay.show();
      await checkLiveDisplayStatus();
      dispatch(setLiveDisplayActive(true));
      setLocalError(null);
      dispatch(clearDisplayError());
    } catch (error) {
      const errorMessage = "Failed to show live display";
      console.error(errorMessage, error);
      setLocalError(errorMessage);
    }
  }, [dispatch, checkLiveDisplayStatus]);

  const hideLive = useCallback(async () => {
    try {
      await window.electron.liveDisplay.hide();
      await checkLiveDisplayStatus();
      setLocalError(null);
      dispatch(clearDisplayError());
    } catch (error) {
      const errorMessage = "Failed to hide live display";
      console.error(errorMessage, error);
      setLocalError(errorMessage);
    }
  }, [dispatch, checkLiveDisplayStatus]);

  const closeLive = useCallback(async () => {
    try {
      await window.electron.liveDisplay.close();
      await checkLiveDisplayStatus();
      dispatch(setLiveDisplayActive(false));
      setLocalError(null);
      dispatch(clearDisplayError());
    } catch (error) {
      const errorMessage = "Failed to close live display";
      console.error(errorMessage, error);
      setLocalError(errorMessage);
    }
  }, [dispatch, checkLiveDisplayStatus]);

  // Initialize status check on mount and when selected display changes
  useEffect(() => {
    checkLiveDisplayStatus();
  }, [checkLiveDisplayStatus, selectedDisplay?.id]);

  // Sync live display status with Redux state
  useEffect(() => {
    if (liveDisplayStatus) {
      const isActive = liveDisplayStatus.hasWindow && liveDisplayStatus.isVisible;
      if (isActive !== displaySettings.isLiveDisplayActive) {
        dispatch(setLiveDisplayActive(isActive));
      }
    }
  }, [liveDisplayStatus, displaySettings.isLiveDisplayActive, dispatch]);

  return {
    liveDisplayStatus,
    isCreatingLive,
    error,
    selectedDisplay,
    displaySettings,
    createLive,
    showLive,
    hideLive,
    closeLive,
    refreshStatus: checkLiveDisplayStatus,
  };
};