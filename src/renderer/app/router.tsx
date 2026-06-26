import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/renderer/features/home/HomePage';
import ServicesPage from '@/renderer/features/planning/ServicesPage';
import ServiceDetail from '@/renderer/features/planning/ServiceDetail';
import AppLayout from '@/renderer/components/layout/AppLayout';
import AudienceView from '@/renderer/features/presentation/AudienceView';
import SongsPage from '@/renderer/features/songs/SongsPage';

/**
 * Central application router.
 *
 * Uses HashRouter (never BrowserRouter — CLAUDE.md §1.2): the packaged app
 * loads over `file://`, where path-based routing silently breaks in
 * production. Under the hash, deep links and reloads survive.
 */
const AppRouter: React.FC = () => (
  <HashRouter>
    <Routes>
      {/* Audience/projector window — full-screen, no presenter chrome. */}
      <Route path="/audience" element={<AudienceView />} />
      <Route path="/" element={<HomePage />} />
      <Route element={<AppLayout />}>
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/services" element={<ServicesPage />}>
          <Route index element={null} />
          <Route path=":id" element={<ServiceDetail />} />
        </Route>
        {/* Add other routes here, e.g. Scripture, Songs, Media, Presentations */}
      </Route>
    </Routes>
  </HashRouter>
);

export default AppRouter;
