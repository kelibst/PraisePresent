import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../lib/store';
import {
	loadSongs,
	searchSongs,
	selectSongs,
	selectSongLoading,
	selectSongError,
	selectRecentSongs,
	selectSongCategories,
	initializeSongDefaults
} from '../../lib/songSlice';
import { useSongInit } from '../../hooks/useSongInit';

/**
 * Basic song testing component to verify the song system is working
 * This component will be removed once the full song UI is implemented
 */
const SongTest: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const songs = useSelector(selectSongs);
	const loading = useSelector(selectSongLoading);
	const error = useSelector(selectSongError);
	const recentSongs = useSelector(selectRecentSongs);
	const categories = useSelector(selectSongCategories);

	// Initialize song system
	const { initialized } = useSongInit();

	const handleLoadAllSongs = () => {
		dispatch(loadSongs({
			filters: {},
			limit: 10
		}));
	};

	const handleSearchSongs = () => {
		dispatch(searchSongs({
			query: 'amazing',
			limit: 10
		}));
	};

	const handleLoadByCategory = () => {
		dispatch(loadSongs({
			filters: { category: 'Contemporary' },
			limit: 10
		}));
	};

	const handleLoadByKey = () => {
		dispatch(loadSongs({
			filters: { key: 'G' },
			limit: 10
		}));
	};

	return (
		<div className="p-6 max-w-4xl mx-auto overflow-y-auto">
			<h1 className="text-2xl font-bold mb-6">Song System Test</h1>

			{/* Status Display */}
			<div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
				<h2 className="text-lg font-semibold mb-2">System Status</h2>
				<div className="space-y-1">
					<p>Initialized: <span className={initialized ? 'text-green-600' : 'text-red-600'}>
						{initialized ? 'Yes' : 'No'}
					</span></p>
					<p>Loading: <span className={loading ? 'text-yellow-600' : 'text-gray-600'}>
						{loading ? 'Yes' : 'No'}
					</span></p>
					<p>Error: <span className={error ? 'text-red-600' : 'text-green-600'}>
						{error || 'None'}
					</span></p>
					<p>Songs Count: <span className="font-semibold">{songs.length}</span></p>
					<p>Recent Songs: <span className="font-semibold">{recentSongs.length}</span></p>
					<p>Categories: <span className="font-semibold">{categories.join(', ')}</span></p>
				</div>
			</div>

			{/* Test Actions */}
			<div className="mb-6 space-x-4">
				<button
					onClick={handleLoadAllSongs}
					disabled={loading}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
				>
					Load All Songs
				</button>
				<button
					onClick={handleSearchSongs}
					disabled={loading}
					className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
				>
					Search "Amazing"
				</button>
				<button
					onClick={handleLoadByCategory}
					disabled={loading}
					className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
				>
					Load Contemporary
				</button>
				<button
					onClick={handleLoadByKey}
					disabled={loading}
					className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
				>
					Load Key of G
				</button>
			</div>

			{/* Loading State */}
			{loading && (
				<div className="text-center py-4">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p className="mt-2">Loading songs...</p>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
					<h3 className="font-semibold">Error:</h3>
					<p>{error}</p>
				</div>
			)}

			{/* Songs Display */}
			<div className="space-y-4">
				<h2 className="text-lg font-semibold">Songs ({songs.length})</h2>

				{songs.length === 0 && !loading ? (
					<div className="text-center py-8 text-gray-500">
						<p>No songs found.</p>
						<p className="text-sm mt-2">
							Run <code className="bg-gray-200 px-2 py-1 rounded">npm run db:seed-songs</code> to add sample songs.
						</p>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{songs.map((song) => (
							<div key={song.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
								<h3 className="font-semibold text-lg">{song.title}</h3>
								<p className="text-gray-600 dark:text-gray-400">{song.artist}</p>
								<div className="mt-2 space-y-1 text-sm">
									<p><span className="font-medium">Key:</span> {song.key}</p>
									<p><span className="font-medium">Tempo:</span> {song.tempo}</p>
									<p><span className="font-medium">Category:</span> {song.category}</p>
									<p><span className="font-medium">CCLI:</span> {song.ccliNumber}</p>
									<p><span className="font-medium">Usage:</span> {song.usageCount}</p>
								</div>

								{song.tags.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{song.tags.map((tag, index) => (
											<span
												key={index}
												className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
											>
												{tag}
											</span>
										))}
									</div>
								)}

								{song.structure && (
									<div className="mt-3">
										<p className="text-sm font-medium">Structure:</p>
										<div className="flex flex-wrap gap-1 mt-1">
											{song.structure.slides.map((slide, index) => (
												<span
													key={index}
													className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
												>
													{slide.title}
												</span>
											))}
										</div>
									</div>
								)}

								{song.lyrics && (
									<div className="mt-3">
										<p className="text-sm font-medium">Preview:</p>
										<p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
											{song.lyrics.substring(0, 100)}...
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Recent Songs */}
			{recentSongs.length > 0 && (
				<div className="mt-8">
					<h2 className="text-lg font-semibold mb-4">Recent Songs</h2>
					<div className="space-y-2">
						{recentSongs.map((song) => (
							<div key={song.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
								<div>
									<span className="font-medium">{song.title}</span>
									<span className="text-gray-600 dark:text-gray-400 ml-2">by {song.artist}</span>
								</div>
								<div className="text-sm text-gray-500">
									Used {song.usageCount} times
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Debug Info */}
			<div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs">
				<h3 className="font-semibold mb-2">Debug Info</h3>
				<pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
					{JSON.stringify({
						initialized,
						loading,
						error,
						songCount: songs.length,
						recentCount: recentSongs.length,
						categories
					}, null, 2)}
				</pre>
			</div>
		</div>
	);
};

export default SongTest; 