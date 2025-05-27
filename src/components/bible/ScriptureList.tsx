import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import { loadBooks, loadVerses } from '../../lib/bibleSlice';
import {
	addToScriptureList,
	removeFromScriptureList,
	sendVerseToPreview,
	sendVerseToLive
} from '../../lib/presentationSlice';
import { FiX, FiEye, FiMonitor } from 'react-icons/fi';

const ScriptureList: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { books, loading } = useSelector((state: RootState) => state.bible);
	const { selectedVersion, scriptureList } = useSelector((state: RootState) => state.presentation);

	const [selectedBook, setSelectedBook] = useState<number | null>(null);
	const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
	const [verses, setVerses] = useState<any[]>([]);
	const [loadingVerses, setLoadingVerses] = useState(false);

	// Load books on mount
	useEffect(() => {
		dispatch(loadBooks());
	}, [dispatch]);

	// Load verses when book, chapter, or version changes
	useEffect(() => {
		if (selectedVersion && selectedBook && selectedChapter) {
			setLoadingVerses(true);
			dispatch(loadVerses({
				versionId: selectedVersion,
				bookId: selectedBook,
				chapter: selectedChapter
			})).then((result: any) => {
				if (result.payload) {
					setVerses(result.payload);
				}
				setLoadingVerses(false);
			});
		}
	}, [selectedVersion, selectedBook, selectedChapter, dispatch]);

	const currentBook = books.find(book => book.id === selectedBook);

	const handleBookChange = (bookId: number) => {
		setSelectedBook(bookId);
		setSelectedChapter(null);
		setVerses([]);
	};

	const handleChapterChange = (chapter: number) => {
		setSelectedChapter(chapter);
	};

	const handleVerseClick = (verse: any, event: React.MouseEvent) => {
		if (event.detail === 1) {
			// Single click - add to scripture list
			dispatch(addToScriptureList(verse));
		}
	};

	const handleVerseKeyDown = (verse: any, event: React.KeyboardEvent) => {
		if (event.key === 'Tab') {
			event.preventDefault();
			dispatch(sendVerseToPreview(verse));
		} else if (event.key === 'Enter') {
			dispatch(sendVerseToLive(verse));
		}
	};

	const handleVerseDoubleClick = (verse: any) => {
		dispatch(sendVerseToLive(verse));
	};

	const handleRemoveFromList = (verseId: string) => {
		dispatch(removeFromScriptureList(verseId));
	};

	const handleSendToPreview = (verse: any) => {
		dispatch(sendVerseToPreview(verse));
	};

	const handleSendToLive = (verse: any) => {
		dispatch(sendVerseToLive(verse));
	};

	if (!selectedVersion) {
		return (
			<div className="p-4 text-center text-gray-500 dark:text-gray-400">
				<div className="text-sm">Select a Bible version to browse scriptures</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Scripture List */}
			{scriptureList.length > 0 && (
				<div className="border-b border-gray-200 dark:border-gray-700 p-4">
					<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
						Scripture Queue ({scriptureList.length})
					</h3>
					<div className="space-y-2 max-h-40 overflow-y-auto">
						{scriptureList.map((verse) => (
							<div
								key={verse.id}
								className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-xs"
							>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-blue-800 dark:text-blue-200 truncate">
										{verse.book?.name} {verse.chapter}:{verse.verse}
									</div>
									<div className="text-blue-600 dark:text-blue-300 truncate">
										{verse.text.substring(0, 50)}...
									</div>
								</div>
								<div className="flex items-center gap-1 ml-2">
									<button
										onClick={() => handleSendToPreview(verse)}
										className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
										title="Send to Preview (Tab)"
									>
										<FiEye size={12} />
									</button>
									<button
										onClick={() => handleSendToLive(verse)}
										className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 rounded"
										title="Send to Live (Double-click)"
									>
										<FiMonitor size={12} />
									</button>
									<button
										onClick={() => handleRemoveFromList(verse.id)}
										className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded"
										title="Remove from list"
									>
										<FiX size={12} />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Book Selector */}
			<div className="p-4 border-b border-gray-200 dark:border-gray-700">
				<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
					Book
				</label>
				<select
					value={selectedBook || ''}
					onChange={(e) => handleBookChange(parseInt(e.target.value))}
					className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

			{/* Chapter Selector */}
			{currentBook && (
				<div className="p-4 border-b border-gray-200 dark:border-gray-700">
					<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
						Chapter
					</label>
					<select
						value={selectedChapter || ''}
						onChange={(e) => handleChapterChange(parseInt(e.target.value))}
						className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

			{/* Verses List */}
			<div className="flex-1 overflow-y-auto">
				{loadingVerses ? (
					<div className="p-4 text-center text-gray-500 dark:text-gray-400">
						<div className="text-xs">Loading verses...</div>
					</div>
				) : verses.length > 0 ? (
					<div className="p-2">
						<div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
							Click to add • Tab for preview • Double-click for live
						</div>
						<div className="space-y-1">
							{verses.map((verse) => (
								<div
									key={verse.id}
									className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
									tabIndex={0}
									onClick={(e) => handleVerseClick(verse, e)}
									onDoubleClick={() => handleVerseDoubleClick(verse)}
									onKeyDown={(e) => handleVerseKeyDown(verse, e)}
								>
									<div className="flex items-start gap-2">
										<span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 min-w-[20px]">
											{verse.verse}
										</span>
										<div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
											{verse.text}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : selectedBook && selectedChapter ? (
					<div className="p-4 text-center text-gray-500 dark:text-gray-400">
						<div className="text-xs">No verses found</div>
					</div>
				) : (
					<div className="p-4 text-center text-gray-500 dark:text-gray-400">
						<div className="text-xs">Select a book and chapter to view verses</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ScriptureList; 