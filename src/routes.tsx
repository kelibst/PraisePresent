import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout components
import AppLayout from '@/components/layout/AppLayout';

// Page components from pages folder
import Homepage from '@/pages/Homepage';

import LivePresentation from '@/pages/LivePresentation';

const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<Homepage />} />
			<Route element={<AppLayout />}>
				<Route path="/live" element={<LivePresentation />} />
			</Route>
		</Routes>
	);
};

export default AppRoutes; 