import React, { useState, useEffect } from 'react';
import scriptureService from '../services/scriptureService';
import { Scripture, Verse } from '../database/models/bible';

interface ScriptureListProps {
  bibleId: string;
  onScriptureSelect: (scripture: Scripture) => void;
}

// Book names for reference
const BOOK_NAMES = [
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

// Build a list of common Bible references
const generateCommonReferences = () => {
  const references: { book: string; chapter: number; verse: number; reference: string }[] = [];
  
  // Genesis 1:1-10
  for (let verse = 1; verse <= 10; verse++) {
    references.push({
      book: 'Genesis',
      chapter: 1,
      verse,
      reference: `Genesis 1:${verse}`
    });
  }
  
  // Add some common verses from different books
  const commonVerses = [
    { book: 'John', chapter: 3, verse: 16 },
    { book: 'Psalms', chapter: 23, verse: 1 },
    { book: 'Romans', chapter: 8, verse: 28 },
    { book: 'Philippians', chapter: 4, verse: 13 },
    { book: 'Jeremiah', chapter: 29, verse: 11 },
  ];
  
  commonVerses.forEach(({ book, chapter, verse }) => {
    references.push({
      book,
      chapter,
      verse,
      reference: `${book} ${chapter}:${verse}`
    });
  });
  
  return references.sort((a, b) => {
    // Sort by book index first
    const bookIndexA = BOOK_NAMES.indexOf(a.book);
    const bookIndexB = BOOK_NAMES.indexOf(b.book);
    
    if (bookIndexA !== bookIndexB) {
      return bookIndexA - bookIndexB;
    }
    
    // Then by chapter
    if (a.chapter !== b.chapter) {
      return a.chapter - b.chapter;
    }
    
    // Then by verse
    return a.verse - b.verse;
  });
};

const ScriptureList: React.FC<ScriptureListProps> = ({ bibleId, onScriptureSelect }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentBook, setCurrentBook] = useState('Genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  
  // Load Genesis 1:1 by default
  useEffect(() => {
    if (bibleId) {
      loadChapterVerses('Genesis', 1);
      handleScriptureSelect('Genesis', 1, 1);
    }
  }, [bibleId]);
  
  // Load verses for a chapter
  const loadChapterVerses = async (book: string, chapter: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find book number
      const bookIndex = BOOK_NAMES.findIndex(b => 
        b.toLowerCase() === book.toLowerCase()
      );
      
      if (bookIndex === -1) {
        throw new Error(`Book "${book}" not found`);
      }
      
      const bookNumber = bookIndex + 1;
      
      // Get all verses in the chapter (use a high verse number to get all)
      const scripture = await scriptureService.getScripture(
        bibleId,
        bookNumber,
        chapter,
        1,   // From verse 1
        200  // To a high number to get all verses
      );
      
      if (!scripture || !scripture.verses || scripture.verses.length === 0) {
        throw new Error(`No verses found in ${book} ${chapter}`);
      }
      
      setChapterVerses(scripture.verses);
      setCurrentBook(book);
      setCurrentChapter(chapter);
    } catch (err) {
      console.error('Error loading chapter verses:', err);
      setError('Failed to load chapter verses');
      setChapterVerses([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting a verse
  const handleScriptureSelect = async (book: string, chapter: number, verse: number) => {
    if (!bibleId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const reference = `${book} ${chapter}:${verse}`;
      const scripture = await scriptureService.getScriptureByReference(bibleId, reference);
      
      if (!scripture) {
        throw new Error('Scripture not found');
      }
      
      setSelectedVerse(verse);
      onScriptureSelect(scripture);
      
      // If we haven't loaded this chapter yet, load all its verses
      if (book !== currentBook || chapter !== currentChapter) {
        loadChapterVerses(book, chapter);
      }
    } catch (err) {
      console.error('Error fetching scripture:', err);
      setError('Failed to load scripture');
    } finally {
      setLoading(false);
    }
  };
  
  // Parse the search term and navigate to that reference
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      // Try to parse the search term as a reference
      const parsedRef = scriptureService.parseReference(searchTerm);
      
      if (parsedRef) {
        // If it's a complete reference (book, chapter, verse)
        const bookName = BOOK_NAMES[parsedRef.book - 1];
        handleScriptureSelect(bookName, parsedRef.chapter, parsedRef.fromVerse);
        return;
      }
      
      // If it's just a book name (like "John")
      const bookIndex = BOOK_NAMES.findIndex(book => 
        book.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (bookIndex !== -1) {
        const bookName = BOOK_NAMES[bookIndex];
        loadChapterVerses(bookName, 1);
        handleScriptureSelect(bookName, 1, 1);
        return;
      }
      
      // If it might be a book and chapter (like "John 3")
      const parts = searchTerm.trim().split(/\s+/);
      if (parts.length === 2) {
        const potentialBook = parts[0];
        const potentialChapter = parseInt(parts[1], 10);
        
        if (!isNaN(potentialChapter)) {
          const bookIndex = BOOK_NAMES.findIndex(book => 
            book.toLowerCase() === potentialBook.toLowerCase()
          );
          
          if (bookIndex !== -1) {
            const bookName = BOOK_NAMES[bookIndex];
            loadChapterVerses(bookName, potentialChapter);
            handleScriptureSelect(bookName, potentialChapter, 1);
            return;
          }
        }
      }
      
      setError('Could not parse search term. Try a format like "John 3:16" or "Genesis 1"');
    } catch (err) {
      console.error('Error parsing search:', err);
      setError('Could not parse search term');
    }
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Bible Verses</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-800 rounded text-sm">
          {error}
        </div>
      )}
      
      <div className="mb-4 flex">
        <input
          type="text"
          placeholder="Search (e.g., Genesis 1:1, John 3:16, John)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 p-2 border rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
        >
          Go
        </button>
      </div>
      
      {/* Show current verse context */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h4 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
          {currentBook} {currentChapter}
        </h4>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : chapterVerses.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {chapterVerses.map((verse) => (
              <li 
                key={verse.verse} 
                className={`py-2 ${verse.verse === selectedVerse ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 pl-2' : ''}`}
              >
                <button
                  onClick={() => handleScriptureSelect(currentBook, currentChapter, verse.verse)}
                  className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium mr-2">{verse.verse}</span>
                  <span className="text-gray-800 dark:text-gray-200">{verse.text}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            No verses found for {currentBook} {currentChapter}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptureList; 