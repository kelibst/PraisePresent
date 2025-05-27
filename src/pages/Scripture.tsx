import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../lib/store';
import { sendVerseToPreview, sendVerseToLive } from '../lib/presentationSlice';
import ScriptureSearch from '../components/bible/ScriptureSearch';
import { Verse } from '../lib/bibleSlice';
import { FiEye, FiMonitor } from 'react-icons/fi';

const Scripture: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { previewItem, liveItem } = useSelector((state: RootState) => state.presentation);
	const [activeTab, setActiveTab] = useState<'search'>('search');

	const handleVerseSelect = (verse: Verse) => {
		// Send to preview by default
		dispatch(sendVerseToPreview(verse));
	};

	const handleSendToPreview = (verse: Verse) => {
		dispatch(sendVerseToPreview(verse));
	};

	const handleSendToLive = (verse: Verse) => {
		dispatch(sendVerseToLive(verse));
	};

	const formatVerseReference = (verse: Verse) => {
		return `${verse.book?.name} ${verse.chapter}:${verse.verse}`;
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Header */}
			<div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-6">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
								Scripture
							</h1>
							<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
								Search Bible verses and manage your scripture presentations
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Panel - Scripture Search */}
					<div className="lg:col-span-2">
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							{/* Header */}
							<div className="border-b border-gray-200 dark:border-gray-700 p-6">
								<h2 className="text-lg font-medium text-gray-900 dark:text-white">
									Scripture Search
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									Bible version selection is available in the sidebar. Browse scriptures from the left panel.
								</p>
							</div>

							{/* Search Content */}
							<div className="p-6">
								<ScriptureSearch
									onVerseSelect={handleVerseSelect}
									className="max-w-none"
								/>
							</div>
						</div>
					</div>

					{/* Right Panel - Preview & Live Status */}
					<div className="lg:col-span-1 space-y-6">
						{/* Preview Panel */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								Preview
							</h3>

							{previewItem && previewItem.type === 'scripture' ? (
								<div className="space-y-4">
									{/* Verse Display */}
									<div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
										<div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
											{previewItem.reference}
										</div>
										<div className="text-gray-900 dark:text-white leading-relaxed">
											{previewItem.content}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
											{previewItem.translation}
										</div>
									</div>

									{/* Action Buttons */}
									<div className="space-y-2">
										<button
											onClick={() => handleSendToLive(previewItem.verse!)}
											className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center justify-center gap-2"
										>
											<FiMonitor size={16} />
											Send to Live
										</button>
									</div>
								</div>
							) : (
								<div className="text-center py-8">
									<div className="text-gray-400 dark:text-gray-500 mb-2">
										<FiEye className="mx-auto h-12 w-12" />
									</div>
									<div className="text-gray-500 dark:text-gray-400 text-sm">
										No scripture in preview
									</div>
									<div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
										Search and select a verse to preview
									</div>
								</div>
							)}
						</div>

						{/* Live Panel */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								Currently Live
							</h3>

							{liveItem && liveItem.type === 'scripture' ? (
								<div className="space-y-4">
									{/* Live Indicator */}
									<div className="flex items-center gap-2 mb-3">
										<span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
										<span className="text-sm font-medium text-red-600 dark:text-red-400">LIVE</span>
									</div>

									{/* Verse Display */}
									<div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
										<div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
											{liveItem.reference}
										</div>
										<div className="text-gray-900 dark:text-white leading-relaxed">
											{liveItem.content}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
											{liveItem.translation}
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-8">
									<div className="text-gray-400 dark:text-gray-500 mb-2">
										<FiMonitor className="mx-auto h-12 w-12" />
									</div>
									<div className="text-gray-500 dark:text-gray-400 text-sm">
										Nothing currently live
									</div>
									<div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
										Send content to live from preview
									</div>
								</div>
							)}
						</div>

						{/* Quick Actions */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								Quick Actions
							</h3>
							<div className="space-y-2">
								<button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
									View Recent Verses
								</button>
								<button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
									Browse Topics
								</button>
								<button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
									Manage Favorites
								</button>
							</div>
						</div>

						{/* Scripture Statistics */}
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								Scripture Library
							</h3>
							<div className="space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600 dark:text-gray-400">Translations</span>
									<span className="font-medium text-gray-900 dark:text-white">10</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600 dark:text-gray-400">Books</span>
									<span className="font-medium text-gray-900 dark:text-white">66</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600 dark:text-gray-400">Verses</span>
									<span className="font-medium text-gray-900 dark:text-white">31,000+</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600 dark:text-gray-400">Topics</span>
									<span className="font-medium text-gray-900 dark:text-white">15</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Scripture; 