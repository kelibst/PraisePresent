import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      unmaximize: () => void;
      close: () => void;
      onMaximized: (callback: () => void) => void;
      onUnmaximized: (callback: () => void) => void;
      offMaximized?: (callback: () => void) => void;
      offUnmaximized?: (callback: () => void) => void;
      // Add theme properties
      onThemeUpdate?: (callback: (event: any, theme: string) => void) => void;
      setTheme?: (theme: string) => void;
      getSystemTheme?: () => Promise<string>;
    };
  }
}

const CustomTitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if window is already maximized when component mounts
    if (window.electronAPI) {
      window.electronAPI.getSystemTheme?.().then(() => {
        // This is just to force a window check
        if (window.innerWidth === window.screen.availWidth && 
            window.innerHeight === window.screen.availHeight) {
          setIsMaximized(true);
        }
      });
    }

    // Listen for maximize/unmaximize events
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);

    if (window.electronAPI) {
      window.electronAPI.onMaximized(handleMaximize);
      window.electronAPI.onUnmaximized(handleUnmaximize);
    }

    return () => {
      if (window.electronAPI && window.electronAPI.offMaximized && window.electronAPI.offUnmaximized) {
        window.electronAPI.offMaximized(handleMaximize);
        window.electronAPI.offUnmaximized(handleUnmaximize);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-between w-full h-8 bg-blue-800 text-white select-none title-bar">
      {/* Menu */}
      <div className="flex gap-4 text-sm font-medium non-draggable">
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">File</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">Edit</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">View</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">Window</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">Help</button>
      </div>
      
      {/* App Name (centered) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 font-bold text-base">
        PraisePresent
      </div>
      
      {/* Window Controls */}
      <div className="flex items-center non-draggable">
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-blue-700 transition"
          title="Minimize"
          onClick={() => window.electronAPI?.minimize()}
        >
          <svg width="10" height="1" viewBox="0 0 10 1"><path d="M0 0h10v1H0z" fill="currentColor" /></svg>
        </button>
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-blue-700 transition"
          title={isMaximized ? 'Restore' : 'Maximize'}
          onClick={() => isMaximized ? window.electronAPI?.unmaximize() : window.electronAPI?.maximize()}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 3h3V0h7v7H7v3H0V3zm1 1v5h5V4H1zm6-3v5h2V1H7z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0h10v10H0V0zm1 1v8h8V1H1z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-red-600 transition"
          title="Close"
          onClick={() => window.electronAPI?.close()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 0h1v1h1v1h2V1h1V0h1v1h1v1h1v1h1v1h-1v2h1v1h-1v1h-1v1h-1v1H7V9H6V8H4v1H3v1H2V9H1V8H0V7h1V5H0V4h1V3h1V2h1V1H2V0z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar; 