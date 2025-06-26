import React from 'react';
import { FiMonitor } from "react-icons/fi";
import { ContentItem, ContentDisplayProps } from './types';
import UniversalSlideRenderer from '../UniversalSlideRenderer';

// Empty content component
export const EmptyContent: React.FC<{ isPreview: boolean }> = ({ isPreview }) => (
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

// Song content component
export const SongContent: React.FC<{ item: ContentItem }> = ({ item }) => (
	<>
		<h3 className="text-xl font-bold mb-3">
			<span className="mr-2">🎵</span>
			{item.title}
		</h3>
		{item.content?.artist && (
			<p className="text-sm text-blue-200 mb-3">{item.content.artist}</p>
		)}
		{item.content?.lyrics && (
			<div className="text-lg mb-3 leading-relaxed whitespace-pre-line">
				{item.content.lyrics}
			</div>
		)}
		{(item.content?.key || item.content?.tempo) && (
			<div className="text-sm text-blue-200">
				{item.content.key && `Key: ${item.content.key}`}
				{item.content.key && item.content.tempo && " • "}
				{item.content.tempo && `Tempo: ${item.content.tempo}`}
			</div>
		)}
	</>
);

// Scripture content component
export const ScriptureContent: React.FC<{ item: ContentItem }> = ({ item }) => (
	<>
		<h3 className="text-xl font-bold mb-3 uppercase">{item.title}</h3>
		<p className="text-lg mb-3 leading-relaxed">{item.content}</p>
		<span className="text-sm font-medium text-blue-200">
			{item.reference} {item.translation && `- ${item.translation}`}
		</span>
	</>
);

// Generic content component
export const GenericContent: React.FC<{ item: ContentItem }> = ({ item }) => (
	<>
		<h3 className="text-xl font-bold mb-3">{item.title}</h3>
		<p className="text-lg mb-3">{item.content}</p>
	</>
);

// Universal Slide content component
export const UniversalSlideContent: React.FC<{ item: ContentItem }> = ({ item }) => {
	if (!item.universalSlide) {
		return (
			<div className="text-center text-red-300">
				<p>Universal slide data missing</p>
			</div>
		);
	}

	return (
		<div className="w-full h-full min-h-[200px] rounded-lg overflow-hidden">
			<UniversalSlideRenderer
				slide={item.universalSlide}
				width={400}
				height={225}
				isPreview={true}
				onSlideComplete={() => { /* No action needed for preview */ }}
			/>
		</div>
	);
};

// Main content display component
export const ContentDisplay: React.FC<ContentDisplayProps> = ({ item, isPreview }) => {

	console.log(item, 'item');
	console.log(isPreview, 'isPreview');
	if (!item) return <EmptyContent isPreview={isPreview} />;

	const baseClasses = `rounded-lg p-6 mb-4 relative min-h-[140px] ${isPreview
		? "bg-gradient-to-r from-blue-600 to-indigo-700"
		: "bg-gradient-to-r from-purple-600 to-indigo-800"
		} text-white`;

	return (
		<div className={baseClasses}>
			{!isPreview && (
				<div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
					LIVE
				</div>
			)}
			<div className="text-center flex flex-col items-center justify-center">
				{item.type === 'song' && <SongContent item={item} />}
				{item.type === 'scripture' && <ScriptureContent item={item} />}
				{item.type === 'universal-slide' && <UniversalSlideContent item={item} />}
				{['announcement', 'media', 'slide'].includes(item.type) && <GenericContent item={item} />}
			</div>
		</div>
	);
}; 