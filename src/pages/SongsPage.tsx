import React, { useState } from 'react';
import { FiSearch, FiMusic, FiPlus, FiEdit, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define the types for our data structure
interface Verse {
  type: string;
  content: string;
}

interface Song {
  id: string;
  title: string;
  author: string;
  ccli: string;
  category: string;
  lastUsed: string;
  verses: Verse[];
}

// Mock data for songs
const mockSongs: Song[] = [
  {
    id: '1',
    title: 'How Great Is Our God',
    author: 'Chris Tomlin',
    ccli: '4348399',
    category: 'Worship',
    lastUsed: '2024-05-01',
    verses: [
      { type: 'verse', content: 'The splendor of a King, clothed in majesty\nLet all the earth rejoice, all the earth rejoice\nHe wraps Himself in light, and darkness tries to hide\nAnd trembles at His voice, trembles at His voice' },
      { type: 'chorus', content: 'How great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God' },
      { type: 'verse', content: 'Age to age He stands, and time is in His hands\nBeginning and the end, beginning and the end\nThe Godhead Three in One, Father, Spirit, Son\nThe Lion and the Lamb, the Lion and the Lamb' },
    ]
  },
  {
    id: '2',
    title: 'Amazing Grace',
    author: 'John Newton',
    ccli: '1037882',
    category: 'Hymn',
    lastUsed: '2024-04-24',
    verses: [
      { type: 'verse', content: 'Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see' }
    ]
  },
  {
    id: '3',
    title: '10,000 Reasons',
    author: 'Matt Redman',
    ccli: '6016351',
    category: 'Worship',
    lastUsed: '2024-05-07',
    verses: [
      { type: 'chorus', content: 'Bless the Lord, O my soul\nO my soul, worship His holy name\nSing like never before, O my soul\nI\'ll worship Your holy name' }
    ]
  },
];

const SongsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'worship' | 'hymns'>('all');
  
  // Filter songs based on search query and filter
  const filteredSongs = mockSongs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         song.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'recent') return matchesSearch && new Date(song.lastUsed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (activeFilter === 'worship') return matchesSearch && song.category === 'Worship';
    if (activeFilter === 'hymns') return matchesSearch && song.category === 'Hymn';
    
    return matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Songs Library</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <FiPlus /> Add New Song
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Song list panel */}
        <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="text-slate-400" />
            </span>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            <button 
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeFilter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
              onClick={() => setActiveFilter('all')}
            >
              All Songs
            </button>
            <button 
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeFilter === 'recent' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
              onClick={() => setActiveFilter('recent')}
            >
              Recently Used
            </button>
            <button 
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeFilter === 'worship' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
              onClick={() => setActiveFilter('worship')}
            >
              Worship
            </button>
            <button 
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${activeFilter === 'hymns' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
              onClick={() => setActiveFilter('hymns')}
            >
              Hymns
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            {filteredSongs.map(song => (
              <div 
                key={song.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  selectedSong?.id === song.id 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                onClick={() => setSelectedSong(song)}
              >
                <div className="font-medium">{song.title}</div>
                <div className="text-xs opacity-75 mt-1 flex justify-between">
                  <span>{song.author}</span>
                  <span>CCLI: {song.ccli}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Song details panel */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          {selectedSong ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedSong.title}</h2>
                <div className="flex space-x-2">
                  <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <FiEdit size={18} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500">
                    <FiTrash2 size={18} />
                  </button>
                  <button className="px-4 py-2 bg-primary text-white rounded-md">
                    Present
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Author</div>
                  <div className="font-medium text-slate-800 dark:text-white">{selectedSong.author}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">CCLI Number</div>
                  <div className="font-medium text-slate-800 dark:text-white flex items-center">
                    {selectedSong.ccli}
                    <a href="#" className="ml-2 text-primary hover:text-primary-dark">
                      <FiExternalLink size={14} />
                    </a>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Last Used</div>
                  <div className="font-medium text-slate-800 dark:text-white">{selectedSong.lastUsed}</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Lyrics</h3>
                {selectedSong.verses.map((verse: Verse, index: number) => (
                  <div key={index} className="mb-6">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 uppercase font-medium">{verse.type}</div>
                    <div className="whitespace-pre-line text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                      {verse.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FiMusic size={48} className="mb-4 opacity-40" />
              <p className="text-xl">Select a song to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongsPage; 