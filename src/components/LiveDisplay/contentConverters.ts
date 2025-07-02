import { UniversalSlide } from "../../lib/universalSlideSlice";
import { convertVerseToSlide, convertSongSlideToSlide, convertNoteToSlide } from "../../lib/slideConverters";
import { LiveContent, LiveDisplayTheme } from "./types";

/**
 * Converts LiveContent to UniversalSlide format
 */
export const convertContentToSlide = (content: LiveContent): UniversalSlide | null => {
  if (!content || content.type === 'black' || content.type === 'logo') {
    return null;
  }

  // If already a universal slide, return it
  if (content.type === 'universal-slide' && content.universalSlide) {
    return content.universalSlide;
  }

  // Convert based on content type
  switch (content.type) {
    case 'scripture':
      return convertScriptureContent(content);
    
    case 'song':
      return convertSongContent(content);
    
    case 'announcement':
    case 'media':
    case 'slide':
      return convertNoteToSlide(
        content.title || 'Untitled',
        content.content || ''
      );
    
    case 'placeholder':
      return convertPlaceholderContent(content);
    
    default:
      return convertNoteToSlide(
        content.title || 'Content',
        content.content || ''
      );
  }
};

/**
 * Converts scripture content to UniversalSlide
 */
const convertScriptureContent = (content: LiveContent): UniversalSlide => {
  const mockVerse = {
    id: `verse-${Date.now()}`,
    bookId: 1,
    chapter: parseInt(content.reference?.split(':')[0]?.split(' ').pop() || '1'),
    verse: parseInt(content.reference?.split(':')[1] || '1'),
    text: content.content || content.verse || '',
    versionId: 'kjv',
    book: {
      id: 1,
      name: content.title?.split(' ')[0] || 'Unknown',
      shortName: content.title?.split(' ')[0] || 'Unknown',
      testament: 'unknown',
      category: 'unknown',
      chapters: 1,
      order: 1
    },
    version: {
      id: 'kjv',
      name: content.translation || content.subtitle || 'Unknown',
      fullName: content.translation || content.subtitle || 'Unknown',
      translationId: 'kjv',
      isDefault: true
    }
  };
  return convertVerseToSlide(mockVerse, content.translation || content.subtitle);
};

/**
 * Converts song content to UniversalSlide
 */
const convertSongContent = (content: LiveContent): UniversalSlide => {
  const mockSong = {
    id: `song-${Date.now()}`,
    title: content.title || 'Untitled Song',
    artist: content.subtitle || '',
    author: content.subtitle || '',
    lyrics: Array.isArray(content.lines) ? content.lines.join('\n') : (content.content || ''),
    structure: { slides: [], order: [] },
    key: '',
    tempo: '',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  };
  
  const mockSongSlide = {
    id: `slide-${Date.now()}`,
    type: 'verse' as const,
    title: content.title || 'Verse 1',
    content: Array.isArray(content.lines) ? content.lines.join('\n') : (content.content || '')
  };
  
  return convertSongSlideToSlide(mockSong, mockSongSlide);
};

/**
 * Converts placeholder content to UniversalSlide
 */
const convertPlaceholderContent = (content: LiveContent): UniversalSlide => {
  const placeholderText = content.content?.mainText || content.title || 'Live Display Ready';
  const placeholderSubtext = content.content?.subText || 'Waiting for content...';
  const timestamp = content.content?.timestamp ? `Ready since ${content.content.timestamp}` : '';
  
  const fullPlaceholderContent = [
    placeholderText,
    placeholderSubtext,
    timestamp
  ].filter(Boolean).join('\n\n');

  return convertNoteToSlide('🎵 PraisePresent', fullPlaceholderContent);
};

/**
 * Applies theme to a slide while preserving slide properties
 */
export const applyThemeToSlide = (slide: UniversalSlide, theme: LiveDisplayTheme): UniversalSlide => {
  return {
    ...slide,
    background: {
      type: 'gradient' as const,
      colors: ['#1e1e1e', '#000000'],
      opacity: 1
    },
    textFormatting: {
      ...slide.textFormatting,
      contentFont: {
        ...slide.textFormatting?.contentFont,
        color: theme.textColor
      },
      titleFont: {
        ...slide.textFormatting?.titleFont,
        color: theme.referenceColor
      }
    }
  };
};

/**
 * Creates a fallback placeholder slide when no content is available
 */
export const createFallbackSlide = (theme: LiveDisplayTheme): UniversalSlide => {
  return {
    id: 'fallback-placeholder',
    type: 'note',
    title: '🎵 PraisePresent',
    subtitle: '',
    content: {
      text: 'Ready for Presentation\n\nWaiting for content...'
    },
    template: {
      id: 'placeholder-template',
      name: 'Placeholder',
      category: 'content',
      layout: {
        titlePosition: 'center',
        contentAlignment: 'center',
        backgroundOpacity: 1,
        padding: 40,
        margins: { top: 60, right: 60, bottom: 60, left: 60 }
      },
      defaultStyling: {
        titleFont: {
          family: theme.fontFamily,
          size: 64,
          weight: 'light',
          color: theme.referenceColor
        },
        contentFont: {
          family: theme.fontFamily,
          size: 48,
          weight: 'light',
          color: theme.textColor,
          lineHeight: 1.4
        }
      }
    },
    background: {
      type: 'gradient',
      colors: ['#1e1e1e', '#000000'],
      opacity: 1
    },
    textFormatting: {
      contentFont: {
        family: theme.fontFamily,
        size: 48,
        color: theme.textColor,
        weight: 'light',
        lineHeight: 1.4
      },
      titleFont: {
        family: theme.fontFamily,
        size: 64,
        color: theme.referenceColor,
        weight: 'light'
      }
    },
    metadata: {
      usageCount: 0,
      tags: ['placeholder'],
      category: 'placeholder'
    },
    transitions: {
      enter: 'fade',
      exit: 'fade',
      duration: 500
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}; 