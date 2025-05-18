import React, { useState } from 'react';
import AnimatedSidebar from './AnimatedSidebar';
import { Outlet } from 'react-router-dom';
import CustomTitleBar from '../renderer/CustomTitleBar';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden min-w-screen">
      {/* Top bar */}
      {/* <header className="h-16 flex items-center px-4 bg-background border-b shadow-sm sticky top-0 z-20">
        <button
          className="p-2 rounded hover:bg-accent transition-colors"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Retract sidebar' : 'Expand sidebar'}
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-4 text-xl font-bold tracking-tight text-foreground">PraisePresent</span>
      </header> */}
      {/* Animated Aside */}
      <AnimatedSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      {/* Main content shifts right when aside is open */}
      <main className={`flex-1 p-0 md:p-8 transition-all duration-500 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout; 