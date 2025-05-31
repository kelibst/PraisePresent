import React from "react";
import { Routes, Route } from "react-router-dom";

// Layout components
import AppLayout from "@/components/layout/AppLayout";

// Page components from pages folder
import Homepage from "@/pages/Homepage";
import Scripture from "@/pages/Scripture";
import LivePresentation from "@/pages/LivePresentation";
import Settings from "@/pages/Settings";

// Live Display component (no layout)
import LiveDisplay from "@/pages/LiveDisplay";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route element={<AppLayout />}>
        <Route path="/scripture" element={<Scripture />} />
        <Route path="/live" element={<LivePresentation />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* Live Display Route - No layout for fullscreen display */}
      <Route path="/live-display" element={<LiveDisplay />} />
    </Routes>
  );
};

export default AppRoutes;
