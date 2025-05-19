import React, { useState } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2, FiCopy, FiSearch, FiCalendar, FiClock, FiUser, FiEye } from 'react-icons/fi';

const PresentationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock presentations data
  const presentations = [
    { 
      id: 1, 
      title: 'Sunday Morning Service', 
      thumbnail: 'https://placehold.co/400x225/e9d8fd/6b46c1?text=Sunday+Service',
      lastEdited: '2023-11-05', 
      duration: '45 min',
      author: 'Pastor John',
      slides: 32,
      tags: ['service', 'worship']
    },
    { 
      id: 2, 
      title: 'Youth Group Meeting', 
      thumbnail: 'https://placehold.co/400x225/caf0f8/0077b6?text=Youth+Group',
      lastEdited: '2023-11-01', 
      duration: '30 min',
      author: 'Youth Leader Sarah',
      slides: 24,
      tags: ['youth', 'fellowship']
    },
    { 
      id: 3, 
      title: 'Christmas Eve Service', 
      thumbnail: 'https://placehold.co/400x225/f3e8ff/9333ea?text=Christmas+Eve',
      lastEdited: '2023-10-28', 
      duration: '60 min',
      author: 'Worship Team',
      slides: 45,
      tags: ['holiday', 'special']
    },
    { 
      id: 4, 
      title: 'Bible Study: Psalms', 
      thumbnail: 'https://placehold.co/400x225/fef3c7/d97706?text=Bible+Study',
      lastEdited: '2023-10-25', 
      duration: '40 min',
      author: 'Elder Mike',
      slides: 28,
      tags: ['study', 'scripture']
    },
    { 
      id: 5, 
      title: 'Church Announcements', 
      thumbnail: 'https://placehold.co/400x225/e9d8fd/6b46c1?text=Announcements',
      lastEdited: '2023-10-22', 
      duration: '10 min',
      author: 'Admin Team',
      slides: 12,
      tags: ['announcements', 'weekly']
    },
    { 
      id: 6, 
      title: 'Worship Night', 
      thumbnail: 'https://placehold.co/400x225/caf0f8/0077b6?text=Worship+Night',
      lastEdited: '2023-10-18', 
      duration: '50 min',
      author: 'Worship Director',
      slides: 35,
      tags: ['worship', 'evening']
    },
  ];

  // Filter presentations based on search query
  const filteredPresentations = presentations.filter(presentation => 
    presentation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    presentation.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    presentation.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Presentations</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <FiPlusCircle /> Create New Presentation
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="relative w-full md:w-64 mb-4 md:mb-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-slate-400" />
          </span>
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search presentations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresentations.map(presentation => (
            <div key={presentation.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={presentation.thumbnail} 
                  alt={presentation.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button className="p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-slate-700">
                    <FiEdit size={16} />
                  </button>
                  <button className="p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-slate-700">
                    <FiCopy size={16} />
                  </button>
                  <button className="p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-red-600">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">{presentation.title}</h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {presentation.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <FiCalendar size={14} />
                    <span>{presentation.lastEdited}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock size={14} />
                    <span>{presentation.duration}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <div className="flex items-center gap-1">
                    <FiUser size={14} />
                    <span>{presentation.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiEye size={14} />
                    <span>{presentation.slides} slides</span>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <button className="w-full py-1.5 bg-primary text-white rounded font-medium">
                  Present
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Presentation
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Last Edited
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Slides
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredPresentations.map(presentation => (
                <tr key={presentation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-16 flex-shrink-0 bg-slate-300 rounded overflow-hidden mr-4">
                        <img className="h-full w-full object-cover" src={presentation.thumbnail} alt="" />
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{presentation.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {presentation.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {presentation.lastEdited}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {presentation.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {presentation.slides}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-primary hover:text-primary-dark">
                        Present
                      </button>
                      <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <FiEdit size={16} />
                      </button>
                      <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <FiCopy size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PresentationsPage; 