import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../lib/store';
import {
	loadSongs,
	searchSongs,
	deleteSong,
	getSong,
} from '../lib/songSlice';
import {
	setPreviewItem,
	sendPreviewToLive,
} from '../lib/presentationSlice';
import {
	FiPlus,
	FiSearch,
	FiEdit3,
	FiTrash2,
	FiMusic,
	FiEye,
	FiMonitor,
	FiGrid,
	FiList,
} from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import SimpleSongEditor from '../components/songs/SimpleSongEditor';

// Delete Confirmation Modal
const DeleteConfirmation: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	songTitle: string;
}> = ({ isOpen, onClose, onConfirm, songTitle }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<FiTrash2 />
						Delete Song
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<p className="text-gray-700 dark:text-gray-300">
						Are you sure you want to delete <strong>"{songTitle}"</strong>? This action cannot be undone.
					</p>

					<div className="flex justify-end gap-4">
						<button
							onClick={onClose}
							className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							Cancel
						</button>
						<button
							onClick={onConfirm}
							className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
						>
							Delete Song
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const SongsSimple: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { songs, loading, searchResults, error } = useSelector((state: RootState) => state.songs);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [showEditor, setShowEditor] = useState(false);
	const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
	const [selectedSong, setSelectedSong] = useState<any>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [songToDelete, setSongToDelete] = useState<any>(null);

	// Load songs on component mount
	useEffect(() => {
		if (songs.length === 0 && !loading) {
			dispatch(loadSongs({ limit: 50, offset: 0 }));
		}
	}, [dispatch, songs.length, loading]);

	// Handle search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (searchQuery.trim()) {
				dispatch(searchSongs({ query: searchQuery, limit: 50 }));
			} else {
				dispatch(loadSongs({ limit: 50, offset: 0 }));
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchQuery, dispatch]);

	const displayedSongs = searchQuery.trim() ? searchResults : songs;
	const filteredSongs = selectedCategory
		? displayedSongs.filter(song => song.category === selectedCategory)
		: displayedSongs;

	const categories = [...new Set(songs.map(song => song.category).filter(Boolean))];

	const handleCreateSong = () => {
		setSelectedSong(null);
		setEditorMode('create');
		setShowEditor(true);
	};

	const handleEditSong = async (song: any) => {
		try {
			// Load full song details
			const fullSong = await dispatch(getSong(song.id)).unwrap();
			setSelectedSong(fullSong);
			setEditorMode('edit');
			setShowEditor(true);
		} catch (error) {
			console.error('Failed to load song details:', error);
			// Fallback to basic song data
			setSelectedSong(song);
			setEditorMode('edit');
			setShowEditor(true);
		}
	};

	const handleDeleteSong = (song: any) => {
		setSongToDelete(song);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = async () => {
		if (songToDelete) {
			try {
				await dispatch(deleteSong(songToDelete.id)).unwrap();
				dispatch(loadSongs({ limit: 50, offset: 0 }));
				setShowDeleteConfirm(false);
				setSongToDelete(null);
			} catch (error) {
				console.error('Failed to delete song:', error);
			}
		}
	};

	const handlePreviewSong = (song: any) => {
		const presentationItem = {
			id: `song-${song.id}`,
			type: 'song' as const,
			title: song.title,
			content: {
				songId: song.id,
				title: song.title,
				artist: song.artist,
				lyrics: song.lyrics,
				key: song.key,
				tempo: song.tempo,
				category: song.category,
				ccliNumber: song.ccliNumber,
				author: song.author,
				copyright: song.copyright,
			},
			reference: `${song.title}${song.artist ? ' - ' + song.artist : ''}`,
		};

		dispatch(setPreviewItem(presentationItem));
	};

	const handleSendToLive = (song: any) => {
		const presentationItem = {
			id: `song-${song.id}`,
			type: 'song' as const,
			title: song.title,
			content: {
				songId: song.id,
				title: song.title,
				artist: song.artist,
				lyrics: song.lyrics,
				key: song.key,
				tempo: song.tempo,
				category: song.category,
				ccliNumber: song.ccliNumber,
				author: song.author,
				copyright: song.copyright,
			},
			reference: `${song.title}${song.artist ? ' - ' + song.artist : ''}`,
		};

		dispatch(setPreviewItem(presentationItem));
		dispatch(sendPreviewToLive());
	};

	const handleEditorClose = () => {
		setShowEditor(false);
		setSelectedSong(null);
		// Reload songs to reflect any changes
		dispatch(loadSongs({ limit: 50, offset: 0 }));
	};

	return (
		<div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
			{/* Header */}
			<div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
							<FiMusic className="text-blue-600" />
							Song Library
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Manage your worship songs with slide-based editing
						</p>
					</div>

					<button
						onClick={handleCreateSong}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						<FiPlus size={20} />
						Create New Song
					</button>
				</div>

				{/* Search and Filters */}
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
					<div className="relative flex-1">
						<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
						<input
							type="text"
							placeholder="Search songs, artists, or lyrics..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>

					<div className="flex items-center gap-4">
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						>
							<option value="">All Categories</option>
							{categories.map(category => (
								<option key={category} value={category}>{category}</option>
							))}
						</select>

						<div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
							<button
								onClick={() => setViewMode('grid')}
								className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
							>
								<FiGrid size={18} />
							</button>
							<button
								onClick={() => setViewMode('list')}
								className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
							>
								<FiList size={18} />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 p-6">
				{loading && songs.length === 0 ? (
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
							<p className="text-gray-600 dark:text-gray-400">Loading songs...</p>
						</div>
					</div>
				) : filteredSongs.length === 0 ? (
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<FiMusic className="mx-auto h-16 w-16 text-gray-400 mb-4" />
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
								{songs.length === 0 ? 'No songs yet' : 'No songs found'}
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								{songs.length === 0
									? 'Get started by creating your first song with slide-based editing'
									: 'Try adjusting your search criteria'
								}
							</p>
							{songs.length === 0 && (
								<button
									onClick={handleCreateSong}
									className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
								>
									<FiPlus size={16} />
									Create Your First Song
								</button>
							)}
						</div>
					</div>
				) : viewMode === 'grid' ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{filteredSongs.map((song) => (
							<div
								key={song.id}
								className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1 min-w-0">
										<h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
											{song.title}
										</h3>
										{song.artist && (
											<p className="text-sm text-gray-600 dark:text-gray-400 truncate">
												{song.artist}
											</p>
										)}
									</div>

									<div className="flex items-center gap-1 ml-2">
										<button
											onClick={() => handlePreviewSong(song)}
											className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
											title="Preview Song"
										>
											<FiEye size={16} />
										</button>
										<button
											onClick={() => handleSendToLive(song)}
											className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
											title="Send to Live"
										>
											<FiMonitor size={16} />
										</button>
										<button
											onClick={() => handleEditSong(song)}
											className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-md transition-colors"
											title="Edit Song"
										>
											<FiEdit3 size={16} />
										</button>
										<button
											onClick={() => handleDeleteSong(song)}
											className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
											title="Delete Song"
										>
											<FiTrash2 size={16} />
										</button>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex flex-wrap gap-2 text-xs">
										{song.key && (
											<span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
												Key: {song.key}
											</span>
										)}
										{song.tempo && (
											<span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
												{song.tempo}
											</span>
										)}
									</div>

									{song.category && (
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{song.category}
										</p>
									)}

									{song.ccliNumber && (
										<p className="text-xs text-gray-500 dark:text-gray-400">
											CCLI: {song.ccliNumber}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					// List View
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 dark:bg-gray-700">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Song
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Artist
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Category
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Key/Tempo
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											CCLI
										</th>
										<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
									{filteredSongs.map((song) => (
										<tr key={song.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
											<td className="px-6 py-4">
												<div>
													<div className="text-sm font-medium text-gray-900 dark:text-white">
														{song.title}
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-600 dark:text-gray-400">
													{song.artist || '-'}
												</div>
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
													{song.category || 'Uncategorized'}
												</span>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-600 dark:text-gray-400">
													{song.key && song.tempo ? `${song.key} / ${song.tempo}` : song.key || song.tempo || '-'}
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-600 dark:text-gray-400">
													{song.ccliNumber || '-'}
												</div>
											</td>
											<td className="px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														onClick={() => handlePreviewSong(song)}
														className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
														title="Preview"
													>
														<FiEye size={16} />
													</button>
													<button
														onClick={() => handleSendToLive(song)}
														className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
														title="Send to Live"
													>
														<FiMonitor size={16} />
													</button>
													<button
														onClick={() => handleEditSong(song)}
														className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-md transition-colors"
														title="Edit"
													>
														<FiEdit3 size={16} />
													</button>
													<button
														onClick={() => handleDeleteSong(song)}
														className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
														title="Delete"
													>
														<FiTrash2 size={16} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>

			{/* Modals */}
			<SimpleSongEditor
				isOpen={showEditor}
				onClose={handleEditorClose}
				song={selectedSong}
				mode={editorMode}
			/>

			<DeleteConfirmation
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={confirmDelete}
				songTitle={songToDelete?.title || ''}
			/>
		</div>
	);
};

export default SongsSimple; 