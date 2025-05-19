import { Bible, Scripture } from '../database/models/bible';

// Mock Bible data
const MOCK_BIBLES: Bible[] = [
  { id: 'kjv', name: 'King James Version', abbreviation: 'KJV', language: 'English', hasStrongs: false },
  { id: 'niv', name: 'New International Version', abbreviation: 'NIV', language: 'English', hasStrongs: false },
  { id: 'esv', name: 'English Standard Version', abbreviation: 'ESV', language: 'English', hasStrongs: false },
  { id: 'nasb', name: 'New American Standard Bible', abbreviation: 'NASB', language: 'English', hasStrongs: false },
  { id: 'nlt', name: 'New Living Translation', abbreviation: 'NLT', language: 'English', hasStrongs: false },
];

// Mock verse data for John 3:16 for different translations
const MOCK_VERSES: Record<string, Record<string, any>> = {
  'kjv': {
    'john316': {
      reference: 'John 3:16',
      verses: [
        { id: 1, bibleId: 'kjv', book: 43, chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' }
      ],
      translation: 'KJV'
    },
    'rom828': {
      reference: 'Romans 8:28',
      verses: [
        { id: 2, bibleId: 'kjv', book: 45, chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' }
      ],
      translation: 'KJV'
    }
  },
  'niv': {
    'john316': {
      reference: 'John 3:16',
      verses: [
        { id: 1, bibleId: 'niv', book: 43, chapter: 3, verse: 16, text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' }
      ],
      translation: 'NIV'
    }
  },
  'esv': {
    'john316': {
      reference: 'John 3:16',
      verses: [
        { id: 1, bibleId: 'esv', book: 43, chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' }
      ],
      translation: 'ESV'
    }
  }
};

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
    // Return mock Bible data instead of using the database
    return Promise.resolve(MOCK_BIBLES);
  }

  public async getBibleById(id: string): Promise<Bible | undefined> {
    const bibles = await this.getAllBibles();
    return bibles.find(bible => bible.id === id);
  }

  public async getScripture(bibleId: string, book: number, chapter: number, fromVerse: number, toVerse: number): Promise<Scripture | null> {
    // For simplicity, we'll just return John 3:16 for any request
    // In a real implementation, this would use the parameters to query the database
    const bookName = this.bookNames[book - 1]?.toLowerCase() || 'john';
    const key = `${bookName}${chapter}${fromVerse}`;
    
    console.log(`Mock getScripture: ${bibleId}, key: ${key}`);
    
    const mockTranslation = MOCK_VERSES[bibleId] || MOCK_VERSES['kjv'];
    const mockVerse = mockTranslation[key] || mockTranslation['john316']; // Default to John 3:16
    
    return Promise.resolve(mockVerse);
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