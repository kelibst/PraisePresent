import { configureStore } from '@reduxjs/toolkit';
import servicesReducer from './servicesSlice';
import settingsReducer from "./settingSlice";
import displayReducer from "./displaySlice";
import notesReducer from './notesSlice';
import { renderingEngineMiddleware } from './renderingEngineMiddleware';

export const store = configureStore({
  reducer: {
    services: servicesReducer,
    settings: settingsReducer,
    display: displayReducer,
    notes: notesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(renderingEngineMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 