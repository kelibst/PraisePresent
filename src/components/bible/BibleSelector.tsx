import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import {
	setSelectedTranslation,
	setSelectedVersion,
	setSelectedBook,
	setSelectedChapter,
	loadTranslations,
	loadVersions,
	loadBooks,
	loadVerses,
	Verse
} from '../../lib/bibleSlice';

interface BibleSelectorProps {
	onVerseSelect?: (verse: Verse) => void;
	className?: string;
}

const BibleSelector: React.FC<BibleSelectorProps> = ({ onVerseSelect, className = '' }) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		translations,
		versions,
		books,
		selectedTranslation,
		selectedVersion,
		selectedBook,
		selectedChapter,
		verses,
		loading,
		error
	} = useSelector((state: RootState) => state.bible);

	const [selectedVerseRange, setSelectedVerseRange] = useState<{ start: number; end?: number }>({ start: 1 });

	// Get the selected book details
	const currentBook = books.find(book => book.id === selectedBook);
	const currentVersion = versions.find(v => v.id === selectedVersion);
	const currentTranslation = translations.find(t => t.id === selectedTranslation);

	// Load initial data
	useEffect(() => {
		dispatch(loadTranslations());
		dispatch(loadBooks());
	}, [dispatch]);

	// Load versions when translation changes
	useEffect(() => {
		if (selectedTranslation) {
			dispatch(loadVersions(selectedTranslation));
		}
	}, [dispatch, selectedTranslation]);

	// Load verses when version, book, or chapter changes
	useEffect(() => {
		if (selectedVersion && selectedBook && selectedChapter) {
			dispatch(loadVerses({
				versionId: selectedVersion,
				bookId: selectedBook,
				chapter: selectedChapter
			}));
		}
	}, [dispatch, selectedVersion, selectedBook, selectedChapter]);

	const handleTranslationChange = (translationId: string) => {
		dispatch(setSelectedTranslation(translationId));
	};

	const handleVersionChange = (versionId: string) => {
		dispatch(setSelectedVersion(versionId));
	};

	const handleBookChange = (bookId: number) => {
		dispatch(setSelectedBook(bookId));
		setSelectedVerseRange({ start: 1 }); // Reset verse selection
	};

	const handleChapterChange = (chapter: number) => {
		dispatch(setSelectedChapter(chapter));
		setSelectedVerseRange({ start: 1 }); // Reset verse selection
	};

	const handleVerseRangeChange = (start: number, end?: number) => {
		setSelectedVerseRange({ start, end });
	};

	const getSelectedVerses = () => {
		if (!selectedVerseRange.start) return [];

		const startVerse = selectedVerseRange.start;
		const endVerse = selectedVerseRange.end || startVerse;

		return verses.filter(verse =>
			verse.verse >= startVerse && verse.verse <= endVerse
		);
	};

	const formatReference = () => {
		if (!currentBook || !selectedChapter) return '';

		const bookName = currentBook.name;
		const chapter = selectedChapter;
		const start = selectedVerseRange.start;
		const end = selectedVerseRange.end;

		if (end && end !== start) {
			return `${bookName} ${chapter}:${start}-${end}`;
		} else {
			return `${bookName} ${chapter}:${start}`;
		}
	};

	const selectedVerses = getSelectedVerses();

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Translation Selector */}
			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Translation
				</label>
				<select
					value={selectedTranslation || ''}
					onChange={(e) => handleTranslationChange(e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					disabled={loading}
				>
					<option value="">Select Translation</option>
					{translations.map((translation) => (
						<option key={translation.id} value={translation.id}>
							{translation.name} - {translation.description || 'No description'}
						</option>
					))}
				</select>
			</div>

			{/* Version Selector */}
			{selectedTranslation && (
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Version
					</label>
					<select
						value={selectedVersion || ''}
						onChange={(e) => handleVersionChange(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
						disabled={loading}
					>
						<option value="">Select Version</option>
						{versions.map((version) => (
							<option key={version.id} value={version.id}>
								{version.name} - {version.fullName}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Book Selector */}
			{selectedVersion && (
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Book
					</label>
					<select
						value={selectedBook || ''}
						onChange={(e) => handleBookChange(parseInt(e.target.value))}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
						disabled={loading}
					>
						<option value="">Select Book</option>
						{books.map((book) => (
							<option key={book.id} value={book.id}>
								{book.name}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Chapter Selector */}
			{currentBook && selectedVersion && (
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Chapter
					</label>
					<select
						value={selectedChapter || ''}
						onChange={(e) => handleChapterChange(parseInt(e.target.value))}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
						disabled={loading}
					>
						<option value="">Select Chapter</option>
						{Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((chapter) => (
							<option key={chapter} value={chapter}>
								Chapter {chapter}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Verse Range Selector */}
			{verses.length > 0 && (
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Verse Range
					</label>
					<div className="flex gap-2">
						<select
							value={selectedVerseRange.start}
							onChange={(e) => handleVerseRangeChange(parseInt(e.target.value), selectedVerseRange.end)}
							className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
						>
							{verses.map((verse) => (
								<option key={verse.verse} value={verse.verse}>
									Verse {verse.verse}
								</option>
							))}
						</select>
						<span className="self-center text-gray-500 dark:text-gray-400">to</span>
						<select
							value={selectedVerseRange.end || ''}
							onChange={(e) => handleVerseRangeChange(selectedVerseRange.start, e.target.value ? parseInt(e.target.value) : undefined)}
							className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
						>
							<option value="">Same verse</option>
							{verses.filter(v => v.verse > selectedVerseRange.start).map((verse) => (
								<option key={verse.verse} value={verse.verse}>
									Verse {verse.verse}
								</option>
							))}
						</select>
					</div>
				</div>
			)}

			{/* Selected Version Display */}
			{currentVersion && (
				<div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
					<div className="text-sm font-medium text-blue-800 dark:text-blue-200">
						Selected: {currentVersion.name}
					</div>
					<div className="text-xs text-blue-600 dark:text-blue-300">
						{currentVersion.fullName}
						{currentVersion.year && ` (${currentVersion.year})`}
					</div>
				</div>
			)}

			{/* Scripture Display */}
			{selectedVerses.length > 0 && (
				<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
					<div className="text-sm font-medium text-gray-800 dark:text-white mb-2">
						{formatReference()} ({currentVersion?.name})
					</div>
					<div className="space-y-2">
						{selectedVerses.map((verse) => (
							<div key={verse.id} className="text-gray-700 dark:text-gray-300">
								<span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
									{verse.verse}
								</span>
								{verse.text}
							</div>
						))}
					</div>
					{onVerseSelect && selectedVerses.length > 0 && (
						<button
							onClick={() => onVerseSelect(selectedVerses[0])}
							className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
						>
							Use This Scripture
						</button>
					)}
				</div>
			)}

			{/* Loading State */}
			{loading && (
				<div className="text-center py-4">
					<div className="text-gray-500 dark:text-gray-400">Loading...</div>
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
		</div>
	);
};

export default BibleSelector; 