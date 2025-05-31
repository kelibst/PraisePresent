import React, { useEffect } from "react";
import AppRoutes from "../routes";
import { useAutoLiveDisplay } from "../hooks/useAutoLiveDisplay";

const App: React.FC = () => {
  const { initializeLiveDisplay } = useAutoLiveDisplay();

  // Auto-initialize live display when app starts
  useEffect(() => {
    // Wait a bit for the app to fully load
    const timer = setTimeout(() => {
      initializeLiveDisplay();
    }, 2000);

    return () => clearTimeout(timer);
  }, [initializeLiveDisplay]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="app-content">
        <AppRoutes />
      </div>
    </div>
  );
};

export default App;
