import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import {
	searchVerses,
	clearSearchResults,
	Verse
} from '../../lib/bibleSlice';

// Utility function to parse scripture references
const parseScriptureReference = (reference: string): {
	book: string;
	chapter: number;
	verseStart: number;
	verseEnd?: number;
} | null => {
	// Simple regex to match patterns like "John 3:16" or "1 John 5:7-9"
	const match = reference.match(/^(\d?\s*\w+)\s+(\d+):(\d+)(?:-(\d+))?$/i);
	if (!match) return null;

	return {
		book: match[1].trim(),
		chapter: parseInt(match[2]),
		verseStart: parseInt(match[3]),
		verseEnd: match[4] ? parseInt(match[4]) : undefined
	};
};

interface ScriptureSearchProps {
	onVerseSelect?: (verse: Verse) => void;
	className?: string;
}

const ScriptureSearch: React.FC<ScriptureSearchProps> = ({ onVerseSelect, className = '' }) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		searchResults,
		loading,
		error
	} = useSelector((state: RootState) => state.bible);
	const { selectedVersion } = useSelector((state: RootState) => state.presentation);

	const [searchQuery, setSearchQuery] = useState('');
	const [searchType, setSearchType] = useState<'keyword' | 'reference' | 'topic'>('keyword');

	const handleSearch = async () => {
		if (!searchQuery.trim() || !selectedVersion) return;

		if (searchType === 'reference') {
			// Handle reference search
			try {
				const reference = parseScriptureReference(searchQuery);
				if (reference) {
					// For reference search, we could load specific verses
					// For now, we'll use keyword search with the book name
					dispatch(searchVerses({
						query: reference.book,
						versionId: selectedVersion
					}));
				}
			} catch (error) {
				console.error('Invalid reference format:', error);
			}
		} else {
			// Handle keyword and topic search
			dispatch(searchVerses({
				query: searchQuery,
				versionId: selectedVersion
			}));
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	const handleClearResults = () => {
		dispatch(clearSearchResults());
		setSearchQuery('');
	};

	const formatVerseReference = (verse: Verse) => {
		return `${verse.book?.name} ${verse.chapter}:${verse.verse}`;
	};

	const highlightSearchTerm = (text: string, searchTerm: string) => {
		if (!searchTerm || searchType === 'reference') return text;

		const regex = new RegExp(`(${searchTerm})`, 'gi');
		const parts = text.split(regex);

		return parts.map((part, index) =>
			regex.test(part) ? (
				<mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
					{part}
				</mark>
			) : part
		);
	};

	if (!selectedVersion) {
		return (
			<div className="text-center py-8">
				<div className="text-gray-500 dark:text-gray-400">
					Please select a Bible version from the sidebar to search scriptures.
				</div>
			</div>
		);
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Search Controls */}
			<div className="space-y-3">
				{/* Search Type Selector */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Search Type
					</label>
					<div className="flex gap-2">
						<button
							onClick={() => setSearchType('keyword')}
							className={`px-3 py-2 rounded-md text-sm font-medium ${searchType === 'keyword'
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
								}`}
						>
							Keyword
						</button>
						<button
							onClick={() => setSearchType('reference')}
							className={`px-3 py-2 rounded-md text-sm font-medium ${searchType === 'reference'
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
								}`}
						>
							Reference
						</button>
						<button
							onClick={() => setSearchType('topic')}
							className={`px-3 py-2 rounded-md text-sm font-medium ${searchType === 'topic'
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
								}`}
						>
							Topic
						</button>
					</div>
				</div>

				{/* Search Input */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						{searchType === 'keyword' && 'Search for words or phrases'}
						{searchType === 'reference' && 'Enter reference (e.g., John 3:16, Romans 8:28-30)'}
						{searchType === 'topic' && 'Search by topic (e.g., love, faith, hope)'}
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder={
								searchType === 'keyword' ? 'Enter keywords...' :
									searchType === 'reference' ? 'e.g., John 3:16' :
										'e.g., love, faith, hope'
							}
							className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
							disabled={loading}
						/>
						<button
							onClick={handleSearch}
							disabled={loading || !searchQuery.trim()}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Searching...' : 'Search'}
						</button>
					</div>
				</div>
			</div>

			{/* Search Results */}
			{searchResults.length > 0 && (
				<div className="space-y-3">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white">
							Search Results ({searchResults.length})
						</h3>
						<button
							onClick={handleClearResults}
							className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
						>
							Clear Results
						</button>
					</div>

					<div className="space-y-2 max-h-96 overflow-y-auto">
						{searchResults.map((verse) => (
							<div
								key={verse.id}
								className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
								onClick={() => onVerseSelect?.(verse)}
							>
								<div className="flex justify-between items-start mb-2">
									<div className="text-sm font-medium text-blue-600 dark:text-blue-400">
										{formatVerseReference(verse)}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										{verse.version?.name}
									</div>
								</div>
								<div className="text-gray-700 dark:text-gray-300 text-sm">
									{highlightSearchTerm(verse.text, searchQuery)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* No Results */}
			{!loading && searchResults.length === 0 && searchQuery && (
				<div className="text-center py-8">
					<div className="text-gray-500 dark:text-gray-400">
						No verses found for "{searchQuery}"
					</div>
					<div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
						Try different keywords or check your spelling
					</div>
				</div>
			)}

			{/* Loading State */}
			{loading && (
				<div className="text-center py-8">
					<div className="text-gray-500 dark:text-gray-400">Searching...</div>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
					<div className="text-red-800 dark:text-red-200 text-sm">
						Error: {error}
					</div>
				</div>
			)}

			{/* Search Tips */}
			{!searchQuery && (
				<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
					<h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
						Search Tips:
					</h4>
					<ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
						<li>• <strong>Keyword:</strong> Search for any word or phrase in the Bible</li>
						<li>• <strong>Reference:</strong> Enter specific verses like "John 3:16" or "Romans 8:28-30"</li>
						<li>• <strong>Topic:</strong> Search for themes like "love", "faith", "hope", etc.</li>
					</ul>
				</div>
			)}
		</div>
	);
};

export default ScriptureSearch; 