import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/renderer/features/home/HomePage';
import ServicesPage from '@/renderer/features/planning/ServicesPage';
import ServiceDetail from '@/renderer/features/planning/ServiceDetail';
import AppLayout from '@/renderer/components/layout/AppLayout';
import AudienceView from '@/renderer/features/presentation/AudienceView';
import PresentPage from '@/renderer/features/present/PresentPage';
import SongsPage from '@/renderer/features/songs/SongsPage';
import SettingsPage from '@/renderer/features/settings/SettingsPage';
import MediaPage from '@/renderer/features/media/MediaPage';

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
      {/* Every operator screen sits inside the persistent shell (AppLayout). */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        {/* Scripture folded into the unified Present screen (M1, §1.9). */}
        <Route path="/scripture" element={<Navigate to="/present" replace />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/media" element={<MediaPage />} />
        {/* Live Detect folded into the unified Present screen (M2, §1.9). */}
        <Route path="/detect" element={<Navigate to="/present" replace />} />
        <Route path="/present" element={<PresentPage />} />
        <Route path="/services" element={<ServicesPage />}>
          <Route index element={null} />
          <Route path=":id" element={<ServiceDetail />} />
        </Route>
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  </HashRouter>
);

export default AppRouter;
