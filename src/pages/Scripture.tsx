import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../lib/store';
import BibleSelector from '../components/bible/BibleSelector';
import ScriptureSearch from '../components/bible/ScriptureSearch';
import { Verse } from '../lib/bibleSlice';

const Scripture: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const [activeTab, setActiveTab] = useState<'browse' | 'search'>('browse');
	const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

	const handleVerseSelect = (verse: Verse) => {
		setSelectedVerse(verse);
	};

	const handleAddToPresentation = () => {
		if (selectedVerse) {
			// TODO: Add to current presentation
			console.log('Adding verse to presentation:', selectedVerse);
		}
	};

	const handleCreateSlide = () => {
		if (selectedVerse) {
			// TODO: Create a new slide with this verse
			console.log('Creating slide with verse:', selectedVerse);
		}
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
								Browse and search Bible verses for your presentations
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Panel - Scripture Browser/Search */}
					<div className="lg:col-span-2">
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							{/* Tab Navigation */}
							<div className="border-b border-gray-200 dark:border-gray-700">
								<nav className="flex space-x-8 px-6" aria-label="Tabs">
									<button
										onClick={() => setActiveTab('browse')}
										className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'browse'
												? 'border-blue-500 text-blue-600 dark:text-blue-400'
												: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
											}`}
									>
										Browse Scripture
									</button>
									<button
										onClick={() => setActiveTab('search')}
										className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'search'
												? 'border-blue-500 text-blue-600 dark:text-blue-400'
												: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
											}`}
									>
										Search Scripture
									</button>
								</nav>
							</div>

							{/* Tab Content */}
							<div className="p-6">
								{activeTab === 'browse' && (
									<BibleSelector
										onVerseSelect={handleVerseSelect}
										className="max-w-none"
									/>
								)}
								{activeTab === 'search' && (
									<ScriptureSearch
										onVerseSelect={handleVerseSelect}
										className="max-w-none"
									/>
								)}
							</div>
						</div>
					</div>

					{/* Right Panel - Selected Verse & Actions */}
					<div className="lg:col-span-1">
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								Selected Verse
							</h3>

							{selectedVerse ? (
								<div className="space-y-4">
									{/* Verse Display */}
									<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
										<div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
											{formatVerseReference(selectedVerse)}
										</div>
										<div className="text-gray-900 dark:text-white leading-relaxed">
											{selectedVerse.text}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
											{selectedVerse.version?.name} - {selectedVerse.version?.fullName}
										</div>
									</div>

									{/* Action Buttons */}
									<div className="space-y-2">
										<button
											onClick={handleCreateSlide}
											className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
										>
											Create Slide
										</button>
										<button
											onClick={handleAddToPresentation}
											className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
										>
											Add to Presentation
										</button>
									</div>

									{/* Verse Details */}
									<div className="border-t border-gray-200 dark:border-gray-600 pt-4">
										<h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
											Verse Details
										</h4>
										<div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
											<div>Book: {selectedVerse.book?.name}</div>
											<div>Testament: {selectedVerse.book?.testament}</div>
											<div>Category: {selectedVerse.book?.category}</div>
											<div>Chapter: {selectedVerse.chapter}</div>
											<div>Verse: {selectedVerse.verse}</div>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-8">
									<div className="text-gray-400 dark:text-gray-500 mb-2">
										<svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
										</svg>
									</div>
									<div className="text-gray-500 dark:text-gray-400 text-sm">
										Select a verse to see details and actions
									</div>
								</div>
							)}
						</div>

						{/* Quick Actions */}
						<div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
						<div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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