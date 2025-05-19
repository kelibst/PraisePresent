import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout components
import AppLayout from '@/components/layout/AppLayout';

// Page components from pages folder
import Homepage from '@/pages/Homepage';
import ScripturePage from '@/pages/ScripturePage';
import SongsPage from '@/pages/SongsPage';
import MediaPage from '@/pages/MediaPage';
import PresentationsPage from '@/pages/PresentationsPage';
import ServicesPage from '@/pages/ServicesPage';
import ServiceDetail from '@/pages/ServiceDetail';
import Presenting from './pages/Presenting';
import LivePresentation from './pages/LivePresentation';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route element={<AppLayout />}>
        <Route path="/scripture" element={<ScripturePage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/presentations" element={<Presenting />} />
        <Route path="/live" element={<LivePresentation />} />
        <Route path="/services" element={<ServicesPage />}>
          <Route index element={null} />
          <Route path=":id" element={<ServiceDetail />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes; 