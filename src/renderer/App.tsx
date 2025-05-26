import React from 'react';
import AppRoutes from '../routes';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="app-content">
        <AppRoutes />
      </div>
    </div>
  );
};

export default App; 