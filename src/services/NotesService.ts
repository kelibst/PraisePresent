// Types for notes operations (matching the main process types)
export interface CreateNoteRequest {
  title: string;
  description?: string;
  content: string;
  type: 'text' | 'richtext';
  styling?: NoteTextStyling;
  richTextBlocks?: RichTextBlock[];
  tags?: string[];
  category?: string;
  userId?: string;
}

export interface UpdateNoteRequest {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  type?: 'text' | 'richtext';
  styling?: NoteTextStyling;
  richTextBlocks?: RichTextBlock[];
  tags?: string[];
  category?: string;
}

export interface NoteTextStyling {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  textColor?: string;
  backgroundColor?: string;
  lineHeight?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  textEffects?: any;
  typography?: any;
}

export interface RichTextBlock {
  type: string;
  content: any;
  styling?: any;
}

export interface Note {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: 'text' | 'richtext';
  styling?: NoteTextStyling;
  richTextBlocks?: RichTextBlock[];
  tags?: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  presentationId: string;
  slideId: string;
  userId?: string;
}

export interface NotesListOptions {
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'lastUsed';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  userId?: string;
}

// Notes service functions using IPC
export const createNote = async (request: CreateNoteRequest): Promise<Note> => {
  const result = await window.electron.notes.create(request);
  if (!result.success || !result.note) {
    throw new Error(result.error || 'Failed to create note');
  }
  return result.note;
};

export const getNotes = async (options: NotesListOptions = {}): Promise<Note[]> => {
  const result = await window.electron.notes.list(options);
  if (!result.success || !result.notes) {
    throw new Error(result.error || 'Failed to fetch notes');
  }
  return result.notes;
};

export const getNoteById = async (id: string): Promise<Note | null> => {
  const result = await window.electron.notes.getById(id);
  if (!result.success) {
    if (result.error === 'Note not found') {
      return null;
    }
    throw new Error(result.error || 'Failed to fetch note');
  }
  return result.note || null;
};

export const updateNote = async (request: UpdateNoteRequest): Promise<Note> => {
  const result = await window.electron.notes.update(request);
  if (!result.success || !result.note) {
    throw new Error(result.error || 'Failed to update note');
  }
  return result.note;
};

export const deleteNote = async (id: string): Promise<boolean> => {
  const result = await window.electron.notes.delete(id);
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete note');
  }
  return true;
};

export const getNotesByCategory = async (category: string): Promise<Note[]> => {
  return getNotes({ category });
};

export const getNotesByTags = async (tags: string[]): Promise<Note[]> => {
  return getNotes({ tags });
};

export const searchNotes = async (query: string): Promise<Note[]> => {
  const result = await window.electron.notes.search(query);
  if (!result.success || !result.notes) {
    throw new Error(result.error || 'Failed to search notes');
  }
  return result.notes;
};

export const getCategories = async (): Promise<string[]> => {
  const result = await window.electron.notes.getCategories();
  if (!result.success || !result.categories) {
    throw new Error(result.error || 'Failed to fetch categories');
  }
  return result.categories;
};

export const getTags = async (): Promise<string[]> => {
  const result = await window.electron.notes.getTags();
  if (!result.success || !result.tags) {
    throw new Error(result.error || 'Failed to fetch tags');
  }
  return result.tags;
};

// Default export for compatibility
export default {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getNotesByCategory,
  getNotesByTags,
  searchNotes,
  getCategories,
  getTags,
}; 