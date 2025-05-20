import { Bible, Scripture, Verse } from '../database/models/bible';

// Type guard to check if database API is available
function isDatabaseApiAvailable(): boolean {
  return !!(window.electronAPI && 'database' in window.electronAPI && window.electronAPI.database);
}

class ScriptureService {
  // Book names used for parsing references
  private bookNames = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
    'James', '1 Peter', '2 Peter', '1 John', '2 John',
    '3 John', 'Jude', 'Revelation'
  ];

  public async getAllBibles(): Promise<Bible[]> {
    try {
      // Use Electron IPC to get Bibles from the database
      if (isDatabaseApiAvailable() && window.electronAPI.database.getBibles) {
        try {
          const bibles = await window.electronAPI.database.getBibles();
          if (bibles && bibles.length > 0) {
            return bibles;
          }
          // Fall back to mock data if getBibles returned empty array
          console.warn('No Bibles returned from database, using fallback mock data');
        } catch (error) {
          console.error('Error calling getBibles:', error);
          console.warn('Database API call failed, using fallback mock data');
        }
      } else {
        console.warn('Electron database API not available, using fallback mock data');
      }
      
      // Fallback for development without Electron or if database call failed
      return [
        { id: 'kjv', name: 'King James Version', abbreviation: 'KJV', language: 'English', hasStrongs: false },
        { id: 'niv', name: 'New International Version', abbreviation: 'NIV', language: 'English', hasStrongs: false },
        { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV', language: 'English', hasStrongs: false },
        { id: 'nasb', name: 'New American Standard Bible', abbreviation: 'NASB', language: 'English', hasStrongs: false },
        { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT', language: 'English', hasStrongs: false },
      ];
    } catch (error) {
      console.error('Error getting Bibles:', error);
      return [];
    }
  }

  public async getBibleById(id: string): Promise<Bible | undefined> {
    const bibles = await this.getAllBibles();
    return bibles.find(bible => bible.id === id);
  }

  public async getScripture(bibleId: string, book: number, chapter: number, fromVerse: number, toVerse: number): Promise<Scripture | null> {
    try {
      // Use Electron IPC to get scripture from the database
      if (isDatabaseApiAvailable() && window.electronAPI.database.getScripture) {
        try {
          const scripture = await window.electronAPI.database.getScripture(bibleId, book, chapter, fromVerse, toVerse);
          if (scripture) {
            return scripture;
          }
          // Fall back to mock if getScripture returned null
          console.warn('No scripture returned from database, using fallback mock data');
        } catch (error) {
          console.error('Error calling getScripture:', error);
          console.warn('Database API call failed, using fallback mock data');
        }
      } else {
        console.warn('Electron database API not available, using fallback mock data');
      }
      
      // Generate a mock chapter for development without Electron or if database call failed
      return this.generateMockChapter(book, chapter, this.getEstimatedVerseCount(book, chapter), bibleId);
    } catch (error) {
      console.error('Error getting scripture:', error);
      return null;
    }
  }

  // Estimate verse count for common books and chapters
  private getEstimatedVerseCount(book: number, chapter: number): number {
    // Genesis 1 has 31 verses
    if (book === 1 && chapter === 1) return 31;
    // John 3 has 36 verses
    if (book === 43 && chapter === 3) return 36;
    // Psalm 119 has 176 verses
    if (book === 19 && chapter === 119) return 176;
    // Default to 25 verses for other chapters
    return 25;
  }

  // Generate mock chapter data for development without Electron
  private generateMockChapter(book: number, chapter: number, verseCount: number, bibleId: string): Scripture {
    const bookName = this.bookNames[book - 1] || `Book ${book}`;
    const verses: Verse[] = [];
    
    for (let i = 1; i <= verseCount; i++) {
      verses.push({
        id: i,
        bibleId: bibleId,
        book: book,
        chapter: chapter,
        verse: i,
        text: `This is verse ${i} of ${bookName} chapter ${chapter}. Mock text for demonstration purposes.`
      });
    }
    
    // Special cases for well-known verses
    if (book === 1 && chapter === 1 && verseCount >= 1) {
      // Genesis 1:1
      verses[0].text = 'In the beginning God created the heaven and the earth.';
    }
    
    if (book === 43 && chapter === 3 && verseCount >= 16) {
      // John 3:16
      verses[15].text = 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.';
    }
    
    if (book === 43 && chapter === 11 && verseCount >= 35) {
      // John 11:35 (shortest verse)
      verses[34].text = 'Jesus wept.';
    }
    
    return {
      reference: `${bookName} ${chapter}`,
      verses: verses,
      translation: bibleId.toUpperCase()
    };
  }

  // Parse a scripture reference like "John 3:16" or "Genesis 1:1-10"
  public parseReference(reference: string): { book: number; chapter: number; fromVerse: number; toVerse: number } | null {
    try {
      // Basic regex to match common scripture references
      const regex = /^(\d*\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/;
      const match = reference.match(regex);
      
      if (!match) {
        return null;
      }
      
      const bookName = match[1].trim();
      const chapter = parseInt(match[2], 10);
      const fromVerse = parseInt(match[3], 10);
      const toVerse = match[4] ? parseInt(match[4], 10) : fromVerse;
      
      // Find book number by name
      const bookIndex = this.findBookIndex(bookName);
      if (bookIndex === -1) {
        return null;
      }
      
      return {
        book: bookIndex + 1,
        chapter,
        fromVerse,
        toVerse
      };
    } catch (error) {
      console.error('Error parsing reference:', error);
      return null;
    }
  }

  public async getScriptureByReference(bibleId: string, reference: string): Promise<Scripture | null> {
    const parsedRef = this.parseReference(reference);
    if (!parsedRef) {
      return null;
    }
    
    return this.getScripture(
      bibleId,
      parsedRef.book,
      parsedRef.chapter,
      parsedRef.fromVerse,
      parsedRef.toVerse
    );
  }

  // Helper to find book index by name
  private findBookIndex(name: string): number {
    // Normalize name for comparison (lowercase, remove numbers and spaces)
    const normalized = name.toLowerCase().replace(/\d+\s+/, '');
    
    return this.bookNames.findIndex(book => {
      // Remove numeric prefix for comparison
      const bookNormalized = book.toLowerCase().replace(/\d+\s+/, '');
      return bookNormalized === normalized;
    });
  }
}

export default new ScriptureService(); 