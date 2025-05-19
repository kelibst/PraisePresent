import React, { useEffect, useState } from 'react';

interface TitleBarProps {
  title: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Listen for window maximize/unmaximize events
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);

    // Add event listeners
    if (window.electronAPI) {
      window.electronAPI.onMaximized(handleMaximize);
      window.electronAPI.onUnmaximized(handleUnmaximize);
    }

    return () => {
      // Remove event listeners (cleanup)
      if (window.electronAPI) {
        window.electronAPI.offMaximized && window.electronAPI.offMaximized(handleMaximize);
        window.electronAPI.offUnmaximized && window.electronAPI.offUnmaximized(handleUnmaximize);
      }
    };
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximizeToggle = () => {
    if (window.electronAPI) {
      if (isMaximized) {
        window.electronAPI.unmaximize();
      } else {
        window.electronAPI.maximize();
      }
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };

  return (
    <div className="title-bar bg-background border-b border-border flex justify-between items-center h-8 select-none draggable">
      <div className="title-bar-drag-area pl-2 flex-1 draggable flex items-center h-full text-sm">
        {title}
      </div>
      <div className="title-bar-controls flex items-center h-full non-draggable">
        <button 
          onClick={handleMinimize}
          className="title-bar-button w-10 h-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <path d="M0 0h10v1H0z" fill="currentColor" />
          </svg>
        </button>
        <button 
          onClick={handleMaximizeToggle}
          className="title-bar-button w-10 h-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
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
          onClick={handleClose}
          className="title-bar-button w-10 h-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 0h1v1h1v1h2V1h1V0h1v1h1v1h1v1h1v1h-1v2h1v1h-1v1h-1v1h-1v1H7V9H6V8H4v1H3v1H2V9H1V8H0V7h1V5H0V4h1V3h1V2h1V1H2V0z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 