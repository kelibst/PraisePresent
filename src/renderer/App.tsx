import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Homepage from '@/components/dashboard/Homepage';
import ServicesPage from '@/components/dashboard/ServicesPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/services/:id" element={<ServicesPage />} />
    </Routes>
  );
};

export default App; 