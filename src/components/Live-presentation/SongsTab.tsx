import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { FiMusic, FiSearch, FiX, FiPlay, FiArrowRight, FiHeart, FiUser, FiTag, FiClock, FiList, FiLoader, FiInfo } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { searchSongs, loadSongs, Song, getSong, updateSong, SongSlide } from '@/lib/songSlice';
import { setPreviewItem, sendContentToLiveDisplay, PresentationItem } from '@/lib/presentationSlice';

// Imported components
import SongDetails from '@/components/Live-presentation/SongDetails';
import SongDetailsTab from '@/components/Live-presentation/SongDetailsTab';
import SongCard from '@/components/Live-presentation/SongCard';

// Constants for better maintainability
const DOUBLE_CLICK_TIMEOUT = 500;
const SEARCH_DEBOUNCE_DELAY = 300;
const SONGS_PER_PAGE = 50;
const SEARCH_LIMIT = 20;

const SongsTab = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { songs, loading: songsLoading, searchResults } = useSelector((state: RootState) => state.songs);
	const [songSearchQuery, setSongSearchQuery] = useState('');
	const [selectedSong, setSelectedSong] = useState<Song | null>(null);
	const [selectedSongForDetails, setSelectedSongForDetails] = useState<Song | null>(null);
	const [clickedSong, setClickedSong] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'songs' | 'details'>('songs');
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

	// Initialize songs on mount
	useEffect(() => {
		if (songs.length === 0 && !songsLoading) {
			dispatch(loadSongs({ limit: SONGS_PER_PAGE, offset: 0 }));
		}
	}, [dispatch, songs.length, songsLoading]);

	// Memoized presentation item creators
	const createSongPresentationItem = useCallback((song: Song): PresentationItem => {
		const firstSlide = song.structure?.slides?.[0];

		return {
			id: `song-${song.id}`,
			type: "song",
			title: song.title,
			content: {
				songId: song.id,
				title: song.title,
				artist: song.artist,
				lyrics: song.lyrics,
				slide: firstSlide,
				slides: song.structure?.slides || [],
				currentSlideIndex: 0,
				totalSlides: song.structure?.slides?.length || 1,
				lines: song.lyrics?.split('\n') || [],
				key: song.key,
				tempo: song.tempo,
				ccliNumber: song.ccliNumber,
				copyright: song.copyright
			},
			reference: `${song.title}${song.artist ? ' - ' + song.artist : ''}`,
		};
	}, []);

	const createSlidePresentationItem = useCallback((song: Song, slide: SongSlide): PresentationItem => {
		const slideIndex = song.structure?.slides?.findIndex(s => s.id === slide.id) || 0;

		return {
			id: `song-${song.id}-${slide.id}`,
			type: "song",
			title: `${song.title} - ${slide.title}`,
			content: {
				songId: song.id,
				slideId: slide.id,
				title: song.title,
				artist: song.artist,
				lyrics: slide.content,
				slide: slide,
				slides: song.structure?.slides || [],
				currentSlideIndex: slideIndex,
				totalSlides: song.structure?.slides?.length || 1,
				lines: slide.content.split('\n') || [],
				key: song.key,
				tempo: song.tempo,
				ccliNumber: song.ccliNumber,
				copyright: song.copyright
			},
			reference: `${song.title} - ${slide.title}`,
		};
	}, []);

	// Optimized usage tracking function
	const updateSongUsage = useCallback(async (song: Song) => {
		if (!song.id) return;

		try {
			const updatedSong = {
				...song,
				usageCount: song.usageCount + 1,
				lastUsed: new Date().toISOString()
			};
			await dispatch(updateSong(updatedSong));
		} catch (error) {
			console.error('Failed to update song usage:', error);
		}
	}, [dispatch]);

	const handleSendToPreview = useCallback(async (song: Song) => {
		try {
			const presentationItem = createSongPresentationItem(song);
			dispatch(setPreviewItem(presentationItem));
			updateSongUsage(song);
		} catch (error) {
			console.error('Failed to send song to preview:', error);
		}
	}, [createSongPresentationItem, dispatch, updateSongUsage]);

	const handleSendToLive = useCallback(async (song: Song) => {
		try {
			const presentationItem = createSongPresentationItem(song);
			await dispatch(sendContentToLiveDisplay(presentationItem));
			updateSongUsage(song);
		} catch (error) {
			console.error('Failed to send song to live:', error);
		}
	}, [createSongPresentationItem, dispatch, updateSongUsage]);

	const handleSendSlideToPreview = useCallback(async (song: Song, slide: SongSlide) => {
		try {
			const presentationItem = createSlidePresentationItem(song, slide);
			dispatch(setPreviewItem(presentationItem));
			updateSongUsage(song);
		} catch (error) {
			console.error('Failed to send slide to preview:', error);
		}
	}, [createSlidePresentationItem, dispatch, updateSongUsage]);

	const handleSendSlideToLive = useCallback(async (song: Song, slide: SongSlide) => {
		try {
			const presentationItem = createSlidePresentationItem(song, slide);
			await dispatch(sendContentToLiveDisplay(presentationItem));
			updateSongUsage(song);
		} catch (error) {
			console.error('Failed to send slide to live:', error);
		}
	}, [createSlidePresentationItem, dispatch, updateSongUsage]);

	const handleSongClick = useCallback(async (song: Song) => {
		const songId = song.id.toString();

		if (clickedSong === songId) {
			// Double click - send to live
			setClickedSong(null);
			await handleSendToLive(song);
		} else {
			// First click - send to preview and set up for potential double click
			setClickedSong(songId);
			await handleSendToPreview(song);

			// Clear the clicked state after delay to reset double-click detection
			setTimeout(() => {
				setClickedSong(null);
			}, DOUBLE_CLICK_TIMEOUT);
		}
	}, [clickedSong, handleSendToLive, handleSendToPreview]);

	const handleSongDetails = useCallback(async (song: Song, e: React.MouseEvent) => {
		e.stopPropagation();

		try {
			// Load full song details if needed
			const fullSong = await dispatch(getSong(song.id)).unwrap();
			setSelectedSong(fullSong);
		} catch (error) {
			console.error('Failed to load song details:', error);
			setSelectedSong(song); // Fallback to basic song data
		}
	}, [dispatch]);

	const handleSelectSongForDetails = useCallback(async (song: Song) => {
		try {
			// Load full song details
			const fullSong = await dispatch(getSong(song.id)).unwrap();
			setSelectedSongForDetails(fullSong);
			setActiveTab('details');
		} catch (error) {
			console.error('Failed to load song details:', error);
			setSelectedSongForDetails(song); // Fallback to basic song data
			setActiveTab('details');
		}
	}, [dispatch]);

	// Debounced search handler
	const handleSearchChange = useCallback((query: string) => {
		setSongSearchQuery(query);

		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		// Set new timeout for debounced search
		const newTimeout = setTimeout(() => {
			if (query.trim()) {
				dispatch(searchSongs({ query, limit: SEARCH_LIMIT }));
			} else {
				dispatch(loadSongs({ limit: SONGS_PER_PAGE, offset: 0 }));
			}
		}, SEARCH_DEBOUNCE_DELAY);

		setSearchTimeout(newTimeout);
	}, [dispatch, searchTimeout]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const displayedSongs = useMemo(() =>
		songSearchQuery.trim() ? searchResults : songs,
		[songSearchQuery, searchResults, songs]
	);

	return (
		<>
			<div className="h-full flex flex-col">
				{/* Tab Navigation */}
				<div className="flex border-b border-gray-200 dark:border-gray-700" role="tablist">
					<button
						onClick={() => setActiveTab('songs')}
						className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${activeTab === 'songs'
							? 'border-blue-500 text-blue-600 dark:text-blue-400'
							: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
							}`}
						role="tab"
						aria-selected={activeTab === 'songs'}
						aria-controls="songs-panel"
					>
						<div className="flex items-center gap-2">
							<FiMusic size={16} aria-hidden="true" />
							Songs
						</div>
					</button>
					<button
						onClick={() => setActiveTab('details')}
						className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${activeTab === 'details'
							? 'border-blue-500 text-blue-600 dark:text-blue-400'
							: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
							}`}
						role="tab"
						aria-selected={activeTab === 'details'}
						aria-controls="details-panel"
					>
						<div className="flex items-center gap-2">
							<FiList size={16} aria-hidden="true" />
							Song Details
						</div>
					</button>
				</div>

				{/* Tab Content */}
				<div className="flex-1 ">
					{activeTab === 'songs' ? (
						<div
							id="songs-panel"
							className="h-full flex flex-col"
							role="tabpanel"
							aria-labelledby="songs-tab"
						>
							{/* Search */}
							<div className="p-4 border-b border-gray-200 dark:border-gray-700">
								<div className="relative">
									<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
									<input
										type="text"
										placeholder="Search songs..."
										value={songSearchQuery}
										onChange={(e) => handleSearchChange(e.target.value)}
										className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										aria-label="Search songs"
									/>
								</div>
							</div>

							{/* Songs List */}
							<div className="flex-1 overflow-y-auto p-4">
								{songsLoading ? (
									<div className="flex items-center justify-center py-8">
										<FiLoader className="animate-spin mr-2" size={16} />
										<div className="text-sm text-gray-500 dark:text-gray-400">Loading songs...</div>
									</div>
								) : displayedSongs.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
										<FiMusic size={24} className="mb-2" />
										<p className="text-sm">
											{songSearchQuery.trim() ? 'No songs found' : 'No songs available'}
										</p>
										{!songSearchQuery.trim() && (
											<p className="text-xs mt-1">
												Run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">npm run db:seed-songs</code> to add sample songs
											</p>
										)}
									</div>
								) : (
									<div className="space-y-2" role="list" aria-label="Song list">
										{displayedSongs.map((song: Song) => (
											<SongCard
												key={song.id}
												song={song}
												isClicked={clickedSong === song.id.toString()}
												onSongClick={handleSongClick}
												onSelectForDetails={handleSelectSongForDetails}
												onSongDetails={handleSongDetails}
											/>
										))}
									</div>
								)}
							</div>

							{/* Help text */}
							<div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
								<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
									<p><strong>Single click:</strong> Send full song to Preview</p>
									<p><strong>Double click:</strong> Send full song to Live</p>
									<p><strong>List icon:</strong> View song sections</p>
									<p><strong>Music icon:</strong> View song information</p>
								</div>
							</div>
						</div>
					) : (
						<div
							id="details-panel"
							role="tabpanel"
							aria-labelledby="details-tab"
						>
							<SongDetailsTab
								selectedSong={selectedSongForDetails}
								onSendSlideToPreview={handleSendSlideToPreview}
								onSendSlideToLive={handleSendSlideToLive}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Song Details Modal */}
			{selectedSong && (
				<SongDetails
					song={selectedSong}
					onClose={() => setSelectedSong(null)}
					onSendToPreview={handleSendToPreview}
					onSendToLive={handleSendToLive}
				/>
			)}
		</>
	);
};

export default SongsTab;