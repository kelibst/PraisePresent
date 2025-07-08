import { configureStore } from '@reduxjs/toolkit';
import servicesReducer from './servicesSlice';
import settingsReducer from "./settingSlice";
import displayReducer from "./displaySlice";

export const store = configureStore({
  reducer: {
    services: servicesReducer,
    settings: settingsReducer,
    display: displayReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 