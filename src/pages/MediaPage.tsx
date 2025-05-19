import React, { useState } from 'react';
import { FiUpload, FiFolder, FiImage, FiVideo, FiFileText, FiSearch, FiPlay } from 'react-icons/fi';

const MediaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos' | 'documents'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock media data
  const mediaItems = [
    { id: 1, name: 'Worship Background 1', type: 'image', path: '/images/worship1.jpg', thumbnail: 'https://placehold.co/300x200/e9d8fd/6b46c1?text=Worship+1', tags: ['worship', 'background'] },
    { id: 2, name: 'Sermon Series Intro', type: 'video', path: '/videos/sermon-intro.mp4', thumbnail: 'https://placehold.co/300x200/caf0f8/0077b6?text=Sermon+Intro', tags: ['sermon', 'intro'] },
    { id: 3, name: 'Church Logo', type: 'image', path: '/images/logo.png', thumbnail: 'https://placehold.co/300x200/f3e8ff/9333ea?text=Church+Logo', tags: ['logo', 'branding'] },
    { id: 4, name: 'Announcement Slide', type: 'image', path: '/images/announcement.jpg', thumbnail: 'https://placehold.co/300x200/e9d8fd/6b46c1?text=Announcements', tags: ['announcements'] },
    { id: 5, name: 'Welcome Video', type: 'video', path: '/videos/welcome.mp4', thumbnail: 'https://placehold.co/300x200/caf0f8/0077b6?text=Welcome+Video', tags: ['welcome', 'intro'] },
    { id: 6, name: 'Event Flyer', type: 'document', path: '/documents/event.pdf', thumbnail: 'https://placehold.co/300x200/fef3c7/d97706?text=Event+PDF', tags: ['event', 'flyer'] },
  ];

  // Filter media based on active tab and search query
  const filteredMedia = mediaItems.filter(item => {
    const matchesType = activeTab === 'all' || item.type === activeTab;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Media Library</h1>
        <div className="flex space-x-2">
          <button className="btn btn-primary flex items-center gap-2">
            <FiUpload /> Upload Media
          </button>
          <button className="btn btn-outline flex items-center gap-2">
            <FiFolder /> New Folder
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
            >
              All Files
            </button>
            <button 
              onClick={() => setActiveTab('images')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'images' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
            >
              <FiImage /> Images
            </button>
            <button 
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'videos' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
            >
              <FiVideo /> Videos
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'documents' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
            >
              <FiFileText /> Documents
            </button>
          </div>
          
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="text-slate-400" />
            </span>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full md:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMedia.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-700">
              <img 
                src={item.thumbnail} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary bg-opacity-80 rounded-full flex items-center justify-center">
                    <FiPlay className="text-white text-xl" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-slate-800 dark:text-white truncate">{item.name}</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaPage; 