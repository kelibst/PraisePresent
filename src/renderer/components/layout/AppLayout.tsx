import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-0 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
