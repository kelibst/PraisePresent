import React, { useEffect, useState } from 'react'
import { FiMusic, FiSearch } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { searchSongs, loadSongs, Song } from '@/lib/songSlice';

const SongsTab = () => {

	const dispatch = useDispatch<AppDispatch>();
	const { songs, loading: songsLoading, searchResults } = useSelector((state: RootState) => state.songs);
	const [songSearchQuery, setSongSearchQuery] = useState('');

	useEffect(() => {
		if (songs.length === 0 && !songsLoading) {
			dispatch(loadSongs({ limit: 50, offset: 0 }));
		}
	}, [dispatch, songs.length, songsLoading]);

	return (

		<div className="h-full overflow-y-auto">
			{/* Search */}
			<div className="p-4 border-b border-gray-200 dark:border-gray-700">
				<div className="relative">
					<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<input
						type="text"
						placeholder="Search songs..."
						value={songSearchQuery}
						onChange={(e) => {
							const query = e.target.value;
							setSongSearchQuery(query);
							if (query.trim()) {
								dispatch(searchSongs({ query, limit: 20 }));
							} else {
								dispatch(loadSongs({ limit: 50, offset: 0 }));
							}
						}}
						className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* Songs List */}
			<div className="p-4 space-y-3">
				{songsLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-sm text-gray-500 dark:text-gray-400">Loading songs...</div>
					</div>
				) : (
					(songSearchQuery.trim() ? searchResults : songs).map((song: Song) => (
						<div
							key={song.id}
							className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-colors"
							onClick={() => {
								// TODO: Send song to preview
								console.log('Selected song:', song);
							}}
						>
							<div className="flex items-center justify-between">
								<div className="flex-1 min-w-0">
									<h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
										{song.title}
									</h4>
									<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
										{song.artist} {song.key && `• Key: ${song.key}`} {song.tempo && `• ${song.tempo}`}
									</p>
									{song.category && (
										<p className="text-xs text-blue-600 dark:text-blue-400 truncate">
											{song.category}
										</p>
									)}
								</div>
								<div className="flex items-center gap-2 ml-2">
									{song.ccliNumber && (
										<span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
											CCLI: {song.ccliNumber}
										</span>
									)}
									<FiMusic className="text-gray-400" size={16} />
								</div>
							</div>
						</div>
					))
				)}
				{!songsLoading && (songSearchQuery.trim() ? searchResults : songs).length === 0 && (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
						<FiMusic size={24} className="mb-2" />
						<p className="text-sm">
							{songSearchQuery.trim() ? 'No songs found' : 'No songs available'}
						</p>
						{!songSearchQuery.trim() && (
							<p className="text-xs mt-1">
								Run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">npm run db:seed-hymnals</code> to add hymns
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);

}

export default SongsTab