import { useEffect, useState, useCallback } from "react";
import { LiveContent, LiveDisplayTheme } from "../types";

export const useLiveDisplayIPC = () => {
  const [ipcConnected, setIpcConnected] = useState(false);
  const [showBlack, setShowBlack] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  // Content update handlers
  const handleContentUpdate = useCallback((newContent: LiveContent, onUpdate: (content: LiveContent) => void) => {
    console.log("🔴 LIVE DISPLAY: IPC content update received:", newContent);
    onUpdate(newContent);
    setShowBlack(false);
    setShowLogo(false);
  }, []);

  const handleContentClear = useCallback((onClear: () => void) => {
    console.log("🔴 LIVE DISPLAY: IPC content clear");
    onClear();
    setShowBlack(false);
    setShowLogo(false);
  }, []);

  const handleShowBlack = useCallback(() => {
    console.log("🔴 LIVE DISPLAY: IPC show black screen");
    setShowBlack(true);
    setShowLogo(false);
  }, []);

  const handleShowLogo = useCallback(() => {
    console.log("🔴 LIVE DISPLAY: IPC show logo");
    setShowLogo(true);
    setShowBlack(false);
  }, []);

  const handleThemeUpdate = useCallback((newTheme: Partial<LiveDisplayTheme>, onThemeUpdate: (theme: Partial<LiveDisplayTheme>) => void) => {
    console.log("🔴 LIVE DISPLAY: IPC theme update:", newTheme);
    onThemeUpdate(newTheme);
  }, []);

  const setupIPC = useCallback((callbacks: {
    onContentUpdate: (content: LiveContent) => void;
    onContentClear: () => void;
    onThemeUpdate: (theme: Partial<LiveDisplayTheme>) => void;
  }) => {
    console.log("🔴 LIVE DISPLAY RENDERER: Setting up IPC listeners...");
    console.log("🔴 LIVE DISPLAY RENDERER: window.electronAPI available:", !!window.electronAPI);

    if (!window.electronAPI) {
      console.warn("🔴 LIVE DISPLAY RENDERER: electronAPI not available - using Redux state only");
      return;
    }

    try {
      // Register IPC handlers using existing API structure
      const cleanupContentUpdate = window.electronAPI.onLiveContentUpdate?.((content: LiveContent) => 
        handleContentUpdate(content, callbacks.onContentUpdate)
      );
      
      const cleanupContentClear = window.electronAPI.onLiveContentClear?.(() => 
        handleContentClear(callbacks.onContentClear)
      );
      
      const cleanupShowBlack = window.electronAPI.onLiveShowBlack?.(handleShowBlack);
      
      const cleanupShowLogo = window.electronAPI.onLiveShowLogo?.(handleShowLogo);
      
      const cleanupThemeUpdate = window.electronAPI.onLiveThemeUpdate?.((theme: Partial<LiveDisplayTheme>) => 
        handleThemeUpdate(theme, callbacks.onThemeUpdate)
      );

      setIpcConnected(true);
      console.log("🔴 LIVE DISPLAY RENDERER: IPC listeners registered successfully");

      // Return cleanup function
      return () => {
        try {
          cleanupContentUpdate?.();
          cleanupContentClear?.();
          cleanupShowBlack?.();
          cleanupShowLogo?.();
          cleanupThemeUpdate?.();
          console.log("🔴 LIVE DISPLAY RENDERER: IPC listeners cleaned up");
        } catch (error) {
          console.error("🔴 LIVE DISPLAY RENDERER: Error cleaning up listeners:", error);
        }
      };
    } catch (error) {
      console.error("🔴 LIVE DISPLAY RENDERER: Failed to register IPC listeners:", error);
      setIpcConnected(false);
    }
  }, [handleContentUpdate, handleContentClear, handleShowBlack, handleShowLogo, handleThemeUpdate]);

  return {
    ipcConnected,
    showBlack,
    showLogo,
    setupIPC
  };
}; 