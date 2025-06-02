import { useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useLiveDisplay } from "./useLiveDisplay";

export const useLiveDisplayControls = () => {
  const { liveDisplayStatus } = useLiveDisplay();
  const { previewItem, liveItem } = useSelector((state: RootState) => state.presentation);

  const sendContentToLive = useCallback(async (content?: any) => {
    if (!liveDisplayStatus?.hasWindow) {
      console.warn("No live display window available");
      return false;
    }

    try {
      const contentToSend = content || previewItem;
      if (!contentToSend) {
        console.warn("No content to send to live display");
        return false;
      }

      // Send content via IPC
      await window.electronAPI?.invoke('live-display:sendContent', {
        type: contentToSend.type,
        title: contentToSend.title,
        content: contentToSend.content,
        subtitle: contentToSend.reference || contentToSend.translation,
        metadata: contentToSend
      });

      console.log("Content sent to live display:", contentToSend);
      return true;
    } catch (error) {
      console.error("Failed to send content to live display:", error);
      return false;
    }
  }, [previewItem, liveDisplayStatus]);

  const clearLiveContent = useCallback(async () => {
    if (!liveDisplayStatus?.hasWindow) {
      console.warn("No live display window available");
      return false;
    }

    try {
      await window.electronAPI?.invoke('live-display:clearContent');
      console.log("Live content cleared");
      return true;
    } catch (error) {
      console.error("Failed to clear live content:", error);
      return false;
    }
  }, [liveDisplayStatus]);

  const showBlackScreen = useCallback(async () => {
    if (!liveDisplayStatus?.hasWindow) {
      console.warn("No live display window available");
      return false;
    }

    try {
      await window.electronAPI?.invoke('live-display:showBlack');
      console.log("Black screen shown");
      return true;
    } catch (error) {
      console.error("Failed to show black screen:", error);
      return false;
    }
  }, [liveDisplayStatus]);

  const showLogoScreen = useCallback(async () => {
    if (!liveDisplayStatus?.hasWindow) {
      console.warn("No live display window available");
      return false;
    }

    try {
      await window.electronAPI?.invoke('live-display:showLogo');
      console.log("Logo screen shown");
      return true;
    } catch (error) {
      console.error("Failed to show logo screen:", error);
      return false;
    }
  }, [liveDisplayStatus]);

  return {
    sendContentToLive,
    clearLiveContent,
    showBlackScreen,
    showLogoScreen,
    previewItem,
    liveItem,
    liveDisplayStatus,
    isLiveDisplayReady: !!(liveDisplayStatus?.hasWindow && liveDisplayStatus?.isVisible),
  };
}; 