import React from "react";
import AppRoutes from "../routes";
import { usePresentationInit } from "../hooks/usePresentationInit";
import LiveDisplayRenderer from "../components/LiveDisplay/LiveDisplayRenderer";

const App: React.FC = () => {
  // Check if we're in live display mode via query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isLiveDisplayMode = urlParams.get("mode") === "live-display";

  console.log("App.tsx: Current URL:", window.location.href);
  console.log("App.tsx: Query params:", window.location.search);
  console.log("App.tsx: Live display mode:", isLiveDisplayMode);

  // If this is the live display window, render only the LiveDisplayRenderer
  if (isLiveDisplayMode) {
    console.log("App.tsx: Rendering LiveDisplayRenderer for live display mode");
    return <LiveDisplayRenderer />;
  }

  // Main application component with initialization
  const MainApp: React.FC = () => {
    // Initialize presentation system with placeholders
    usePresentationInit();

    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <div className="app-content">
          <AppRoutes />
        </div>
      </div>
    );
  };

  // Regular main application mode
  console.log("App.tsx: Rendering main application");
  return <MainApp />;
};

export default App;
