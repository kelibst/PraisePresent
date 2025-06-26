import React from 'react';
import { NavigationControls } from './NavigationControls';
import { MobileRemoteControl } from './MobileRemoteControl';
import { RightPanelProps } from './types';
import UniversalSlideRenderer from '../UniversalSlideRenderer';
import { convertVerseToSlide, convertSongSlideToSlide, convertNoteToSlide } from '../../lib/slideConverters';
import { UniversalSlide } from '../../lib/universalSlideSlice';
import { FiMonitor, FiAlertTriangle } from "react-icons/fi";

// Convert content item to Universal Slide
const convertContentToSlide = (item: any): UniversalSlide | null => {
	if (!item) return null;

	// If already a universal slide, return it
	if (item.type === 'universal-slide' && item.universalSlide) {
		return item.universalSlide;
	}

	// Convert based on content type
	switch (item.type) {
		case 'scripture':
			// Create a mock verse object for conversion with all required fields
			const mockVerse = {
				id: `verse-${Date.now()}`,
				bookId: 1,
				chapter: parseInt(item.reference?.split(':')[0]?.split(' ').pop() || '1'),
				verse: parseInt(item.reference?.split(':')[1] || '1'),
				text: item.content,
				versionId: 'kjv',
				book: {
					id: 1,
					name: item.title?.split(' ')[0] || 'Unknown',
					shortName: item.title?.split(' ')[0] || 'Unknown',
					testament: 'unknown',
					category: 'unknown',
					chapters: 1,
					order: 1
				},
				version: {
					id: 'kjv',
					name: item.translation || 'Unknown',
					fullName: item.translation || 'Unknown',
					translationId: 'kjv',
					isDefault: true
				}
			};
			return convertVerseToSlide(mockVerse, item.translation);

		case 'song':
			// Create a mock song and slide for conversion with all required fields
			const mockSong = {
				id: `song-${Date.now()}`,
				title: item.title || 'Untitled Song',
				artist: item.content?.artist || '',
				author: item.content?.artist || '',
				lyrics: item.content?.lyrics || item.content || '',
				structure: { slides: [], order: [] },
				key: item.content?.key || '',
				tempo: item.content?.tempo || '',
				tags: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				usageCount: 0
			};
			const mockSongSlide = {
				id: `slide-${Date.now()}`,
				type: 'verse' as const,
				title: item.title || 'Verse 1',
				content: item.content?.lyrics || item.content || ''
			};
			return convertSongSlideToSlide(mockSong, mockSongSlide);

		case 'announcement':
		case 'media':
		case 'slide':
			return convertNoteToSlide(
				item.title || 'Untitled',
				item.content || ''
			);

		default:
			return convertNoteToSlide(
				item.title || 'Content',
				item.content || ''
			);
	}
};

// Calculate content length for warnings
const getContentLength = (slide: UniversalSlide): number => {
	switch (slide.type) {
		case 'scripture':
			const scriptureContent = slide.content as any;
			return scriptureContent.verses?.map((v: any) => v.text).join(' ').length || 0;
		case 'song':
			const songContent = slide.content as any;
			return songContent.lyrics?.length || 0;
		case 'note':
			const noteContent = slide.content as any;
			return (noteContent.text?.length || 0) + (noteContent.bulletPoints?.join(' ').length || 0);
		case 'announcement':
			const announcementContent = slide.content as any;
			return announcementContent.message?.length || 0;
		default:
			return 0;
	}
};

// Get content length warning
const getContentWarning = (length: number): { level: 'none' | 'warning' | 'danger'; message?: string } => {
	if (length < 300) return { level: 'none' };
	if (length < 500) return {
		level: 'warning',
		message: 'Content is getting long - text will be smaller on live display'
	};
	return {
		level: 'danger',
		message: 'Content is very long - consider splitting into multiple slides'
	};
};

// Empty content component for slides
const EmptySlideContent: React.FC<{ isPreview: boolean }> = ({ isPreview }) => (
	<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-4 relative min-h-[140px] flex items-center justify-center">
		<div className="text-center text-gray-500 dark:text-gray-400">
			<FiMonitor size={48} className="mx-auto mb-2 opacity-50" />
			<p>{isPreview ? "No content in preview" : "Nothing currently live"}</p>
			<p className="text-sm mt-1">
				{isPreview ? "Select content to preview" : "Send content to live from preview"}
			</p>
		</div>
	</div>
);

// Perfect preview slide content display component
const SlideContentDisplay: React.FC<{ item: any; isPreview: boolean }> = ({ item, isPreview }) => {
	if (!item) return <EmptySlideContent isPreview={isPreview} />;

	const slide = convertContentToSlide(item);
	if (!slide) return <EmptySlideContent isPreview={isPreview} />;

	// Override slide background to ensure consistency with dark theme
	const consistentSlide = {
		...slide,
		background: {
			type: 'gradient' as const,
			colors: ['#1e1e1e', '#000000'],
			opacity: 1
		}
	};

	// Calculate content length and warning
	const contentLength = getContentLength(slide);
	const warning = getContentWarning(contentLength);

	// Perfect preview container with live display styling
	const containerStyle: React.CSSProperties = {
		width: '100%',
		aspectRatio: '16/9', // Perfect live display ratio
		background: 'linear-gradient(135deg, #1e1e1e 0%, #000000 100%)',
		borderRadius: '12px',
		overflow: 'hidden',
		position: 'relative',
		marginBottom: '1rem'
	};

	const previewBorderStyle = isPreview
		? "ring-2 ring-blue-500 ring-opacity-50 shadow-lg shadow-blue-500/25"
		: "ring-2 ring-red-500 ring-opacity-50 shadow-lg shadow-red-500/25";

	return (
		<div className="mb-4">
			{/* Content Length Warning */}
			{warning.level !== 'none' && (
				<div className={`mb-2 p-2 rounded-lg flex items-center text-sm ${warning.level === 'warning'
					? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700'
					: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
					}`}>
					<FiAlertTriangle className="mr-2 flex-shrink-0" />
					<span>{warning.message}</span>
				</div>
			)}

			{/* Perfect Preview Display */}
			<div
				className={`relative ${previewBorderStyle}`}
				style={containerStyle}
			>
				{/* Live/Preview Indicator */}
				{!isPreview && (
					<div className="absolute top-3 left-3 z-20">
						<div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse flex items-center">
							<div className="w-2 h-2 bg-white rounded-full mr-1"></div>
							LIVE
						</div>
					</div>
				)}

				{isPreview && (
					<div className="absolute top-3 left-3 z-20">
						<div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
							<div className="w-2 h-2 bg-white rounded-full mr-1"></div>
							PREVIEW
						</div>
					</div>
				)}

				{/* Content Length Indicator */}
				<div className="absolute top-3 right-3 z-20">
					<div className={`text-xs px-2 py-1 rounded-full ${warning.level === 'none' ? 'bg-green-500/20 text-green-300' :
						warning.level === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
							'bg-red-500/20 text-red-300'
						}`}>
						{contentLength} chars
					</div>
				</div>

				{/* Universal Slide Renderer - Perfect Match to Live Display */}
				<div className="w-full h-full">
					<UniversalSlideRenderer
						slide={consistentSlide}
						width={800}  // Higher resolution for better preview quality
						height={450} // 16:9 ratio
						isPreview={isPreview}
						onSlideComplete={() => { /* No action needed for preview */ }}
					/>
				</div>

				{/* Scale indicator for user reference */}
				<div className="absolute bottom-2 right-2 z-20">
					<div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
						Live Preview
					</div>
				</div>
			</div>

			{/* Content Summary */}
			<div className="mt-2 text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
				<span>
					{slide.type.charAt(0).toUpperCase() + slide.type.slice(1)} • {contentLength} characters
				</span>
				<span className={`font-medium ${warning.level === 'none' ? 'text-green-600 dark:text-green-400' :
					warning.level === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
						'text-red-600 dark:text-red-400'
					}`}>
					{warning.level === 'none' ? 'Optimal' :
						warning.level === 'warning' ? 'Long Content' : 'Very Long'}
				</span>
			</div>
		</div>
	);
};

// Main component
const RightPanel: React.FC<RightPanelProps> = ({
	leftPanelWidth,
	previewItem,
	liveItem,
	isLive,
	goToPreviousSlide,
	sendToLive,
	goToNextSlide,
	blankToBlack,
}) => {
	return (
		<div
			className="flex flex-col"
			style={{ width: `${100 - leftPanelWidth}%` }}
		>
			{/* Preview Section */}
			<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
				<h2 className="text-center text-lg font-medium text-gray-800 dark:text-white mb-4">Preview</h2>
				<SlideContentDisplay item={previewItem} isPreview={true} />
				<NavigationControls
					onPrevious={goToPreviousSlide}
					onNext={goToNextSlide}
					onSendToLive={sendToLive}
					hasPreviewItem={!!previewItem}
				/>
			</div>

			{/* Live Section */}
			<div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-center text-lg font-medium text-gray-800 dark:text-white">Currently Live</h2>
					<div className="flex items-center">
						<span className={`inline-block w-3 h-3 rounded-full mr-2 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
						<span className="text-sm text-gray-600 dark:text-gray-400">{isLive ? 'LIVE' : 'Not Live'}</span>
					</div>
				</div>

				<SlideContentDisplay item={liveItem} isPreview={false} />

				<div className="flex justify-center mt-4">
					<button
						onClick={blankToBlack}
						className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
					>
						Blank to Black
					</button>
				</div>
			</div>

			{/* Mobile Remote Control */}
			<MobileRemoteControl
				liveItem={liveItem}
				onPrevious={goToPreviousSlide}
				onNext={goToNextSlide}
				onBlankToBlack={blankToBlack}
			/>
		</div>
	);
};

export default RightPanel;