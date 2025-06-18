import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../lib/store';
import { loadSongs, searchSongs, getSong, Song } from '../lib/songSlice';
import { sendPreviewToLive, setPreviewItem } from '../lib/presentationSlice';
import { FiSearch, FiMusic, FiEye, FiMonitor, FiChevronLeft, FiClock, FiTag, FiUser, FiBook, FiX } from 'react-icons/fi';
import PreviewLivePanel from '../components/shared/PreviewLivePanel';

const Songs = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { songs, loading: songsLoading, searchResults, currentSong } = useSelector((state: RootState) => state.songs);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [selectedSong, setSelectedSong] = useState<Song | null>(null);
	const [showDetails, setShowDetails] = useState(false);

	// Initialize songs on component mount
	useEffect(() => {
		if (songs.length === 0 && !songsLoading) {
			dispatch(loadSongs({ limit: 100, offset: 0 }));
		}
	}, [dispatch, songs.length, songsLoading]);

	// Get unique categories
	const categories = ['all', ...new Set(songs.map(song => song.category).filter(Boolean))] as string[];

	// Filter songs based on search and category
	const filteredSongs = () => {
		let songsToShow = searchQuery.trim() ? searchResults : songs;

		if (selectedCategory !== 'all') {
			songsToShow = songsToShow.filter(song => song.category === selectedCategory);
		}

		return songsToShow;
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		if (query.trim()) {
			dispatch(searchSongs({ query, limit: 50 }));
		} else {
			dispatch(loadSongs({ limit: 100, offset: 0 }));
		}
	};

	const handleSongSelect = async (song: Song) => {
		setSelectedSong(song);
		setShowDetails(true);

		// Load full song details if needed
		if (!song.lyrics) {
			dispatch(getSong(song.id));
		}
	};

	const handleSendToPreview = (song: Song) => {
		const songContent = {
			id: song.id,
			type: 'song' as const,
			title: song.title,
			content: {
				lyrics: song.lyrics || '',
				artist: song.artist || '',
				key: song.key,
				tempo: song.tempo,
				category: song.category,
				ccliNumber: song.ccliNumber,
				author: song.author,
				copyright: song.copyright
			}
		};

		dispatch(setPreviewItem(songContent));
	};

	const handleSendToLive = (song: Song) => {
		const songContent = {
			id: song.id,
			type: 'song' as const,
			title: song.title,
			content: {
				lyrics: song.lyrics || '',
				artist: song.artist || '',
				key: song.key,
				tempo: song.tempo,
				category: song.category,
				ccliNumber: song.ccliNumber,
				author: song.author,
				copyright: song.copyright
			}
		};

		dispatch(sendPreviewToLive());
		dispatch(setPreviewItem(songContent));
	};

	const SongDetailsModal = ({ song, onClose }: { song: Song; onClose: () => void }) => {
		const displaySong = currentSong || song;

		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
						<div className="flex items-center gap-3">
							<div>
								<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
									{displaySong.title}
								</h2>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{displaySong.artist}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<button
								onClick={() => {
									handleSendToPreview(displaySong);
									onClose();
								}}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
							>
								<FiEye size={16} />
								Preview
							</button>
							<button
								onClick={() => {
									handleSendToLive(displaySong);
									onClose();
								}}
								className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
							>
								<FiMonitor size={16} />
								Live
							</button>
							<button
								onClick={onClose}
								className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
							>
								<FiX size={20} />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Lyrics */}
							<div className="lg:col-span-2">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
									Lyrics
								</h3>
								<div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
									<pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
										{displaySong.lyrics || 'Lyrics not available'}
									</pre>
								</div>
							</div>

							{/* Metadata */}
							<div className="space-y-4">
								<div>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
										Song Information
									</h3>
									<div className="space-y-3">
										{displaySong.artist && (
											<div className="flex items-center gap-2">
												<FiUser className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">Artist:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														{displaySong.artist}
													</p>
												</div>
											</div>
										)}

										{displaySong.author && displaySong.author !== displaySong.artist && (
											<div className="flex items-center gap-2">
												<FiBook className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">Author:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														{displaySong.author}
													</p>
												</div>
											</div>
										)}

										{displaySong.key && (
											<div className="flex items-center gap-2">
												<FiMusic className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">Key:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														{displaySong.key}
													</p>
												</div>
											</div>
										)}

										{displaySong.tempo && (
											<div className="flex items-center gap-2">
												<FiClock className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">Tempo:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														{displaySong.tempo}
													</p>
												</div>
											</div>
										)}

										{displaySong.category && (
											<div className="flex items-center gap-2">
												<FiTag className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														{displaySong.category}
													</p>
												</div>
											</div>
										)}

										{displaySong.ccliNumber && (
											<div className="flex items-center gap-2">
												<FiBook className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">CCLI:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														{displaySong.ccliNumber}
													</p>
												</div>
											</div>
										)}

										{displaySong.copyright && (
											<div className="flex items-center gap-2">
												<FiBook className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">Copyright:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														{displaySong.copyright}
													</p>
												</div>
											</div>
										)}

										{displaySong.usageCount > 0 && (
											<div className="flex items-center gap-2">
												<FiClock className="text-gray-500" size={16} />
												<div>
													<span className="text-sm text-gray-500 dark:text-gray-400">Usage:</span>
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														Used {displaySong.usageCount} times
													</p>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Tags */}
								{displaySong.tags && displaySong.tags.length > 0 && (
									<div>
										<h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
											Tags
										</h4>
										<div className="flex flex-wrap gap-2">
											{displaySong.tags.map((tag: string, index: number) => (
												<span
													key={index}
													className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
												>
													{tag}
												</span>
											))}
										</div>
									</div>
								)}

								{/* Notes */}
								{displaySong.notes && (
									<div>
										<h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
											Notes
										</h4>
										<p className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
											{displaySong.notes}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="flex h-screen bg-gray-50 dark:bg-gray-900">
			<div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
				<div className="p-4 border-b border-gray-200 dark:border-gray-700">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
						Song Library
					</h1>

					<div className="relative mb-4">
						<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<input
							type="text"
							placeholder="Search songs..."
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
							className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					<div className="flex flex-wrap gap-2">
						{categories.map((category) => (
							<button
								key={category}
								onClick={() => setSelectedCategory(category)}
								className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedCategory === category
									? 'bg-blue-600 text-white'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
									}`}
							>
								{category === 'all' ? 'All Songs' : category}
							</button>
						))}
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					{songsLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-gray-500 dark:text-gray-400">Loading songs...</div>
						</div>
					) : filteredSongs().length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
							<FiMusic size={48} className="mb-4" />
							<p className="text-lg font-medium mb-2">
								{searchQuery.trim() || selectedCategory !== 'all' ? 'No songs found' : 'No songs available'}
							</p>
							<p className="text-sm">
								Run <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">npm run db:seed-hymnals</code> to add hymns
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
							{filteredSongs().map((song: Song) => (
								<div
									key={song.id}
									className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-gray-800"
									onClick={() => handleSongSelect(song)}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0">
											<h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
												{song.title}
											</h3>
											<p className="text-sm text-gray-600 dark:text-gray-400 truncate">
												{song.artist}
											</p>

											<div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
												{song.key && (
													<span className="flex items-center gap-1">
														<FiMusic size={12} />
														Key: {song.key}
													</span>
												)}
												{song.tempo && (
													<span className="flex items-center gap-1">
														<FiClock size={12} />
														{song.tempo}
													</span>
												)}
												{song.category && (
													<span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
														{song.category}
													</span>
												)}
											</div>

											<div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleSendToPreview(song);
													}}
													className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400"
													title="Send to Preview"
												>
													<FiEye size={14} />
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleSendToLive(song);
													}}
													className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
													title="Send to Live"
												>
													<FiMonitor size={14} />
												</button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<PreviewLivePanel leftPanelWidth={65} showControls={false} />

			{/* Song Details Modal */}
			{showDetails && selectedSong && (
				<SongDetailsModal
					song={selectedSong}
					onClose={() => {
						setShowDetails(false);
						setSelectedSong(null);
					}}
				/>
			)}
		</div>
	);
};

export default Songs; 