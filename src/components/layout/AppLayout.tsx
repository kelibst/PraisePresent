import React, { useState } from 'react';
import AnimatedSidebar from './AnimatedSidebar';
import { Outlet } from 'react-router-dom';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden min-w-screen">
      {/* Animated Sidebar */}
      <AnimatedSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      {/* Main content shifts right when aside is open */}
      <main className={`flex-1 p-0 md:p-8 transition-all duration-500 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout; 