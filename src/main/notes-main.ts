import { ipcMain } from 'electron';
import { prisma } from '../services/prisma';

// Types for notes operations
export interface CreateNoteRequest {
  title: string;
  description?: string;
  content: string;
  type: 'text' | 'richtext';
  styling?: any;
  richTextBlocks?: any[];
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
  styling?: any;
  richTextBlocks?: any[];
  tags?: string[];
  category?: string;
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

export interface Note {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: 'text' | 'richtext';
  styling?: any;
  richTextBlocks?: any[];
  tags?: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  presentationId: string;
  slideId: string;
  userId?: string;
}

// Default styling for notes
const defaultTextStyling = {
  fontSize: '24px',
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
  },
  textEffects: null,
  typography: null
};

const defaultSlideStyling = {
  background: {
    type: 'color',
    color: '#ffffff'
  },
  layout: {
    type: 'default',
    padding: 20
  },
  effects: null,
  transitions: null
};

// Helper function to map database note to Note interface
const mapPresentationToNote = (presentation: any): Note => {
  const slide = presentation.slides?.[0];
  const textContent = slide?.textContent;
  const richTextContent = slide?.richTextContent;

  return {
    id: presentation.id,
    title: presentation.title,
    description: presentation.description,
    content: presentation.note?.content || '',
    type: presentation.note?.type || slide?.type || 'text',
    styling: textContent ? {
      fontSize: textContent.fontSize,
      fontFamily: textContent.fontFamily,
      fontWeight: textContent.fontWeight,
      textAlign: textContent.textAlign,
      textColor: textContent.textColor,
      backgroundColor: textContent.backgroundColor,
      lineHeight: textContent.lineHeight,
      padding: textContent.padding,
      textEffects: textContent.textEffects,
      typography: textContent.typography
    } : richTextContent?.styling || defaultTextStyling,
    richTextBlocks: richTextContent?.blocks || [],
    tags: presentation.note?.tags ? JSON.parse(presentation.note.tags) : [],
    category: presentation.note?.category,
    createdAt: presentation.createdAt,
    updatedAt: presentation.updatedAt,
    lastUsed: presentation.lastUsed,
    presentationId: presentation.id,
    slideId: slide?.id || '',
    userId: presentation.note?.userId
  };
};

// Create note
ipcMain.handle('notes:create', async (event, request: CreateNoteRequest) => {
  try {
    const styling = { ...defaultTextStyling, ...request.styling };
    
    // Create presentation for the note
    const presentation = await prisma.presentation.create({
      data: {
        title: request.title,
        description: request.description || null,
        status: 'draft',
        metadata: {
          type: 'note',
          category: request.category || 'general',
          tags: request.tags || [],
          contentType: request.type
        }
      }
    });

    // Create note
    const note = await prisma.note.create({
      data: {
        title: request.title,
        content: request.content,
        category: request.category,
        tags: JSON.stringify(request.tags || []),
        userId: request.userId || null
      }
    });

    // Link presentation to note
    await prisma.presentation.update({
      where: { id: presentation.id },
      data: { noteId: note.id }
    });

    // Create slide for the note content
    const slide = await prisma.slide.create({
      data: {
        presentationId: presentation.id,
        type: request.type,
        content: {
          text: request.content,
          ...styling
        },
        order: 1,
        styling: defaultSlideStyling,
        animations: {},
        transitions: {}
      }
    });

    // Create content based on type
    if (request.type === 'text') {
      await prisma.textContent.create({
        data: {
          slideId: slide.id,
          text: request.content,
          fontSize: styling.fontSize || '24px',
          fontFamily: styling.fontFamily || 'Arial, sans-serif',
          fontWeight: styling.fontWeight || 'normal',
          textAlign: styling.textAlign || 'left',
          textColor: styling.textColor || '#000000',
          backgroundColor: styling.backgroundColor || 'transparent',
          lineHeight: styling.lineHeight || 1.5,
          padding: styling.padding || { top: 20, right: 20, bottom: 20, left: 20 },
          textEffects: styling.textEffects || null,
          typography: styling.typography || null
        }
      });
    } else if (request.type === 'richtext') {
      await prisma.richTextContent.create({
        data: {
          slideId: slide.id,
          blocks: request.richTextBlocks || [],
          styling: styling,
          formatting: {},
          version: '1.0.0',
          metadata: {
            contentType: 'note',
            category: request.category
          }
        }
      });
    }

    // Fetch and return the created note
    const createdPresentation = await prisma.presentation.findUnique({
      where: { id: presentation.id },
      include: {
        note: true,
        slides: {
          include: {
            textContent: true,
            richTextContent: true
          }
        }
      }
    });

    return { success: true, note: mapPresentationToNote(createdPresentation) };
  } catch (error) {
    console.error('Failed to create note:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create note' 
    };
  }
});

// Get notes
ipcMain.handle('notes:list', async (event, options: NotesListOptions = {}) => {
  try {
    const {
      category,
      tags,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      limit,
      offset,
      userId
    } = options;

    const where: any = {
      noteId: { not: null }
    };

    if (userId) {
      where.note = { userId };
    }

    if (category) {
      where.note = { ...where.note, category };
    }

    if (tags && tags.length > 0) {
      where.note = {
        ...where.note,
        tags: {
          contains: tags[0] // Simple implementation for one tag
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { note: { content: { contains: search } } }
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'lastUsed') {
      orderBy.lastUsed = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const presentations = await prisma.presentation.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        note: true,
        slides: {
          include: {
            textContent: true,
            richTextContent: true
          }
        }
      }
    });

    const notes = presentations.map(mapPresentationToNote);
    return { success: true, notes };
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch notes' 
    };
  }
});

// Get note by ID
ipcMain.handle('notes:getById', async (event, id: string) => {
  try {
    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        note: true,
        slides: {
          include: {
            textContent: true,
            richTextContent: true
          }
        }
      }
    });

    if (!presentation) {
      return { success: false, error: 'Note not found' };
    }

    return { success: true, note: mapPresentationToNote(presentation) };
  } catch (error) {
    console.error('Failed to fetch note:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch note' 
    };
  }
});

// Update note
ipcMain.handle('notes:update', async (event, request: UpdateNoteRequest) => {
  try {
    const { id, ...updateData } = request;

    // Get existing presentation
    const existingPresentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        note: true,
        slides: {
          include: {
            textContent: true,
            richTextContent: true
          }
        }
      }
    });

    if (!existingPresentation || !existingPresentation.note) {
      return { success: false, error: 'Note not found' };
    }

    const styling = { ...defaultTextStyling, ...updateData.styling };

    // Update presentation
    await prisma.presentation.update({
      where: { id },
      data: {
        title: updateData.title || existingPresentation.title,
        description: updateData.description !== undefined ? updateData.description : existingPresentation.description,
        updatedAt: new Date(),
        metadata: {
          type: 'note',
          category: updateData.category || existingPresentation.note.category,
          tags: updateData.tags || JSON.parse(existingPresentation.note.tags || '[]'),
          contentType: updateData.type || existingPresentation.slides[0]?.type || 'text'
        }
      }
    });

    // Update note
    await prisma.note.update({
      where: { id: existingPresentation.note.id },
      data: {
        title: updateData.title || existingPresentation.note.title,
        content: updateData.content || existingPresentation.note.content,
        category: updateData.category || existingPresentation.note.category,
        tags: updateData.tags ? JSON.stringify(updateData.tags) : existingPresentation.note.tags,
        updatedAt: new Date()
      }
    });

    // Update slide content if provided
    if (updateData.content || updateData.styling || updateData.type) {
      const slide = existingPresentation.slides[0];
      if (slide) {
        await prisma.slide.update({
          where: { id: slide.id },
          data: {
            type: updateData.type || slide.type,
            content: {
              text: updateData.content || existingPresentation.note.content,
              ...styling
            },
            updatedAt: new Date()
          }
        });

        // Update content based on type
        if (updateData.type === 'text' || (!updateData.type && slide.type === 'text')) {
          if (slide.textContent) {
            await prisma.textContent.update({
              where: { id: slide.textContent.id },
              data: {
                text: updateData.content || slide.textContent.text,
                fontSize: styling.fontSize || slide.textContent.fontSize,
                fontFamily: styling.fontFamily || slide.textContent.fontFamily,
                fontWeight: styling.fontWeight || slide.textContent.fontWeight,
                textAlign: styling.textAlign || slide.textContent.textAlign,
                textColor: styling.textColor || slide.textContent.textColor,
                backgroundColor: styling.backgroundColor || slide.textContent.backgroundColor,
                lineHeight: styling.lineHeight || slide.textContent.lineHeight,
                padding: styling.padding || slide.textContent.padding,
                textEffects: styling.textEffects || slide.textContent.textEffects,
                typography: styling.typography || slide.textContent.typography
              }
            });
          }
        } else if (updateData.type === 'richtext' || (!updateData.type && slide.type === 'richtext')) {
          if (slide.richTextContent) {
            await prisma.richTextContent.update({
              where: { id: slide.richTextContent.id },
              data: {
                blocks: updateData.richTextBlocks || slide.richTextContent.blocks || [],
                styling: styling,
                metadata: {
                  contentType: 'note',
                  category: updateData.category || existingPresentation.note.category
                }
              }
            });
          }
        }
      }
    }

    // Fetch and return the updated note
    const updatedPresentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        note: true,
        slides: {
          include: {
            textContent: true,
            richTextContent: true
          }
        }
      }
    });

    return { success: true, note: mapPresentationToNote(updatedPresentation) };
  } catch (error) {
    console.error('Failed to update note:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update note' 
    };
  }
});

// Delete note
ipcMain.handle('notes:delete', async (event, id: string) => {
  try {
    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: { note: true }
    });

    if (!presentation) {
      return { success: false, error: 'Note not found' };
    }

    // Delete presentation (cascades to slides and content)
    await prisma.presentation.delete({
      where: { id }
    });

    // Delete note if it exists
    if (presentation.note) {
      await prisma.note.delete({
        where: { id: presentation.note.id }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete note:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete note' 
    };
  }
});

// Search notes
ipcMain.handle('notes:search', async (event, query: string) => {
  try {
    const presentations = await prisma.presentation.findMany({
      where: {
        noteId: { not: null },
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { note: { content: { contains: query } } }
        ]
      },
      include: {
        note: true,
        slides: {
          include: {
            textContent: true,
            richTextContent: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const notes = presentations.map(mapPresentationToNote);
    return { success: true, notes };
  } catch (error) {
    console.error('Failed to search notes:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search notes' 
    };
  }
});

// Get categories
ipcMain.handle('notes:getCategories', async () => {
  try {
    const categories = await prisma.note.findMany({
      select: { category: true },
      where: { category: { not: null } },
      distinct: ['category']
    });

    const categoryList = categories
      .map(item => item.category)
      .filter(Boolean)
      .sort();

    return { success: true, categories: categoryList };
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch categories' 
    };
  }
});

// Get tags
ipcMain.handle('notes:getTags', async () => {
  try {
    const notes = await prisma.note.findMany({
      select: { tags: true },
      where: { tags: { not: null } }
    });

    const allTags = new Set<string>();
    notes.forEach(note => {
      if (note.tags) {
        try {
          const tags = JSON.parse(note.tags);
          if (Array.isArray(tags)) {
            tags.forEach(tag => allTags.add(tag));
          }
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    });

    const tagList = Array.from(allTags).sort();
    return { success: true, tags: tagList };
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch tags' 
    };
  }
});

console.log('📝 Notes IPC handlers registered'); 