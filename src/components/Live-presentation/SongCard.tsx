import React from 'react';
import { FiHeart, FiList, FiMusic } from 'react-icons/fi';
import { Song } from '@/lib/songSlice';

interface SongCardProps {
	song: Song;
	isClicked: boolean;
	onSongClick: (song: Song) => void;
	onSelectForDetails: (song: Song) => void;
	onSongDetails: (song: Song, e: React.MouseEvent) => void;
}

const SongCard: React.FC<SongCardProps> = React.memo(({
	song,
	isClicked,
	onSongClick,
	onSelectForDetails,
	onSongDetails
}) => {
	return (
		<div
			className={`p-3 rounded-lg border cursor-pointer transition-all group focus-within:ring-2 focus-within:ring-blue-500 ${isClicked
				? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
				: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
				}`}
			onClick={(e) => {
				e.stopPropagation();
				onSelectForDetails(song);
			}}
			tabIndex={0}
			role="button"
			aria-label={`${song.title} by ${song.artist || 'Unknown artist'}, click to preview, double-click to send live`}
		>
			<div className="flex justify-between">
				<div className="flex-1 min-w-0">
					<h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
						{song.title}
					</h4>
					<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
						{song.artist} {song.key && `• Key: ${song.key}`} {song.tempo && `• ${song.tempo}`}
					</p>
					{song.category && (
						<p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1">
							{song.category}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2 ml-2">
					{song.tags.includes('favorite') && (
						<FiHeart className="text-red-500" size={14} fill="currentColor" aria-label="Favorite song" />
					)}
					<button
						onClick={(e) => {
							e.stopPropagation();
							onSelectForDetails(song);
						}}
						className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-opacity rounded focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
						title="View song details"
						aria-label="View song sections"
					>
						<FiList size={16} />
					</button>
					<button
						onClick={(e) => onSongDetails(song, e)}
						className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity rounded focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
						title="Song information"
						aria-label="View song information"
					>
						<FiMusic size={16} />
					</button>
				</div>
			</div>
		</div>
	);
});

SongCard.displayName = 'SongCard';

export default SongCard; 