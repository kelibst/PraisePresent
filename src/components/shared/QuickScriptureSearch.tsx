import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../lib/store';
import { sendVerseToPreview } from '../../lib/presentationSlice';
import {
	navigateToReference,
	setCurrentReference,
	parseScriptureReference,
	initializeBibleDefaults,
	loadVerses
} from '../../lib/bibleSlice';
import { FiSearch, FiBook, FiClock, FiNavigation, FiTarget } from 'react-icons/fi';
import { Verse } from '../../lib/bibleSlice';

interface QuickScriptureSearchProps {
	onVerseSelect?: (verse: Verse) => void;
	compact?: boolean;
}

const QuickScriptureSearch: React.FC<QuickScriptureSearchProps> = ({
	onVerseSelect,
	compact = false
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		selectedVersion,
		currentReference,
		verses,
		books,
		loading,
		error,
		selectedBook,
		selectedChapter,
		selectedVerse,
		isInitialized
	} = useSelector((state: RootState) => state.bible);

	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Verse[]>([]);
	const [isSearchLoading, setIsSearchLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [recentVerses, setRecentVerses] = useState<Verse[]>([]);
	const [activeTab, setActiveTab] = useState<'navigate' | 'search'>('navigate');
	const [referenceInput, setReferenceInput] = useState(currentReference);

	const searchInputRef = useRef<HTMLInputElement>(null);
	const referenceInputRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLDivElement>(null);

	// Initialize Bible defaults when component mounts
	useEffect(() => {
		if (!isInitialized) {
			dispatch(initializeBibleDefaults());
		}
	}, [dispatch, isInitialized]);

	// Sync reference input with current reference from state
	useEffect(() => {
		setReferenceInput(currentReference);
	}, [currentReference]);

	// Focus appropriate input when tab changes
	useEffect(() => {
		if (activeTab === 'navigate' && referenceInputRef.current) {
			referenceInputRef.current.focus();
		} else if (activeTab === 'search' && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [activeTab]);

	// Handle keyboard navigation for search results
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (activeTab === 'search' && e.target === searchInputRef.current) {
				switch (e.key) {
					case 'ArrowDown':
						e.preventDefault();
						setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
						break;
					case 'ArrowUp':
						e.preventDefault();
						setSelectedIndex(prev => Math.max(prev - 1, 0));
						break;
					case 'Enter':
						e.preventDefault();
						if (searchResults[selectedIndex]) {
							handleVerseSelect(searchResults[selectedIndex]);
						}
						break;
					case 'Escape':
						e.preventDefault();
						setSearchQuery('');
						setSearchResults([]);
						setSelectedIndex(0);
						break;
				}
			} else if (activeTab === 'navigate' && e.target === referenceInputRef.current) {
				switch (e.key) {
					case 'Enter':
						e.preventDefault();
						handleNavigateToReference();
						break;
					case 'Escape':
						e.preventDefault();
						setReferenceInput(currentReference);
						break;
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [activeTab, searchResults, selectedIndex, currentReference]);

	// Scroll selected item into view
	useEffect(() => {
		if (resultsRef.current && searchResults.length > 0) {
			const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest'
				});
			}
		}
	}, [selectedIndex]);

	// Search verses with actual database
	const searchVerses = async (query: string) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearchLoading(true);

		try {
			// Import the database IPC service
			const { databaseIPC } = await import('../../lib/database-ipc');

			// Search verses using the actual database
			const results = await databaseIPC.searchVerses({
				query: query.trim(),
				versionId: selectedVersion || undefined
			});

			setSearchResults(results || []);
			setSelectedIndex(0);
		} catch (error) {
			console.error('Search error:', error);

			// Fallback to mock data for demonstration if real search fails
			const mockResults: Verse[] = [
				{
					id: '1',
					bookId: 43,
					chapter: 3,
					verse: 16,
					text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
					versionId: 'kjv-id',
					book: { id: 43, name: 'John', shortName: 'John', testament: 'NT', category: 'Gospel', chapters: 21, order: 43 },
					version: {
						id: 'kjv-id',
						name: 'KJV',
						fullName: 'King James Version',
						translationId: 'en-id',
						description: 'King James Version',
						isDefault: true,
						year: 1611,
						publisher: 'Various',
						createdAt: new Date(),
						updatedAt: new Date()
					}
				}
			].filter(verse =>
				verse.text.toLowerCase().includes(query.toLowerCase()) ||
				`${verse.book?.name} ${verse.chapter}:${verse.verse}`.toLowerCase().includes(query.toLowerCase())
			);

			setSearchResults(mockResults);
			setSelectedIndex(0);
		} finally {
			setIsSearchLoading(false);
		}
	};

	// Debounce search
	useEffect(() => {
		if (activeTab === 'search') {
			const timer = setTimeout(() => {
				searchVerses(searchQuery);
			}, 300);

			return () => clearTimeout(timer);
		}
	}, [searchQuery, activeTab, selectedVersion]);

	const handleVerseSelect = (verse: Verse) => {
		// Add to recent verses
		setRecentVerses(prev => {
			const filtered = prev.filter(v => v.id !== verse.id);
			return [verse, ...filtered].slice(0, 5);
		});

		// Send to preview
		dispatch(sendVerseToPreview(verse));

		// Call callback if provided
		if (onVerseSelect) {
			onVerseSelect(verse);
		}

		// Clear search
		setSearchQuery('');
		setSearchResults([]);
		setSelectedIndex(0);

		// Refocus input
		if (activeTab === 'search' && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	};

	const handleNavigateToReference = async () => {
		if (!referenceInput.trim()) return;

		try {
			// Parse the reference first to validate it
			const parsed = parseScriptureReference(referenceInput);
			if (parsed) {
				await dispatch(navigateToReference(referenceInput)).unwrap();
				// Reference will be updated by the reducer
			} else {
				// Try to update the current reference field
				dispatch(setCurrentReference(referenceInput));
			}
		} catch (error) {
			console.error('Navigation error:', error);
			// Could show an error message here
		}
	};

	const handleReferenceInputChange = (value: string) => {
		setReferenceInput(value);
	};

	const handleVerseClick = (verse: Verse) => {
		handleVerseSelect(verse);
	};

	const formatVerseReference = (verse: Verse) => {
		return `${verse.book?.name} ${verse.chapter}:${verse.verse}`;
	};

	const getCurrentBookName = () => {
		if (selectedBook) {
			const book = books.find(b => b.id === selectedBook);
			return book?.name || '';
		}
		return '';
	};

	return (
		<div className={`space-y-4 ${compact ? 'max-w-md' : 'max-w-2xl'}`}>
			{/* Tab Navigation */}
			<div className="flex border-b border-gray-200 dark:border-gray-700">
				<button
					onClick={() => setActiveTab('navigate')}
					className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'navigate'
						? 'border-blue-500 text-blue-600 dark:text-blue-400'
						: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
						}`}
				>
					<FiNavigation className="inline w-4 h-4 mr-2" />
					Navigate
				</button>
				<button
					onClick={() => setActiveTab('search')}
					className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'search'
						? 'border-blue-500 text-blue-600 dark:text-blue-400'
						: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
						}`}
				>
					<FiSearch className="inline w-4 h-4 mr-2" />
					Search
				</button>
			</div>

			{/* Navigate Tab */}
			{activeTab === 'navigate' && (
				<div className="space-y-4">
					{/* Scripture Reference Input */}
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<FiTarget className="h-5 w-5 text-gray-400" />
						</div>
						<input
							ref={referenceInputRef}
							type="text"
							value={referenceInput}
							onChange={(e) => handleReferenceInputChange(e.target.value)}
							onBlur={handleNavigateToReference}
							placeholder="Enter scripture reference (e.g., 'John 3:16' or 'Genesis 1')"
							className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
							autoComplete="off"
						/>
						{loading && (
							<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
							</div>
						)}
					</div>

					{/* Current Reference Info */}
					{selectedBook && selectedChapter && (
						<div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-2">
								<FiBook className="h-4 w-4 text-blue-500" />
								<span className="text-sm font-medium text-blue-900 dark:text-blue-200">
									Current: {getCurrentBookName()} {selectedChapter}
									{selectedVerse ? `:${selectedVerse}` : ''}
								</span>
							</div>
							<p className="text-sm text-blue-800 dark:text-blue-300">
								{verses.length} verses loaded • Click a verse to send to preview
							</p>
						</div>
					)}

					{/* Error Display */}
					{error && (
						<div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
							<p className="text-sm text-red-800 dark:text-red-300">{error}</p>
						</div>
					)}

					{/* Verses List */}
					{verses.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
							<div className="p-3 border-b border-gray-200 dark:border-gray-700">
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{getCurrentBookName()} {selectedChapter} • {verses.length} verses
								</p>
							</div>
							<div className="divide-y divide-gray-200 dark:divide-gray-700">
								{verses.map((verse) => (
									<div
										key={verse.id}
										className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${Number(verse.id) === Number(selectedVerse) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
										onClick={() => handleVerseClick(verse)}
									>
										<div className="flex items-start gap-3">
											<span className="text-sm font-medium text-blue-600 dark:text-blue-400 min-w-[30px]">
												{verse.verse}
											</span>
											<p className="text-sm text-gray-900 dark:text-white leading-relaxed">
												{verse.text}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Navigation Tips */}
					{verses.length === 0 && !loading && (
						<div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
							<h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
								Navigation Tips:
							</h4>
							<ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
								<li>• Type book and verse: "John 3:16" or "Psalm 23:1"</li>
								<li>• Book and chapter: "Genesis 1" (shows all verses)</li>
								<li>• Just book name: "Romans" (shows chapter 1)</li>
								<li>• Press Enter to navigate, Esc to reset</li>
							</ul>
						</div>
					)}
				</div>
			)}

			{/* Search Tab */}
			{activeTab === 'search' && (
				<div className="space-y-4">
					{/* Search Input */}
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<FiSearch className="h-5 w-5 text-gray-400" />
						</div>
						<input
							ref={searchInputRef}
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by keywords (e.g., 'love', 'faith', 'hope')"
							className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
							autoComplete="off"
						/>
						{isSearchLoading && (
							<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
							</div>
						)}
					</div>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
							<div className="p-3 border-b border-gray-200 dark:border-gray-700">
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
									{searchResults.length > 0 && (
										<span className="ml-2 text-xs">
											Use ↑↓ to navigate, Enter to select, Esc to clear
										</span>
									)}
								</p>
							</div>
							<div ref={resultsRef} className="divide-y divide-gray-200 dark:divide-gray-700">
								{searchResults.map((verse, index) => (
									<div
										key={verse.id}
										className={`p-4 cursor-pointer transition-colors ${index === selectedIndex
											? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
											: 'hover:bg-gray-50 dark:hover:bg-gray-700'
											}`}
										onClick={() => handleVerseSelect(verse)}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<FiBook className="h-4 w-4 text-blue-500" />
													<span className="text-sm font-medium text-blue-600 dark:text-blue-400">
														{formatVerseReference(verse)}
													</span>
													<span className="text-xs text-gray-500 dark:text-gray-400">
														{verse.version?.name}
													</span>
												</div>
												<p className="text-gray-900 dark:text-white leading-relaxed">
													{verse.text}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Recent Verses */}
					{recentVerses.length > 0 && searchQuery === '' && (
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							<div className="p-3 border-b border-gray-200 dark:border-gray-700">
								<h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
									<FiClock className="h-4 w-4" />
									Recent Verses
								</h4>
							</div>
							<div className="divide-y divide-gray-200 dark:divide-gray-700">
								{recentVerses.map((verse) => (
									<div
										key={verse.id}
										className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
										onClick={() => handleVerseSelect(verse)}
									>
										<div className="flex items-center gap-2 mb-1">
											<span className="text-sm font-medium text-blue-600 dark:text-blue-400">
												{formatVerseReference(verse)}
											</span>
											<span className="text-xs text-gray-500 dark:text-gray-400">
												{verse.version?.name}
											</span>
										</div>
										<p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
											{verse.text}
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Search Tips */}
					{searchQuery === '' && recentVerses.length === 0 && (
						<div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
							<h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
								Search Tips:
							</h4>
							<ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
								<li>• Search by keywords: "love", "faith", "hope"</li>
								<li>• Search in current version: {selectedVersion ? books.find(b => b.id === selectedBook)?.name || 'Current Bible' : 'Select a version first'}</li>
								<li>• Use ↑↓ arrows to navigate results</li>
								<li>• Press Enter to select, Esc to clear</li>
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default QuickScriptureSearch; 