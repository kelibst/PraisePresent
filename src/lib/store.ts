import { configureStore } from '@reduxjs/toolkit';
import servicesReducer from './servicesSlice';
import settingsReducer from "./settingSlice";
export const store = configureStore({
  reducer: {
    services: servicesReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 