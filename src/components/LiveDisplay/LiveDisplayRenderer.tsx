import React, { useEffect } from "react";
import UniversalSlideRenderer from "../UniversalSlideRenderer";
import { useLiveDisplayContent } from "./hooks/useLiveDisplayContent";
import { useLiveDisplayIPC } from "./hooks/useLiveDisplayIPC";
import BlackScreen from "./components/BlackScreen";
import LogoScreen from "./components/LogoScreen";
import DebugOverlay from "./components/DebugOverlay";
import "./LiveDisplayRenderer.css";

const LiveDisplayRenderer: React.FC = () => {
  console.log("🔴 LIVE DISPLAY RENDERER: Component mounting");

  // Custom hooks for managing different concerns
  const {
    content,
    theme,
    themedSlide,
    fallbackSlide,
    isVisible,
    liveItem,
    handleContentUpdate,
    handleContentClear,
    handleThemeUpdate,
    handleVisibilityChange
  } = useLiveDisplayContent();

  const {
    ipcConnected,
    showBlack,
    showLogo,
    setupIPC
  } = useLiveDisplayIPC();

  // Set up IPC listeners
  useEffect(() => {
    const cleanup = setupIPC({
      onContentUpdate: handleContentUpdate,
      onContentClear: handleContentClear,
      onThemeUpdate: handleThemeUpdate
    });

    return cleanup;
  }, [setupIPC, handleContentUpdate, handleContentClear, handleThemeUpdate]);

  // Handle visibility changes based on screen states
  useEffect(() => {
    handleVisibilityChange(!showBlack && !showLogo);
  }, [showBlack, showLogo, handleVisibilityChange]);

  // Render black screen
  if (showBlack) {
    return <BlackScreen />;
  }

  // Render logo/church branding
  if (showLogo) {
    return <LogoScreen />;
  }

  // Prepare debug information
  const debugInfo = {
    liveItemType: liveItem?.type || "",
    liveItemTitle: liveItem?.title || "",
    localContentType: content?.type || "",
    hasSlide: !!themedSlide,
    slideType: themedSlide?.type || "",
    ipcConnected,
    showBlack,
    showLogo
  };

  const slideToRender = themedSlide || fallbackSlide;

  return (
    <div
      className={`live-display-container ${theme.animation} ${isVisible ? "visible" : ""} w-screen h-screen overflow-hidden relative flex items-center justify-center bg-black`}
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundGradient,
      }}
    >
      {/* Debug info overlay - remove in production */}
      <DebugOverlay
        debugInfo={debugInfo}
        enabled={process.env.NODE_ENV === 'development'}
      />

      {/* Render content using UniversalSlideRenderer for consistency */}
      <div className="w-full h-full">
        <UniversalSlideRenderer
          slide={slideToRender}
          width={1920}
          height={1080}
          isPreview={false}
          onSlideComplete={() => { /* Handle slide completion if needed */ }}
        />
      </div>
    </div>
  );
};

export default LiveDisplayRenderer;
