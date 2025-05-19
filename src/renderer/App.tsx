import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Homepage from '@/dashboard/Homepage';
import ServicesPage from '@/dashboard/ServicesPage';
import ServiceDetail from '@/dashboard/ServiceDetail';
import AppLayout from '@/dashboard/AppLayout';
import CustomTitleBar from './CustomTitleBar';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <CustomTitleBar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route element={<AppLayout />}>
            <Route path="/services" element={<ServicesPage />}>
              <Route index element={null} />
              <Route path=":id" element={<ServiceDetail />} />
            </Route>
            {/* Add other routes here, e.g. Scripture, Songs, Media, Presentations */}
          </Route>
        </Routes>
      </div>
    </div>
  );
};

export default App; 