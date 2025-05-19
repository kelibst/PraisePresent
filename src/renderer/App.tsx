import React from 'react';
import AppRoutes from '../routes';
import CustomTitleBar from './CustomTitleBar';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <CustomTitleBar />
      <div className="app-content">
        <AppRoutes />
      </div>
    </div>
  );
};

export default App; 