import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiSave, 
  FiX, 
  FiType, 
  FiAlignLeft, 
  FiTag, 
  FiFolder,
  FiPlus,
  FiMinus
} from 'react-icons/fi';
import { 
  createNote, 
  updateNote, 
  setCurrentNote,
  selectCurrentNote,
  selectIsCreating,
  selectIsUpdating,
  selectCategories,
  selectTags
} from '../../lib/notesSlice';
import { AppDispatch } from '../../lib/store';
import { 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  Note,
  NoteTextStyling
} from '../../services/NotesService';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: Note | null;
}

const NoteForm: React.FC<NoteFormProps> = ({ isOpen, onClose, noteToEdit }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentNote = useSelector(selectCurrentNote);
  const isCreating = useSelector(selectIsCreating);
  const isUpdating = useSelector(selectIsUpdating);
  const existingCategories = useSelector(selectCategories);
  const existingTags = useSelector(selectTags);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'text' as 'text' | 'richtext',
    category: '',
    tags: [] as string[],
    styling: {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      textAlign: 'left',
      textColor: '#000000',
      backgroundColor: 'transparent',
      lineHeight: 1.5,
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    } as NoteTextStyling
  });

  const [newTag, setNewTag] = useState('');
  const [showAdvancedStyling, setShowAdvancedStyling] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Initialize form with note data if editing
  useEffect(() => {
    if (noteToEdit) {
      setFormData({
        title: noteToEdit.title,
        description: noteToEdit.description || '',
        content: noteToEdit.content,
        type: noteToEdit.type,
        category: noteToEdit.category || '',
        tags: noteToEdit.tags || [],
        styling: noteToEdit.styling || formData.styling
      });
    } else {
      // Reset form for new note
      setFormData({
        title: '',
        description: '',
        content: '',
        type: 'text',
        category: '',
        tags: [],
        styling: {
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          textAlign: 'left',
          textColor: '#000000',
          backgroundColor: 'transparent',
          lineHeight: 1.5,
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        }
      });
    }
    setErrors({});
  }, [noteToEdit, isOpen]);

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (noteToEdit) {
        // Update existing note
        const updateRequest: UpdateNoteRequest = {
          id: noteToEdit.id,
          title: formData.title,
          description: formData.description || undefined,
          content: formData.content,
          type: formData.type,
          styling: formData.styling,
          tags: formData.tags,
          category: formData.category || undefined
        };
        await dispatch(updateNote(updateRequest)).unwrap();
      } else {
        // Create new note
        const createRequest: CreateNoteRequest = {
          title: formData.title,
          description: formData.description || undefined,
          content: formData.content,
          type: formData.type,
          styling: formData.styling,
          tags: formData.tags,
          category: formData.category || undefined
        };
        await dispatch(createNote(createRequest)).unwrap();
      }

      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle styling changes
  const handleStylingChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      styling: { ...prev.styling, [field]: value }
    }));
  };

  // Handle padding changes
  const handlePaddingChange = (side: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        padding: { ...prev.styling.padding!, [side]: value }
      }
    }));
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Add existing tag
  const addExistingTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {noteToEdit ? 'Edit Note' : 'Create New Note'}
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FiX size={20} />
            </Button>
          </div>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Basic Information */}
          <motion.div variants={fieldVariants}>
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter note title..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Optional description..."
                />
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('type', 'text')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      formData.type === 'text'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiType />
                    Simple Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('type', 'richtext')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      formData.type === 'richtext'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiAlignLeft />
                    Rich Text
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Content */}
          <motion.div variants={fieldVariants}>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Content
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {formData.type === 'text' ? 'Text Content' : 'Rich Text Content'} *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={formData.type === 'text' ? 8 : 12}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-vertical ${
                    errors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={formData.type === 'text' 
                    ? 'Enter your note content here...' 
                    : 'Enter your rich text content here. You can use HTML formatting if needed...'
                  }
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
                )}
                {formData.type === 'richtext' && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Rich text support includes formatting, bullet points, and basic HTML elements.
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Organization */}
          <motion.div variants={fieldVariants}>
            <Card className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Organization
              </h3>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiFolder className="inline mr-1" />
                  Category
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter category..."
                  />
                </div>
                {existingCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingCategories.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleInputChange('category', category)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.category === category
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FiTag className="inline mr-1" />
                  Tags
                </label>
                
                {/* Add new tag */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Add a tag..."
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    className="px-3 py-2"
                  >
                    <FiPlus />
                  </Button>
                </div>

                {/* Current tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                        >
                          <FiMinus size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Existing tags */}
                {existingTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingTags
                      .filter(tag => !formData.tags.includes(tag))
                      .map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addExistingTag(tag)}
                          className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Styling Options */}
          {formData.type === 'text' && (
            <motion.div variants={fieldVariants}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Text Styling
                  </h3>
                  <Button
                    type="button"
                    onClick={() => setShowAdvancedStyling(!showAdvancedStyling)}
                    variant="outline"
                    size="sm"
                  >
                    {showAdvancedStyling ? 'Hide Advanced' : 'Show Advanced'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Font Size
                    </label>
                    <select
                      value={formData.styling.fontSize}
                      onChange={(e) => handleStylingChange('fontSize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="12px">12px</option>
                      <option value="14px">14px</option>
                      <option value="16px">16px</option>
                      <option value="18px">18px</option>
                      <option value="20px">20px</option>
                      <option value="24px">24px</option>
                      <option value="28px">28px</option>
                      <option value="32px">32px</option>
                      <option value="36px">36px</option>
                      <option value="48px">48px</option>
                    </select>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Font Family
                    </label>
                    <select
                      value={formData.styling.fontFamily}
                      onChange={(e) => handleStylingChange('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Times New Roman, serif">Times New Roman</option>
                      <option value="Courier New, monospace">Courier New</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                    </select>
                  </div>

                  {/* Text Align */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Text Alignment
                    </label>
                    <select
                      value={formData.styling.textAlign}
                      onChange={(e) => handleStylingChange('textAlign', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
                    </select>
                  </div>

                  {showAdvancedStyling && (
                    <>
                      {/* Font Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Font Weight
                        </label>
                        <select
                          value={formData.styling.fontWeight}
                          onChange={(e) => handleStylingChange('fontWeight', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="lighter">Lighter</option>
                          <option value="bolder">Bolder</option>
                        </select>
                      </div>

                      {/* Text Color */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={formData.styling.textColor}
                          onChange={(e) => handleStylingChange('textColor', e.target.value)}
                          className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                      </div>

                      {/* Background Color */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={formData.styling.backgroundColor === 'transparent' ? '#ffffff' : formData.styling.backgroundColor}
                          onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                          className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                      </div>

                      {/* Line Height */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Line Height: {formData.styling.lineHeight}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.1"
                          value={formData.styling.lineHeight}
                          onChange={(e) => handleStylingChange('lineHeight', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Padding */}
                      <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Padding
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Top</label>
                            <input
                              type="number"
                              value={formData.styling.padding?.top || 20}
                              onChange={(e) => handlePaddingChange('top', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Right</label>
                            <input
                              type="number"
                              value={formData.styling.padding?.right || 20}
                              onChange={(e) => handlePaddingChange('right', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bottom</label>
                            <input
                              type="number"
                              value={formData.styling.padding?.bottom || 20}
                              onChange={(e) => handlePaddingChange('bottom', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Left</label>
                            <input
                              type="number"
                              value={formData.styling.padding?.left || 20}
                              onChange={(e) => handlePaddingChange('left', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            variants={fieldVariants}
            className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 -mx-6 -mb-6"
          >
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="px-6 py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <FiSave />
                {isCreating || isUpdating 
                  ? (noteToEdit ? 'Updating...' : 'Creating...') 
                  : (noteToEdit ? 'Update Note' : 'Create Note')
                }
              </Button>
            </div>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default NoteForm; 