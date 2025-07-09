import { Routes, Route } from "react-router-dom";

// Layout components
import AppLayout from "@/components/layout/AppLayout";

// Page components from pages folder
import Homepage from "@/pages/HomePage";
import Service from "@/pages/Serivce";
import Settings from "./pages/Settings";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Main application routes with layout */}
      <Route path="/" element={<Homepage />} />
      <Route  element={<AppLayout />}>
        <Route path="/service" element={<Service />} />
        <Route path="/settings" element={<Settings />} />
        {/* <Route path="/live" element={<LivePresentation />} />
        <Route path="/songs" element={<Songs />} /> */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;