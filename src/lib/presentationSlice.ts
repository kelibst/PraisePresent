import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Verse } from './bibleSlice';

export interface PresentationItem {
  id: string;
  type: 'scripture' | 'song' | 'media' | 'slide';
  title: string;
  content: any; // Flexible content based on type
  reference?: string; // For scripture
  translation?: string; // For scripture
  verse?: Verse; // For scripture items
}

export interface PresentationState {
  previewItem: PresentationItem | null;
  liveItem: PresentationItem | null;
  scriptureList: Verse[];
  selectedVersion: string | null;
}

const initialState: PresentationState = {
  previewItem: null,
  liveItem: null,
  scriptureList: [],
  selectedVersion: null,
};

const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    setPreviewItem: (state, action: PayloadAction<PresentationItem>) => {
      state.previewItem = action.payload;
    },
    setLiveItem: (state, action: PayloadAction<PresentationItem>) => {
      state.liveItem = action.payload;
    },
    sendPreviewToLive: (state) => {
      if (state.previewItem) {
        state.liveItem = state.previewItem;
      }
    },
    clearPreview: (state) => {
      state.previewItem = null;
    },
    clearLive: (state) => {
      state.liveItem = null;
    },
    addToScriptureList: (state, action: PayloadAction<Verse>) => {
      // Check if verse already exists in list
      const exists = state.scriptureList.find(v => v.id === action.payload.id);
      if (!exists) {
        state.scriptureList.push(action.payload);
      }
    },
    removeFromScriptureList: (state, action: PayloadAction<string>) => {
      state.scriptureList = state.scriptureList.filter(v => v.id !== action.payload);
    },
    clearScriptureList: (state) => {
      state.scriptureList = [];
    },
    setSelectedVersion: (state, action: PayloadAction<string>) => {
      state.selectedVersion = action.payload;
    },
    sendVerseToPreview: (state, action: PayloadAction<Verse>) => {
      const verse = action.payload;
      const presentationItem: PresentationItem = {
        id: verse.id,
        type: 'scripture',
        title: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        content: verse.text,
        reference: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        translation: verse.version?.name,
        verse: verse,
      };
      state.previewItem = presentationItem;
    },
    sendVerseToLive: (state, action: PayloadAction<Verse>) => {
      const verse = action.payload;
      const presentationItem: PresentationItem = {
        id: verse.id,
        type: 'scripture',
        title: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        content: verse.text,
        reference: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        translation: verse.version?.name,
        verse: verse,
      };
      state.liveItem = presentationItem;
    },
  },
});

export const {
  setPreviewItem,
  setLiveItem,
  sendPreviewToLive,
  clearPreview,
  clearLive,
  addToScriptureList,
  removeFromScriptureList,
  clearScriptureList,
  setSelectedVersion,
  sendVerseToPreview,
  sendVerseToLive,
} = presentationSlice.actions;

export default presentationSlice.reducer; 