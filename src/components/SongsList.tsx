import React from 'react';

export interface Song {
  id: number;
  title: string;
  artist: string;
  key: string;
}

interface SongsListProps {
  songs: Song[];
  onPreview?: (song: Song) => void;
}

const SongsList: React.FC<SongsListProps> = ({ songs, onPreview }) => {
  return (
    <div className="space-y-3">
      {songs.map((song) => (
        <div 
          key={song.id}
          className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-medium text-gray-800 dark:text-white">{song.title}</h3>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">Key: {song.key}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{song.artist}</p>
            <div className="flex gap-2 mt-2">
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Lyrics</button>
              <button 
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => onPreview && onPreview(song)}
              >
                Show in Preview
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SongsList; 