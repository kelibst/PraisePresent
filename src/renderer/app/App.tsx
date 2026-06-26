import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/renderer/features/home/HomePage';
import ServicesPage from '@/renderer/features/planning/ServicesPage';
import ServiceDetail from '@/renderer/features/planning/ServiceDetail';
import AppLayout from '@/renderer/components/layout/AppLayout';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
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