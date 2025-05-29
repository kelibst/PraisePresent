import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../lib/store';
import { sendVerseToPreview } from '../lib/presentationSlice';
import PreviewLivePanel from '../components/shared/PreviewLivePanel';
import QuickScriptureSearch from '../components/shared/QuickScriptureSearch';
import VersionSelector from '../components/bible/VersionSelector';
import ScriptureList from '../components/bible/ScriptureList';
import { Verse } from '../lib/bibleSlice';

const Scripture: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const [leftPanelWidth, setLeftPanelWidth] = useState(40); // percentage
	const [activeTab, setActiveTab] = useState<'search' | 'browse'>('search');

	const containerRef = useRef<HTMLDivElement>(null);
	const isDraggingRef = useRef(false);

	// Handle mouse down to start resizing
	const handleDragStart = (e: React.MouseEvent) => {
		e.preventDefault();
		isDraggingRef.current = true;
		document.body.style.cursor = 'col-resize';
		document.addEventListener('mousemove', handleDrag);
		document.addEventListener('mouseup', handleDragEnd);
	};

	// Handle dragging
	const handleDrag = (e: MouseEvent) => {
		if (!isDraggingRef.current || !containerRef.current) return;

		const containerRect = containerRef.current.getBoundingClientRect();
		const containerWidth = containerRect.width;
		const mouseX = e.clientX - containerRect.left;

		// Calculate percentage (constrain between 20% and 70%)
		let newLeftWidth = (mouseX / containerWidth) * 100;
		newLeftWidth = Math.max(20, Math.min(70, newLeftWidth));

		setLeftPanelWidth(newLeftWidth);
	};

	// Handle drag end
	const handleDragEnd = () => {
		isDraggingRef.current = false;
		document.body.style.cursor = 'default';
		document.removeEventListener('mousemove', handleDrag);
		document.removeEventListener('mouseup', handleDragEnd);
	};

	// Clean up event listeners when unmounting
	useEffect(() => {
		return () => {
			document.removeEventListener('mousemove', handleDrag);
			document.removeEventListener('mouseup', handleDragEnd);
		};
	}, []);

	const handleVerseSelect = (verse: Verse) => {
		dispatch(sendVerseToPreview(verse));
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
			{/* Header */}
			<div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div className="px-6 py-4">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Scripture
							</h1>
							<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
								Search and present Bible verses
							</p>
						</div>
						<div className="flex items-center gap-4">
							<span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded">
								Scripture Mode
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content with Resizable Panels */}
			<div ref={containerRef} className="flex flex-1 overflow-hidden relative">
				{/* Left Panel - Scripture Search and Browse */}
				<div
					className="flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
					style={{ width: `${leftPanelWidth}%` }}
				>
					{/* Tab Navigation */}
					<div className="flex border-b border-gray-200 dark:border-gray-700">
						<button
							onClick={() => setActiveTab('search')}
							className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'search'
								? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
								: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
								}`}
						>
							Quick Search
						</button>
						<button
							onClick={() => setActiveTab('browse')}
							className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'browse'
								? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
								: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
								}`}
						>
							Browse
						</button>
					</div>

					{/* Tab Content */}
					<div className="flex-1 overflow-hidden">
						{activeTab === 'search' ? (
							<div className="p-6 h-full overflow-y-auto">
								<QuickScriptureSearch
									onVerseSelect={handleVerseSelect}
									compact={false}
								/>
							</div>
						) : (
							<div className="h-full">
								<ScriptureList />
							</div>
						)}
					</div>

					{/* Quick Actions */}
					<div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
						<div className="space-y-2">
							<button className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium">
								View Recent Verses
							</button>
							<button className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium">
								Browse by Topic
							</button>
						</div>
					</div>
				</div>

				{/* Resizable Divider */}
				<div
					className="absolute h-full w-1 bg-transparent hover:bg-blue-500 cursor-col-resize flex items-center justify-center z-10 transition-colors"
					style={{ left: `${leftPanelWidth}%`, transform: 'translateX(-50%)' }}
					onMouseDown={handleDragStart}
				>
					<div className="h-16 w-1 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-blue-500 transition-colors"></div>
				</div>

				{/* Right Panel - Shared Preview & Live */}
				<PreviewLivePanel
					leftPanelWidth={leftPanelWidth}
					showControls={false}
				/>
			</div>
		</div>
	);
};

export default Scripture; 