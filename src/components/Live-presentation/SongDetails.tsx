import React, { useEffect, useState, useCallback } from 'react';
import { FiX, FiPlay, FiArrowRight, FiHeart, FiUser, FiTag, FiClock, FiLoader, FiInfo } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { updateSong, Song } from '@/lib/songSlice';

interface SongDetailsProps {
	song: Song;
	onClose: () => void;
	onSendToPreview: (song: Song) => void;
	onSendToLive: (song: Song) => void;
}

const SongDetails: React.FC<SongDetailsProps> = ({ song, onClose, onSendToPreview, onSendToLive }) => {
	const [isFavorite, setIsFavorite] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const dispatch = useDispatch<AppDispatch>();

	const handleToggleFavorite = useCallback(async () => {
		if (isUpdating) return;

		setIsUpdating(true);
		try {
			const updatedSong = {
				...song,
				tags: isFavorite
					? song.tags.filter(tag => tag !== 'favorite')
					: [...song.tags, 'favorite']
			};
			await dispatch(updateSong(updatedSong));
			setIsFavorite(!isFavorite);
		} catch (error) {
			console.error('Failed to toggle favorite:', error);
			// Revert the UI state on error
			setIsFavorite(prev => !prev);
		} finally {
			setIsUpdating(false);
		}
	}, [song, isFavorite, isUpdating, dispatch]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose();
		}
	}, [onClose]);

	useEffect(() => {
		setIsFavorite(song.tags.includes('favorite'));
	}, [song.tags]);

	// Focus management for accessibility
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="song-details-title"
		>
			<div
				className="bg-white dark:bg-gray-800 rounded-lg w-3/4 max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={handleKeyDown}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
					<div className="flex-1 min-w-0">
						<h2
							id="song-details-title"
							className="text-2xl font-bold text-gray-900 dark:text-white truncate"
						>
							{song.title}
						</h2>
						<div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
							{song.artist && (
								<span className="flex items-center gap-1">
									<FiUser size={14} aria-hidden="true" />
									<span aria-label="Artist">{song.artist}</span>
								</span>
							)}
							{song.key && (
								<span aria-label="Key signature">Key: {song.key}</span>
							)}
							{song.tempo && (
								<span className="flex items-center gap-1">
									<FiClock size={14} aria-hidden="true" />
									<span aria-label="Tempo">{song.tempo}</span>
								</span>
							)}
							{song.category && (
								<span className="flex items-center gap-1">
									<FiTag size={14} aria-hidden="true" />
									<span aria-label="Category">{song.category}</span>
								</span>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleToggleFavorite}
							disabled={isUpdating}
							className={`p-2 rounded-md transition-colors ${isFavorite
								? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
								: 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
								} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
							aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
						>
							{isUpdating ? (
								<FiLoader size={18} className="animate-spin" />
							) : (
								<FiHeart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
							)}
						</button>
						<button
							onClick={onClose}
							className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
							aria-label="Close song details"
						>
							<FiX size={18} />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 p-6 overflow-y-auto">
					{/* Song Lyrics */}
					<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
						<div className="text-center">
							<h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{song.title}</h3>
							<div className="text-base leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
								{song.lyrics || (
									<div className="flex items-center justify-center py-4 text-gray-500">
										<FiInfo size={16} className="mr-2" />
										No lyrics available
									</div>
								)}
							</div>
							{song.artist && (
								<div className="text-sm opacity-75 mt-4 text-gray-500 dark:text-gray-400">
									{song.artist}
								</div>
							)}
						</div>
					</div>

					{/* Song Information */}
					<div className="space-y-3">
						<h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
							Song Information
						</h4>
						<div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
							{song.ccliNumber && (
								<div><strong>CCLI:</strong> {song.ccliNumber}</div>
							)}
							{song.copyright && (
								<div><strong>Copyright:</strong> © {song.copyright}</div>
							)}
							{song.author && song.author !== song.artist && (
								<div><strong>Written by:</strong> {song.author}</div>
							)}
							{song.usageCount > 0 && (
								<div><strong>Used:</strong> {song.usageCount} times</div>
							)}
							{song.lastUsed && (
								<div><strong>Last used:</strong> {new Date(song.lastUsed).toLocaleDateString()}</div>
							)}
							{song.notes && (
								<div className="col-span-2"><strong>Notes:</strong> {song.notes}</div>
							)}
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
					<button
						onClick={() => onSendToPreview(song)}
						className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 transition-colors"
					>
						<FiPlay size={16} />
						Preview
					</button>
					<button
						onClick={() => onSendToLive(song)}
						className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2 transition-colors"
					>
						<FiArrowRight size={16} />
						Live
					</button>
				</div>
			</div>
		</div>
	);
};

export default SongDetails; 