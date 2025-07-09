import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit3, 
  FiTrash2, 
  FiEye,
  FiTag,
  FiBookOpen,
  FiClock,
  FiType,
  FiAlignLeft
} from 'react-icons/fi';
import { 
  fetchNotes, 
  searchNotes, 
  deleteNote, 
  setCurrentNote,
  setSearchQuery,
  setSelectedCategory,
  setSelectedTags,
  setSortBy,
  setSortOrder,
  clearFilters,
  fetchCategories,
  fetchTags,
  selectNotes,
  selectCurrentNote,
  selectCategories,
  selectTags,
  selectLoading,
  selectError,
  selectSearchQuery,
  selectSelectedCategory,
  selectSelectedTags,
  selectSortBy,
  selectSortOrder,
  selectIsDeleting
} from '../lib/notesSlice';
import { RootState, AppDispatch } from '../lib/store';
import { Note } from '../services/NotesService';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import NoteForm from '../components/notes/NoteForm';
import NotePreview from '../components/notes/NotePreview';

const NotesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const notes = useSelector(selectNotes);
  const currentNote = useSelector(selectCurrentNote);
  const categories = useSelector(selectCategories);
  const tags = useSelector(selectTags);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const searchQuery = useSelector(selectSearchQuery);
  const selectedCategory = useSelector(selectSelectedCategory);
  const selectedTags = useSelector(selectSelectedTags);
  const sortBy = useSelector(selectSortBy);
  const sortOrder = useSelector(selectSortOrder);
  const isDeleting = useSelector(selectIsDeleting);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [noteToPreview, setNoteToPreview] = useState<Note | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };

  // Load notes and metadata on component mount
  useEffect(() => {
    dispatch(fetchNotes({}));
    dispatch(fetchCategories());
    dispatch(fetchTags());
  }, [dispatch]);

  // Handle search
  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
    if (query.trim()) {
      dispatch(searchNotes(query));
    } else {
      dispatch(fetchNotes({}));
    }
  };

  // Handle category filter
  const handleCategoryFilter = (category: string | null) => {
    dispatch(setSelectedCategory(category));
    applyFilters();
  };

  // Handle tag filter
  const handleTagFilter = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    dispatch(setSelectedTags(newTags));
    applyFilters();
  };

  // Handle sort
  const handleSort = (field: 'title' | 'createdAt' | 'updatedAt' | 'lastUsed') => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    dispatch(setSortBy(field));
    dispatch(setSortOrder(newOrder));
    applyFilters();
  };

  // Apply filters
  const applyFilters = () => {
    const options = {
      category: selectedCategory || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      search: searchQuery,
      sortBy,
      sortOrder,
    };
    dispatch(fetchNotes(options));
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
    dispatch(fetchNotes({}));
  };

  // Handle note creation
  const handleCreateNote = () => {
    setNoteToEdit(null);
    setShowCreateForm(true);
  };

  // Handle note editing
  const handleEditNote = (note: Note) => {
    setNoteToEdit(note);
    dispatch(setCurrentNote(note));
    setShowEditForm(true);
  };

  // Handle note deletion
  const handleDeleteNote = (note: Note) => {
    setNoteToDelete(note);
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (noteToDelete) {
      dispatch(deleteNote(noteToDelete.id));
      setNoteToDelete(null);
    }
  };

  // Handle note preview
  const handlePreviewNote = (note: Note) => {
    dispatch(setCurrentNote(note));
    setNoteToPreview(note);
    setShowPreview(true);
  };

  // Handle form close
  const handleFormClose = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setNoteToEdit(null);
    // Refresh notes after form close
    dispatch(fetchNotes({}));
  };

  // Handle preview close
  const handlePreviewClose = () => {
    setShowPreview(false);
    setNoteToPreview(null);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get content preview
  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        className="max-w-7xl mx-auto mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiBookOpen className="text-3xl text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notes
            </h1>
          </div>
          <Button
            onClick={handleCreateNote}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
          >
            <FiPlus /> Create Note
          </Button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          className="max-w-7xl mx-auto mb-6"
          variants={itemVariants}
        >
          <Alert className="bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <span className="font-medium">Error:</span> {error}
          </Alert>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        className="max-w-7xl mx-auto mb-8"
        variants={itemVariants}
      >
        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2 px-4 py-3"
            >
              <FiFilter />
              Filters
              {(selectedCategory || selectedTags.length > 0) && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {(selectedCategory ? 1 : 0) + selectedTags.length}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {(selectedCategory || selectedTags.length > 0 || searchQuery) && (
              <Button
                onClick={handleClearFilters}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCategoryFilter(null)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        !selectedCategory
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagFilter(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FiTag className="inline mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Sort By
                  </h3>
                  <div className="space-y-2">
                    {[
                      { field: 'title', label: 'Title' },
                      { field: 'createdAt', label: 'Created' },
                      { field: 'updatedAt', label: 'Updated' },
                      { field: 'lastUsed', label: 'Last Used' },
                    ].map(({ field, label }) => (
                      <button
                        key={field}
                        onClick={() => handleSort(field as any)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          sortBy === field
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {label}
                        {sortBy === field && (
                          <span className="ml-2 text-xs">
                            {sortOrder === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Notes Grid */}
      <motion.div
        className="max-w-7xl mx-auto"
        variants={itemVariants}
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <motion.div
            className="text-center py-12"
            variants={itemVariants}
          >
            <FiBookOpen className="mx-auto text-6xl text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No notes found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery || selectedCategory || selectedTags.length > 0
                ? 'Try adjusting your filters or search query'
                : 'Create your first note to get started'
              }
            </p>
            <Button
              onClick={handleCreateNote}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              <FiPlus /> Create Your First Note
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                variants={cardVariants}
                whileHover="hover"
              >
                <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  {/* Note Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {note.type === 'text' ? (
                          <FiType className="text-blue-500" />
                        ) : (
                          <FiAlignLeft className="text-green-500" />
                        )}
                        <span className="capitalize">{note.type}</span>
                        {note.category && (
                          <>
                            <span>•</span>
                            <span>{note.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note Content Preview */}
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                      {getContentPreview(note.content)}
                    </p>
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs px-2 py-1"
                        >
                          #{tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs px-2 py-1">
                          +{note.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Note Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <FiClock />
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePreviewNote(note)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                    >
                      <FiEye />
                      Preview
                    </Button>
                    <Button
                      onClick={() => handleEditNote(note)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                    >
                      <FiEdit3 />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteNote(note)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      disabled={isDeleting}
                    >
                      <FiTrash2 />
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Note
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{noteToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setNoteToDelete(null)}
                variant="outline"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Note Form Modals */}
      <NoteForm
        isOpen={showCreateForm}
        onClose={handleFormClose}
        noteToEdit={null}
      />

      <NoteForm
        isOpen={showEditForm}
        onClose={handleFormClose}
        noteToEdit={noteToEdit}
      />

      {/* Note Preview Modal */}
      <NotePreview
        note={noteToPreview}
        isOpen={showPreview}
        onClose={handlePreviewClose}
      />
    </motion.div>
  );
};

export default NotesPage; 