import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  NotesListOptions,
  createNote as createNoteService,
  getNotes as getNotesService,
  getNoteById as getNoteByIdService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService,
  searchNotes as searchNotesService,
  getCategories as getCategoriesService,
  getTags as getTagsService,
  getNotesByCategory as getNotesByCategoryService,
  getNotesByTags as getNotesByTagsService
} from '../services/NotesService';

// Async thunks for notes operations
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (options: NotesListOptions = {}) => {
    return await getNotesService(options);
  }
);

export const fetchNoteById = createAsyncThunk(
  'notes/fetchNoteById',
  async (id: string) => {
    return await getNoteByIdService(id);
  }
);

export const createNote = createAsyncThunk(
  'notes/createNote',
  async (request: CreateNoteRequest) => {
    return await createNoteService(request);
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async (request: UpdateNoteRequest) => {
    return await updateNoteService(request);
  }
);

export const deleteNote = createAsyncThunk(
  'notes/deleteNote',
  async (id: string) => {
    await deleteNoteService(id);
    return id;
  }
);

export const searchNotes = createAsyncThunk(
  'notes/searchNotes',
  async (query: string) => {
    return await searchNotesService(query);
  }
);

export const fetchCategories = createAsyncThunk(
  'notes/fetchCategories',
  async () => {
    return await getCategoriesService();
  }
);

export const fetchTags = createAsyncThunk(
  'notes/fetchTags',
  async () => {
    return await getTagsService();
  }
);

export const fetchNotesByCategory = createAsyncThunk(
  'notes/fetchNotesByCategory',
  async (category: string) => {
    return await getNotesByCategoryService(category);
  }
);

export const fetchNotesByTags = createAsyncThunk(
  'notes/fetchNotesByTags',
  async (tags: string[]) => {
    return await getNotesByTagsService(tags);
  }
);

// Initial state
interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  categories: string[];
  tags: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'lastUsed';
  sortOrder: 'asc' | 'desc';
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

const initialState: NotesState = {
  notes: [],
  currentNote: null,
  categories: [],
  tags: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
  selectedTags: [],
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
};

// Notes slice
const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set current note
    setCurrentNote: (state, action: PayloadAction<Note | null>) => {
      state.currentNote = action.payload;
    },
    
    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Set selected category
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    
    // Set selected tags
    setSelectedTags: (state, action: PayloadAction<string[]>) => {
      state.selectedTags = action.payload;
    },
    
    // Set sort options
    setSortBy: (state, action: PayloadAction<'title' | 'createdAt' | 'updatedAt' | 'lastUsed'>) => {
      state.sortBy = action.payload;
    },
    
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = null;
      state.selectedTags = [];
    },
    
    // Reset state
    resetNotesState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Fetch notes
    builder.addCase(fetchNotes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotes.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = action.payload;
      state.error = null;
    });
    builder.addCase(fetchNotes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch notes';
    });

    // Fetch note by ID
    builder.addCase(fetchNoteById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNoteById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentNote = action.payload;
      state.error = null;
    });
    builder.addCase(fetchNoteById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch note';
    });

    // Create note
    builder.addCase(createNote.pending, (state) => {
      state.isCreating = true;
      state.error = null;
    });
    builder.addCase(createNote.fulfilled, (state, action) => {
      state.isCreating = false;
      state.notes.unshift(action.payload);
      state.currentNote = action.payload;
      state.error = null;
    });
    builder.addCase(createNote.rejected, (state, action) => {
      state.isCreating = false;
      state.error = action.error.message || 'Failed to create note';
    });

    // Update note
    builder.addCase(updateNote.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(updateNote.fulfilled, (state, action) => {
      state.isUpdating = false;
      const index = state.notes.findIndex(note => note.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
      if (state.currentNote && state.currentNote.id === action.payload.id) {
        state.currentNote = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updateNote.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.error.message || 'Failed to update note';
    });

    // Delete note
    builder.addCase(deleteNote.pending, (state) => {
      state.isDeleting = true;
      state.error = null;
    });
    builder.addCase(deleteNote.fulfilled, (state, action) => {
      state.isDeleting = false;
      state.notes = state.notes.filter(note => note.id !== action.payload);
      if (state.currentNote && state.currentNote.id === action.payload) {
        state.currentNote = null;
      }
      state.error = null;
    });
    builder.addCase(deleteNote.rejected, (state, action) => {
      state.isDeleting = false;
      state.error = action.error.message || 'Failed to delete note';
    });

    // Search notes
    builder.addCase(searchNotes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(searchNotes.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = action.payload;
      state.error = null;
    });
    builder.addCase(searchNotes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to search notes';
    });

    // Fetch categories
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });

    // Fetch tags
    builder.addCase(fetchTags.fulfilled, (state, action) => {
      state.tags = action.payload;
    });

    // Fetch notes by category
    builder.addCase(fetchNotesByCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotesByCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = action.payload;
      state.error = null;
    });
    builder.addCase(fetchNotesByCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch notes by category';
    });

    // Fetch notes by tags
    builder.addCase(fetchNotesByTags.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotesByTags.fulfilled, (state, action) => {
      state.loading = false;
      state.notes = action.payload;
      state.error = null;
    });
    builder.addCase(fetchNotesByTags.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch notes by tags';
    });
  },
});

// Export actions
export const {
  clearError,
  setCurrentNote,
  setSearchQuery,
  setSelectedCategory,
  setSelectedTags,
  setSortBy,
  setSortOrder,
  clearFilters,
  resetNotesState,
} = notesSlice.actions;

// Export reducer
export default notesSlice.reducer;

// Selectors
export const selectNotes = (state: { notes: NotesState }) => state.notes.notes;
export const selectCurrentNote = (state: { notes: NotesState }) => state.notes.currentNote;
export const selectCategories = (state: { notes: NotesState }) => state.notes.categories;
export const selectTags = (state: { notes: NotesState }) => state.notes.tags;
export const selectLoading = (state: { notes: NotesState }) => state.notes.loading;
export const selectError = (state: { notes: NotesState }) => state.notes.error;
export const selectSearchQuery = (state: { notes: NotesState }) => state.notes.searchQuery;
export const selectSelectedCategory = (state: { notes: NotesState }) => state.notes.selectedCategory;
export const selectSelectedTags = (state: { notes: NotesState }) => state.notes.selectedTags;
export const selectSortBy = (state: { notes: NotesState }) => state.notes.sortBy;
export const selectSortOrder = (state: { notes: NotesState }) => state.notes.sortOrder;
export const selectIsCreating = (state: { notes: NotesState }) => state.notes.isCreating;
export const selectIsUpdating = (state: { notes: NotesState }) => state.notes.isUpdating;
export const selectIsDeleting = (state: { notes: NotesState }) => state.notes.isDeleting; 