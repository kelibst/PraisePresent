import { configureStore } from '@reduxjs/toolkit';
import servicesReducer from './servicesSlice';
import bibleReducer from './bibleSlice';

export const store = configureStore({
  reducer: {
    services: servicesReducer,
    bible: bibleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 