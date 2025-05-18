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
    };
  }
}

const CustomTitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMaximized(() => setIsMaximized(true));
      window.electronAPI.onUnmaximized(() => setIsMaximized(false));
    }
  }, []);

  return (
    <div className="flex items-center justify-between w-full h-10 bg-blue-800 text-white select-none app-region-drag">
     
      {/* Menu */}
      <div className="flex gap-4 text-sm font-medium app-region-no-drag">
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">File</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">Edit</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">View</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">Window</button>
        <button className="hover:bg-blue-700 px-2 py-1 rounded transition">Help</button>
		  </div>
		  
		   {/* App Icon & Name */}
      <div className="flex items-center px-3 gap-2 app-region-no-drag">
        <span className="font-bold text-base">PraisePresent</span>
      </div>
      {/* Window Controls */}
      <div className="flex items-center gap-1 pr-2 app-region-no-drag">
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-blue-700 rounded transition"
          title="Minimize"
          onClick={() => window.electronAPI?.minimize()}
        >
          <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" fill="currentColor"/></svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-blue-700 rounded transition"
          title={isMaximized ? 'Restore' : 'Maximize'}
          onClick={() => isMaximized ? window.electronAPI?.unmaximize() : window.electronAPI?.maximize()}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
          )}
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-red-600 rounded transition"
          title="Close"
          onClick={() => window.electronAPI?.close()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar; 