import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../lib/store";
import {
  loadBooks,
  loadVerses,
  initializeBibleDefaults,
  setSelectedBook,
  setSelectedChapter,
} from "../../lib/bibleSlice";
import {
  addToScriptureList,
  removeFromScriptureList,
  sendVerseToPreview,
  sendVerseToLiveDisplay,
} from "../../lib/presentationSlice";
import { FiX, FiEye, FiMonitor } from "react-icons/fi";

const ScriptureList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    books,
    loading,
    selectedVersion,
    selectedBook,
    selectedChapter,
    verses,
    isInitialized,
  } = useSelector((state: RootState) => state.bible);
  const { scriptureList } = useSelector(
    (state: RootState) => state.presentation
  );

  const [localSelectedBook, setLocalSelectedBook] = useState<number | null>(
    selectedBook
  );
  const [localSelectedChapter, setLocalSelectedChapter] = useState<
    number | null
  >(selectedChapter);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Initialize Bible defaults when component mounts
  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeBibleDefaults());
    }
  }, [dispatch, isInitialized]);

  // Sync local state with Redux state
  useEffect(() => {
    setLocalSelectedBook(selectedBook);
  }, [selectedBook]);

  useEffect(() => {
    setLocalSelectedChapter(selectedChapter);
  }, [selectedChapter]);

  // Load books if not already loaded
  useEffect(() => {
    if (isInitialized && books.length === 0) {
      dispatch(loadBooks());
    }
  }, [dispatch, isInitialized, books.length]);

  // Load verses when selections change
  useEffect(() => {
    if (selectedVersion && localSelectedBook && localSelectedChapter) {
      setLoadingVerses(true);
      dispatch(
        loadVerses({
          versionId: selectedVersion,
          bookId: localSelectedBook,
          chapter: localSelectedChapter,
        })
      ).finally(() => {
        setLoadingVerses(false);
      });
    }
  }, [selectedVersion, localSelectedBook, localSelectedChapter, dispatch]);

  const currentBook = books.find((book) => book.id === localSelectedBook);

  const handleBookChange = (bookId: number) => {
    setLocalSelectedBook(bookId);
    setLocalSelectedChapter(1); // Reset to chapter 1 when book changes
    dispatch(setSelectedBook(bookId));
    dispatch(setSelectedChapter(1));
  };

  const handleChapterChange = (chapter: number) => {
    setLocalSelectedChapter(chapter);
    dispatch(setSelectedChapter(chapter));
  };

  const handleVerseClick = (verse: any, event: React.MouseEvent) => {
    if (event.detail === 1) {
      // Single click - add to scripture list
      dispatch(addToScriptureList(verse));
    }
  };

  const handleVerseKeyDown = (verse: any, event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      dispatch(sendVerseToPreview(verse));
    } else if (event.key === "Enter") {
      dispatch(sendVerseToLiveDisplay(verse));
    }
  };

  const handleVerseDoubleClick = (verse: any) => {
    dispatch(sendVerseToLiveDisplay(verse));
  };

  const handleRemoveFromList = (verseId: string) => {
    dispatch(removeFromScriptureList(verseId));
  };

  const handleSendToPreview = (verse: any) => {
    dispatch(sendVerseToPreview(verse));
  };

  const handleSendToLive = (verse: any) => {
    dispatch(sendVerseToLiveDisplay(verse));
  };

  // Show loading state during initialization
  if (!isInitialized || loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-sm">Initializing Bible...</div>
        </div>
      </div>
    );
  }

  if (!selectedVersion) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="text-sm">Loading Bible version...</div>
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

      {/* Current Selection Info */}
      {currentBook && localSelectedChapter && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/30">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Current: {currentBook.name} {localSelectedChapter}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {verses.length} verses • {selectedVersion || "No version"} selected
          </div>
        </div>
      )}

      {/* Book Selector */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Book
        </label>
        <select
          value={localSelectedBook || ""}
          onChange={(e) => handleBookChange(parseInt(e.target.value))}
          className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          disabled={loading || books.length === 0}
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
            value={localSelectedChapter || ""}
            onChange={(e) => handleChapterChange(parseInt(e.target.value))}
            className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select Chapter</option>
            {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(
              (chapter) => (
                <option key={chapter} value={chapter}>
                  Chapter {chapter}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {/* Verses List */}
      <div className="flex-1 overflow-y-auto">
        {loadingVerses ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
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
        ) : localSelectedBook && localSelectedChapter ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="text-xs">No verses found</div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="text-xs">
              Select a book and chapter to view verses
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptureList;
