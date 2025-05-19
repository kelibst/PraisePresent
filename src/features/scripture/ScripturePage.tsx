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

const ScripturePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('john');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [selectedVerses, setSelectedVerses] = useState('16');
  const [selectedTranslation, setSelectedTranslation] = useState('niv');
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
  
  const handleResultClick = (result: any) => {
    setCurrentScripture(getScripture(result.reference));
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-xl">PraisePresent</span>
          <div className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">
            Live: Sunday 9am Service
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition">
            Go Live
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Scripture search */}
        <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <FiBook className="mr-2" /> Scripture
              </h2>
              <button 
                className="p-2 rounded-full hover:bg-slate-700 transition"
                onClick={() => setShowSettings(!showSettings)}
              >
                <FiSettings />
              </button>
            </div>
            
            {/* Search tabs */}
            <div className="flex border-b border-slate-700 mb-4">
              <button 
                className={`flex-1 py-2 text-center ${activeTab === 'reference' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
                onClick={() => setActiveTab('reference')}
              >
                Reference
              </button>
              <button 
                className={`flex-1 py-2 text-center ${activeTab === 'keyword' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
                onClick={() => setActiveTab('keyword')}
              >
                Keyword
              </button>
              <button 
                className={`flex-1 py-2 text-center ${activeTab === 'topic' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
                onClick={() => setActiveTab('topic')}
              >
                Topic
              </button>
            </div>
            
            {/* Search controls */}
            {activeTab === 'reference' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Book</label>
                  <select 
                    className="w-full bg-slate-700 text-white rounded-md py-2 px-3"
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
                    <label className="block text-sm text-slate-400 mb-1">Chapter</label>
                    <select 
                      className="w-full bg-slate-700 text-white rounded-md py-2 px-3"
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                    >
                      {[...Array(bibleBooks.find(b => b.id === selectedBook)?.chapters || 1)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-400 mb-1">Verse(s)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-700 text-white rounded-md py-2 px-3" 
                      placeholder="e.g. 1-5, 8"
                      value={selectedVerses}
                      onChange={(e) => setSelectedVerses(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full bg-slate-700 text-white rounded-md py-2 pl-10 pr-4" 
                  placeholder={activeTab === 'keyword' ? "Search by keyword..." : "Search by topic..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            
            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-1">Translation</label>
              <select 
                className="w-full bg-slate-700 text-white rounded-md py-2 px-3"
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value)}
              >
                {translations.map(trans => (
                  <option key={trans.id} value={trans.id}>{trans.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              className="w-full mt-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
              onClick={handleSearch}
            >
              <FiSearch className="mr-2" /> Search
            </button>
          </div>
          
          {/* Search results */}
          <div className="flex-1 p-4 border-t border-slate-700 overflow-y-auto">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Results</h3>
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map(result => (
                  <div 
                    key={result.id}
                    className="p-3 rounded-md bg-slate-700 hover:bg-slate-600 cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="text-sm font-medium text-blue-400">{result.reference} ({result.translation.toUpperCase()})</div>
                    <div className="text-sm mt-1">{result.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 mt-4">
                <FiBookOpen className="w-8 h-8 mx-auto mb-2" />
                <p>Search for scripture</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Main content - Scripture view */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          {/* Presenter view */}
          <div className="flex-1 p-6 overflow-hidden relative">
            <div className="absolute top-2 right-2 text-xs text-slate-500">Presenter</div>
            <div className="text-center mt-4">
              <h2 className="text-xl mb-6">Current Slide</h2>
              
              <div className="max-w-3xl mx-auto bg-slate-800 p-12 rounded-lg shadow-lg">
                <div className="text-2xl mb-6">{currentScripture.text}</div>
                <div className="text-lg text-slate-400 mb-4">{currentScripture.reference} ({currentScripture.translation.toUpperCase()})</div>
                
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <div className="flex items-center text-blue-400">
                    <FiBookOpen className="mr-2" />
                    <span>Notes: Emphasize "one and only Son"</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between max-w-md mx-auto mt-6">
                <div className="flex items-center text-slate-400">
                  <FiFilter className="mr-1" />
                  <span className="text-sm">06:12 elapsed</span>
                </div>
                <div className="flex items-center">
                  <button className="p-2 rounded-full hover:bg-slate-800">
                    <FiChevronLeft />
                  </button>
                  <button className="p-2 rounded-full hover:bg-slate-800">
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Service plan */}
          <div className="bg-slate-800 border-t border-slate-700 p-2">
            <div className="flex items-center">
              <div className="flex items-center px-4 py-2">
                <FiList className="mr-2" />
                <span className="font-medium">Worship Service Plan</span>
                <span className="ml-3 text-xs text-slate-400">May 19, 2024</span>
              </div>
              <div className="flex items-center ml-auto">
                <button className="p-1 text-sm border border-slate-600 rounded mr-2 hover:bg-slate-700">
                  <FiPlus className="inline mr-1" /> New Item
                </button>
                <button className="p-1 text-sm border border-slate-600 rounded hover:bg-slate-700 text-red-400">
                  Clear Plan
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right panel - Audience view */}
        <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-bold">Audience</h3>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="border border-dashed border-slate-600 rounded-lg w-full h-4/5 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="uppercase tracking-widest text-sm mb-6">For God so loved the world</div>
                <div className="text-xl mb-4">
                  FOR GOD SO LOVED THE WORLD THAT HE GAVE HIS ONE AND ONLY SON...
                </div>
              </div>
            </div>
          </div>
          
          {/* Remote control */}
          <div className="p-4 border-t border-slate-700">
            <div className="bg-slate-700 rounded-md p-3">
              <div className="text-sm mb-2">Mobile Remote Control</div>
              <div className="text-xs text-slate-400">Current Slide:</div>
              <div className="text-sm truncate">For God so loved the world...</div>
              
              <div className="flex justify-between mt-3">
                <button className="p-2 rounded hover:bg-slate-600">
                  <FiChevronLeft />
                </button>
                <button className="p-2 rounded hover:bg-slate-600">
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScripturePage; 