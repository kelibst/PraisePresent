import { configureStore } from '@reduxjs/toolkit';
import servicesReducer from './servicesSlice';
import bibleReducer from './bibleSlice';
import presentationReducer from './presentationSlice';
import displayReducer from './displaySlice';

export const store = configureStore({
  reducer: {
    services: servicesReducer,
    bible: bibleReducer,
    presentation: presentationReducer,
    display: displayReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 