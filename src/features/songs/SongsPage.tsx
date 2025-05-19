import React, { useState } from 'react';
import { FiSearch, FiMusic, FiFilter, FiPlus, FiEdit, FiTrash2, FiInfo, FiExternalLink } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for songs
const mockSongs = [
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

const SongsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<any>(null);
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
    <div className="flex min-h-screen bg-slate-900 text-white">
      {/* Left sidebar */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <FiMusic className="mr-2" /> Songs
            </h2>
            <button className="p-2 rounded-full hover:bg-slate-700 transition">
              <FiPlus />
            </button>
          </div>
          
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search songs..." 
              className="w-full bg-slate-700 text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-1 mb-2">
            <button 
              className={`px-3 py-1 rounded-md text-sm ${activeFilter === 'all' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${activeFilter === 'recent' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={() => setActiveFilter('recent')}
            >
              Recent
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${activeFilter === 'worship' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={() => setActiveFilter('worship')}
            >
              Worship
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm ${activeFilter === 'hymns' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={() => setActiveFilter('hymns')}
            >
              Hymns
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {filteredSongs.map(song => (
              <div 
                key={song.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  selectedSong?.id === song.id 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-700'
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
        
        <div className="p-4 border-t border-slate-700">
          <button className="w-full py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition flex items-center justify-center">
            <FiPlus className="mr-2" /> Add New Song
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8">
        {selectedSong ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedSong.title}</h2>
              <div className="flex space-x-2">
                <button className="p-2 rounded hover:bg-slate-800">
                  <FiEdit />
                </button>
                <button className="p-2 rounded hover:bg-slate-800 text-red-400">
                  <FiTrash2 />
                </button>
                <button className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition">
                  Present
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Author</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{selectedSong.author}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">CCLI Number</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <span>{selectedSong.ccli}</span>
                    <a href="#" className="ml-2 text-blue-400 hover:text-blue-300">
                      <FiExternalLink />
                    </a>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Last Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{selectedSong.lastUsed}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Lyrics</h3>
              {selectedSong.verses.map((verse, index) => (
                <div key={index} className="mb-6">
                  <div className="text-sm text-slate-400 mb-1 uppercase">{verse.type}</div>
                  <div className="whitespace-pre-line">{verse.content}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FiMusic size={48} className="mb-4 opacity-40" />
            <p className="text-xl">Select a song to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongsPage; 