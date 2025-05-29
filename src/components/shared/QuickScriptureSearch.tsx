import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../lib/store';
import { sendVerseToPreview } from '../../lib/presentationSlice';
import { FiSearch, FiBook, FiClock } from 'react-icons/fi';
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
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Verse[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [recentVerses, setRecentVerses] = useState<Verse[]>([]);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLDivElement>(null);

	// Focus search input when component mounts
	useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, []);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target !== searchInputRef.current) return;

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
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [searchResults, selectedIndex]);

	// Scroll selected item into view
	useEffect(() => {
		if (resultsRef.current) {
			const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest'
				});
			}
		}
	}, [selectedIndex]);

	// Mock search function - replace with actual database search
	const searchVerses = async (query: string) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		setIsLoading(true);

		try {
			// Import the database IPC service
			const { databaseIPC } = await import('../../lib/database-ipc');

			// Search verses using the actual database
			const results = await databaseIPC.searchVerses({
				query: query.trim(),
				// You can add versionId here if you want to search specific version
				// versionId: selectedVersionId 
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
				},
				{
					id: '2',
					bookId: 19,
					chapter: 23,
					verse: 1,
					text: 'The Lord is my shepherd; I shall not want.',
					versionId: 'kjv-id',
					book: { id: 19, name: 'Psalms', shortName: 'Ps', testament: 'OT', category: 'Poetry', chapters: 150, order: 19 },
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
			setIsLoading(false);
		}
	};

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			searchVerses(searchQuery);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

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

		// Refocus search input
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	};

	const formatVerseReference = (verse: Verse) => {
		return `${verse.book?.name} ${verse.chapter}:${verse.verse}`;
	};

	return (
		<div className={`space-y-4 ${compact ? 'max-w-md' : 'max-w-2xl'}`}>
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
					placeholder="Type to search scriptures... (e.g., 'John 3:16' or 'love')"
					className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
					autoComplete="off"
				/>
				{isLoading && (
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
						Quick Search Tips:
					</h4>
					<ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
						<li>• Type book and verse: "John 3:16" or "Psalm 23:1"</li>
						<li>• Search by keywords: "love", "faith", "hope"</li>
						<li>• Use ↑↓ arrows to navigate results</li>
						<li>• Press Enter to select, Esc to clear</li>
					</ul>
				</div>
			)}
		</div>
	);
};

export default QuickScriptureSearch; 