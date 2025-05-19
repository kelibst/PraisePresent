import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiSearch, 
  FiBook, 
  FiFilter, 
  FiChevronLeft, 
  FiChevronRight, 
  FiBookOpen, 
  FiList, 
  FiSettings,
  FiPlus
} from 'react-icons/fi';

// Mock data for Bible books - this would come from your database
const bibleBooks = [
  { id: 'genesis', name: 'Genesis', chapters: 50 },
  { id: 'exodus', name: 'Exodus', chapters: 40 },
  { id: 'leviticus', name: 'Leviticus', chapters: 27 },
  // ...many more books
  { id: 'john', name: 'John', chapters: 21 },
  { id: 'romans', name: 'Romans', chapters: 16 },
  { id: 'revelation', name: 'Revelation', chapters: 22 },
];

// Mock translations
const translations = [
  { id: 'kjv', name: 'King James Version' },
  { id: 'niv', name: 'New International Version' },
  { id: 'esv', name: 'English Standard Version' },
  { id: 'nlt', name: 'New Living Translation' },
];

// Mock scripture verses
const getScripture = (reference: string) => {
  if (reference.includes('John 3:16')) {
    return {
      text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16",
      translation: "NIV"
    };
  }
  
  // Default to John 3:16-17 if no match
  return {
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. For God did not send his Son into the world to condemn the world, but to save the world through him.",
    reference: "John 3:16-17",
    translation: "NIV"
  };
};

interface SearchResult {
  id: string;
  reference: string;
  text: string;
  translation: string;
}

const ScripturePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('john');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [selectedVerses, setSelectedVerses] = useState('16');
  const [selectedTranslation, setSelectedTranslation] = useState('niv');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'reference' | 'keyword' | 'topic'>('reference');
  const [currentScripture, setCurrentScripture] = useState(getScripture('John 3:16'));
  const [showSettings, setShowSettings] = useState(false);
  
  // Handle search
  const handleSearch = () => {
    if (activeTab === 'reference') {
      const reference = `${bibleBooks.find(b => b.id === selectedBook)?.name} ${selectedChapter}:${selectedVerses}`;
      setCurrentScripture(getScripture(reference));
      setSearchResults([{ 
        id: '1', 
        reference, 
        text: getScripture(reference).text.substring(0, 60) + '...',
        translation: selectedTranslation
      }]);
    } else {
      // Mock search results for keyword or topic search
      setSearchResults([
        { 
          id: '1', 
          reference: 'John 3:16', 
          text: "For God so loved the world that he gave his one and only Son...",
          translation: 'NIV'
        },
        { 
          id: '2', 
          reference: 'Romans 5:8', 
          text: "But God demonstrates his own love for us in this: While we were still sinners...",
          translation: 'NIV'
        },
        { 
          id: '3', 
          reference: '1 John 4:9', 
          text: "This is how God showed his love among us: He sent his one and only Son...",
          translation: 'NIV'
        },
      ]);
    }
  };
  
  const handleResultClick = (result: SearchResult) => {
    setCurrentScripture(getScripture(result.reference));
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Scripture Library</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <FiPlus /> Add to Presentation
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Scripture search panel */}
        <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          {/* Search tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
            <button 
              className={`flex-1 py-2 text-center ${activeTab === 'reference' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 dark:text-slate-400'}`}
              onClick={() => setActiveTab('reference')}
            >
              Reference
            </button>
            <button 
              className={`flex-1 py-2 text-center ${activeTab === 'keyword' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 dark:text-slate-400'}`}
              onClick={() => setActiveTab('keyword')}
            >
              Keyword
            </button>
            <button 
              className={`flex-1 py-2 text-center ${activeTab === 'topic' ? 'border-b-2 border-primary text-primary' : 'text-slate-600 dark:text-slate-400'}`}
              onClick={() => setActiveTab('topic')}
            >
              Topic
            </button>
          </div>
            
          {/* Search controls */}
          {activeTab === 'reference' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Book</label>
                <select 
                  className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-md py-2 px-3 border border-slate-300 dark:border-slate-600"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                >
                  {bibleBooks.map(book => (
                    <option key={book.id} value={book.id}>{book.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Chapter</label>
                  <select 
                    className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-md py-2 px-3 border border-slate-300 dark:border-slate-600"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                  >
                    {[...Array(bibleBooks.find(b => b.id === selectedBook)?.chapters || 1)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Verse(s)</label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-md py-2 px-3 border border-slate-300 dark:border-slate-600" 
                    placeholder="e.g. 1-5, 8"
                    value={selectedVerses}
                    onChange={(e) => setSelectedVerses(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Translation</label>
                <select 
                  className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-md py-2 px-3 border border-slate-300 dark:border-slate-600"
                  value={selectedTranslation}
                  onChange={(e) => setSelectedTranslation(e.target.value)}
                >
                  {translations.map(translation => (
                    <option key={translation.id} value={translation.id}>{translation.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiSearch className="text-slate-400" />
              </span>
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={activeTab === 'keyword' ? "Search by keywords..." : "Search by topics..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          
          <button 
            className="w-full py-2 bg-primary text-white rounded-md mt-4"
            onClick={handleSearch}
          >
            Search Scripture
          </button>
          
          {/* Search results */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-3">Results</h3>
            <div className="overflow-y-auto max-h-[calc(100vh-350px)]">
              {searchResults.map(result => (
                <div 
                  key={result.id}
                  className="p-3 rounded-lg mb-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="font-medium text-slate-800 dark:text-white">{result.reference}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{result.text}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{result.translation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Scripture display panel */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          {currentScripture ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {currentScripture.reference}
                </h2>
                <div className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                  {currentScripture.translation}
                </div>
              </div>
              
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                  {currentScripture.text}
                </p>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Font Size</label>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        -
                      </button>
                      <span className="text-slate-800 dark:text-white">18px</span>
                      <button className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Background</label>
                    <div className="flex space-x-2">
                      <div className="w-6 h-6 bg-white border border-slate-300 rounded-full cursor-pointer"></div>
                      <div className="w-6 h-6 bg-black rounded-full cursor-pointer"></div>
                      <div className="w-6 h-6 bg-blue-600 rounded-full cursor-pointer"></div>
                      <div className="w-6 h-6 bg-slate-100 rounded-full cursor-pointer flex items-center justify-center text-xs">
                        +
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-primary text-white rounded-md font-medium flex items-center justify-center gap-2">
                  <FiPlus /> Add to Presentation
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FiBook size={48} className="mb-4 opacity-40" />
              <p className="text-xl">Select a passage to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScripturePage; 