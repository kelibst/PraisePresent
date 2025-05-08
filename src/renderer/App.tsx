import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Homepage from '@/dashboard/Homepage';
import ServicesPage from '@/dashboard/ServicesPage';
import ServiceDetail from '@/dashboard/ServiceDetail';
import AppLayout from '@/dashboard/AppLayout';

const App: React.FC = () => {
  return (
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
  );
};

export default App; 