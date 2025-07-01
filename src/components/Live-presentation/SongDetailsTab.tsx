import React, { useState, useCallback, useMemo } from 'react';
import { FiMusic, FiUser, FiList } from 'react-icons/fi';
import { Song, SongSlide } from '@/lib/songSlice';

// Constants for better maintainability
const DOUBLE_CLICK_TIMEOUT = 500;

interface SongDetailsTabProps {
	selectedSong: Song | null;
	onSendSlideToPreview: (song: Song, slide: SongSlide) => void;
	onSendSlideToLive: (song: Song, slide: SongSlide) => void;
}

const SongDetailsTab: React.FC<SongDetailsTabProps> = ({
	selectedSong,
	onSendSlideToPreview,
	onSendSlideToLive
}) => {
	const [clickedSlide, setClickedSlide] = useState<string | null>(null);

	const handleSlideClick = useCallback(async (slide: SongSlide) => {
		if (!selectedSong) return;

		const slideId = slide.id;

		if (clickedSlide === slideId) {
			// Double click - send to live
			setClickedSlide(null);
			await onSendSlideToLive(selectedSong, slide);
		} else {
			// First click - send to preview and set up for potential double click
			setClickedSlide(slideId);
			await onSendSlideToPreview(selectedSong, slide);

			// Clear the clicked state after delay to reset double-click detection
			setTimeout(() => {
				setClickedSlide(null);
			}, DOUBLE_CLICK_TIMEOUT);
		}
	}, [selectedSong, clickedSlide, onSendSlideToPreview, onSendSlideToLive]);

	const slides = useMemo(() => selectedSong?.structure?.slides || [], [selectedSong]);

	if (!selectedSong) {
		return (
			<div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
				<div className="text-center">
					<FiMusic size={48} className="mx-auto mb-4 opacity-50" />
					<p className="text-lg font-medium mb-2">No Song Selected</p>
					<p className="text-sm">Click on a song from the Songs tab to view its details</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col overflow-y-auto">
			{/* Song Header */}
			<div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
					{selectedSong.title}
				</h3>
				<div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
					{selectedSong.artist && (
						<span className="flex items-center gap-1">
							<FiUser size={14} aria-hidden="true" />
							{selectedSong.artist}
						</span>
					)}
					{selectedSong.key && <span>Key: {selectedSong.key}</span>}
					{selectedSong.tempo && <span>Tempo: {selectedSong.tempo}</span>}
				</div>
			</div>

			{/* Song Sections/Slides */}
			<div className="flex-1 overflow-y-auto p-4">
				{slides.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
						<FiList size={24} className="mb-2" />
						<p className="text-sm">No song sections available</p>
						<p className="text-xs mt-1">This song doesn't have structured sections</p>
					</div>
				) : (
					<div className="space-y-3 overflow-y-auto" role="list" aria-label="Song sections">
						{slides.map((slide: SongSlide, index: number) => (
							<div
								key={slide.id}
								className={`p-4 rounded-lg border cursor-pointer transition-all group focus-within:ring-2 focus-within:ring-blue-500 ${clickedSlide === slide.id
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
									: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
									}`}
								onClick={() => handleSlideClick(slide)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleSlideClick(slide);
									}
								}}
								tabIndex={0}
								role="button"
								aria-label={`${slide.title} section, click to preview, double-click to send live`}
							>
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2">
										<span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-medium">
											{index + 1}
										</span>
										<h4 className="text-sm font-medium text-gray-900 dark:text-white">
											{slide.title}
										</h4>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
											{slide.type}
										</span>
									</div>
								</div>

								{/* Slide Content Preview */}
								<div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
									<div className="whitespace-pre-line line-clamp-4">
										{slide.content}
									</div>
								</div>

								{/* Character count */}
								<div className="mt-2 text-xs text-gray-400">
									{slide.content.length} characters
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Help text */}
			<div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
				<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
					<p><strong>Single click:</strong> Send section to Preview</p>
					<p><strong>Double click:</strong> Send section to Live</p>
					<p><strong>Sections:</strong> Individual verses, choruses, and bridges</p>
				</div>
			</div>
		</div>
	);
};

export default SongDetailsTab; 