import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMaximize2, FiMinimize2, FiMonitor } from 'react-icons/fi';
import { SlideRenderer } from '../rendering/SlideRenderer';
import { Slide, SlideTheme } from '@/services/RenderingEngine';
import { Note } from '@/services/NotesService';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface NotePreviewProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: SlideTheme;
}

export const NotePreview: React.FC<NotePreviewProps> = ({
  note,
  isOpen,
  onClose,
  theme
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slide, setSlide] = useState<Slide | null>(null);

  // Convert note to slide format
  useEffect(() => {
    if (!note) {
      setSlide(null);
      return;
    }

    const convertedSlide: Slide = {
      id: note.slideId,
      type: note.type,
      content: note.type === 'text' ? {
        text: note.content,
        fontSize: note.styling?.fontSize || '24px',
        fontFamily: note.styling?.fontFamily || 'Arial, sans-serif',
        fontWeight: note.styling?.fontWeight || 'normal',
        textAlign: note.styling?.textAlign || 'left',
        textColor: note.styling?.textColor || '#000000',
        backgroundColor: note.styling?.backgroundColor || 'transparent',
        lineHeight: note.styling?.lineHeight || 1.5,
        padding: note.styling?.padding || { top: 20, right: 20, bottom: 20, left: 20 },
        textEffects: note.styling?.textEffects || undefined,
        typography: note.styling?.typography || undefined
      } : {
        blocks: note.richTextBlocks || [],
        styling: note.styling || {},
        formatting: {},
        version: '1.0.0',
        metadata: {
          contentType: 'note',
          category: note.category
        }
      },
      order: 1,
      styling: {
        background: {
          type: 'color',
          color: '#ffffff'
        },
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        effects: {
          shadow: {
            color: '#000000',
            x: 0,
            y: 0,
            blur: 0,
            spread: 0,
            opacity: 0.5,
            blur: 0,
            spread: 0,
            opacity: 0.5
          }
        },
        transitions: {}
      },
      animations: undefined,
      transitions: undefined
    };

    setSlide(convertedSlide);
  }, [note]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'F11') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const sendToLiveDisplay = () => {
    if (!note || !slide) return;
    
    // This would integrate with the live display system
    console.log('Sending note to live display:', note.title);
    
    // Create a custom event to send to live display
    const liveContentEvent = new CustomEvent('live-content-update', {
      detail: {
        type: 'slide',
        slide: slide,
        title: note.title,
        content: note.content
      }
    });
    
    window.dispatchEvent(liveContentEvent);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (!isOpen || !note) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <motion.div
          className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden ${
            isFullscreen 
              ? 'w-full h-full rounded-none' 
              : 'w-11/12 h-5/6 max-w-6xl max-h-4xl'
          }`}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {note.title}
                </h2>
                {note.category && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    {note.category}
                  </span>
                )}
              </div>
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={sendToLiveDisplay}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
              >
                <FiMonitor />
                Send to Live
              </Button>
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <FiX />
                Close
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-6">
              <Card className="w-full h-full shadow-inner bg-gray-50 dark:bg-gray-800">
                {slide ? (
                  <SlideRenderer
                    slide={slide}
                    theme={theme}
                    isActive={true}
                    className="note-preview-slide"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <div className="text-lg font-medium mb-2">Loading preview...</div>
                      <div className="text-sm">Please wait while the note is being rendered.</div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>Type: <span className="font-medium capitalize">{note.type}</span></span>
                <span>Created: <span className="font-medium">{new Date(note.createdAt).toLocaleDateString()}</span></span>
                <span>Updated: <span className="font-medium">{new Date(note.updatedAt).toLocaleDateString()}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Press F11 for fullscreen • ESC to close</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotePreview; 