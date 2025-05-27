import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { databaseIPC } from './database-ipc';

// Types
export interface Translation {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isDefault: boolean;
}

export interface Version {
  id: string;
  name: string;
  fullName: string;
  translationId: string;
  description?: string | null;
  isDefault: boolean;
  year?: number | null;
  publisher?: string | null;
  translation?: Translation;
}

export interface Book {
  id: number;
  name: string;
  shortName: string;
  testament: string;
  category: string;
  chapters: number;
  order: number;
}

export interface Verse {
  id: string;
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  versionId: string;
  book?: Book;
  version?: Version;
}

export interface BibleState {
  translations: Translation[];
  versions: Version[];
  books: Book[];
  selectedTranslation: string | null;
  selectedVersion: string | null;
  selectedBook: number | null;
  selectedChapter: number | null;
  verses: Verse[];
  searchResults: Verse[];
  loading: boolean;
  error: string | null;
}

// Async thunks
export const loadTranslations = createAsyncThunk(
  'bible/loadTranslations',
  async () => {
    const translations = await databaseIPC.loadTranslations();
    return translations;
  }
);

export const loadVersions = createAsyncThunk(
  'bible/loadVersions',
  async (translationId?: string) => {
    const versions = await databaseIPC.loadVersions(translationId);
    return versions;
  }
);

export const loadBooks = createAsyncThunk(
  'bible/loadBooks',
  async () => {
    const books = await databaseIPC.loadBooks();
    return books;
  }
);

export const loadVerses = createAsyncThunk(
  'bible/loadVerses',
  async ({ versionId, bookId, chapter }: { versionId: string; bookId: number; chapter: number }) => {
    const verses = await databaseIPC.loadVerses({ versionId, bookId, chapter });
    return verses;
  }
);

export const searchVerses = createAsyncThunk(
  'bible/searchVerses',
  async ({ query, versionId }: { query: string; versionId?: string }) => {
    const verses = await databaseIPC.searchVerses({ query, versionId });
    return verses;
  }
);

// Initial state
const initialState: BibleState = {
  translations: [],
  versions: [],
  books: [],
  selectedTranslation: null,
  selectedVersion: null,
  selectedBook: null,
  selectedChapter: null,
  verses: [],
  searchResults: [],
  loading: false,
  error: null,
};

// Slice
const bibleSlice = createSlice({
  name: 'bible',
  initialState,
  reducers: {
    setSelectedTranslation: (state, action: PayloadAction<string>) => {
      state.selectedTranslation = action.payload;
      // Clear version and verses when translation changes
      state.selectedVersion = null;
      state.verses = [];
      state.selectedChapter = null;
    },
    setSelectedVersion: (state, action: PayloadAction<string>) => {
      state.selectedVersion = action.payload;
      // Clear verses when version changes
      state.verses = [];
      state.selectedChapter = null;
    },
    setSelectedBook: (state, action: PayloadAction<number>) => {
      state.selectedBook = action.payload;
      // Clear verses when book changes
      state.verses = [];
      state.selectedChapter = null;
    },
    setSelectedChapter: (state, action: PayloadAction<number>) => {
      state.selectedChapter = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load translations
    builder
      .addCase(loadTranslations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTranslations.fulfilled, (state, action) => {
        state.loading = false;
        state.translations = action.payload;
        // Set default translation if none selected
        if (!state.selectedTranslation && action.payload.length > 0) {
          const defaultTranslation = action.payload.find((t: Translation) => t.isDefault) || action.payload[0];
          state.selectedTranslation = defaultTranslation.id;
        }
      })
      .addCase(loadTranslations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load translations';
      });

    // Load versions
    builder
      .addCase(loadVersions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadVersions.fulfilled, (state, action) => {
        state.loading = false;
        state.versions = action.payload;
        // Set default version if none selected
        if (!state.selectedVersion && action.payload.length > 0) {
          const defaultVersion = action.payload.find((v: Version) => v.isDefault) || action.payload[0];
          state.selectedVersion = defaultVersion.id;
        }
      })
      .addCase(loadVersions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load versions';
      });

    // Load books
    builder
      .addCase(loadBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload;
      })
      .addCase(loadBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load books';
      });

    // Load verses
    builder
      .addCase(loadVerses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadVerses.fulfilled, (state, action) => {
        state.loading = false;
        state.verses = action.payload;
      })
      .addCase(loadVerses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load verses';
      });

    // Search verses
    builder
      .addCase(searchVerses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchVerses.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchVerses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search verses';
      });
  },
});

export const {
  setSelectedTranslation,
  setSelectedVersion,
  setSelectedBook,
  setSelectedChapter,
  clearSearchResults,
  clearError,
} = bibleSlice.actions;

export default bibleSlice.reducer; 