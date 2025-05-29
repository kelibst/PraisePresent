import { BellIcon } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../lib/store';
import { sendPreviewToLive, clearLive } from '../lib/presentationSlice';
import { FiPlay, FiSkipBack, FiSkipForward, FiMonitor, FiEdit, FiTrash2, FiBook, FiMusic, FiList, FiSearch } from 'react-icons/fi';
import PreviewLivePanel from '../components/shared/PreviewLivePanel';
import QuickScriptureSearch from '../components/shared/QuickScriptureSearch';
import VersionSelector from '../components/bible/VersionSelector';
import { Verse } from '../lib/bibleSlice';
import ScriptureList from '@/components/bible/ScriptureList';
import ScriptureLiveList from '@/components/bible/ScriptureLiveList';

const LivePresentation = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { previewItem, liveItem } = useSelector((state: RootState) => state.presentation);

	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [isLive, setIsLive] = useState(false);
	const [activeTab, setActiveTab] = useState('plan');
	const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage

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

		// Calculate percentage (constrain between 20% and 80%)
		let newLeftWidth = (mouseX / containerWidth) * 100;
		newLeftWidth = Math.max(20, Math.min(80, newLeftWidth));

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

	// Mock data
	const serviceTitle = "Live Sunday 9am Service";
	const date = "May 18, 2024";

	const serviceItems = [
		{
			id: 1,
			type: 'song',
			title: 'Opening Song: "How Great Is Our God"',
			author: 'Chris Tomlin',
			content: 'For God so loved the world...'
		},
		{
			id: 2,
			type: 'scripture',
			title: 'Scripture Reading: John 3:16',
			author: 'NIV',
			content: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
		},
		{
			id: 3,
			type: 'video',
			title: 'Video: Welcome Intro',
			author: 'MP4 520p',
			content: 'Welcome video content'
		},
		{
			id: 4,
			type: 'sermon',
			title: 'Sermon: "The Power of Grace"',
			author: 'Pastor David Lee',
			content: 'Sermon content about grace'
		}
	];

	const songs = [
		{
			id: 1,
			title: 'How Great Is Our God',
			artist: 'Chris Tomlin',
			key: 'G'
		},
		{
			id: 2,
			title: 'Amazing Grace',
			artist: 'John Newton',
			key: 'D'
		},
		{
			id: 3,
			title: 'Great Are You Lord',
			artist: 'All Sons & Daughters',
			key: 'A'
		}
	];

	const goToNextSlide = () => {
		if (currentSlideIndex < serviceItems.length - 1) {
			setCurrentSlideIndex(prev => prev + 1);
		}
	};

	const goToPreviousSlide = () => {
		if (currentSlideIndex > 0) {
			setCurrentSlideIndex(prev => prev - 1);
		}
	};

	const toggleLive = () => {
		setIsLive(prev => !prev);
	};

	const handleVerseSelect = (verse: Verse) => {
		// Verse is automatically sent to preview by QuickScriptureSearch
		// You can add additional logic here if needed
	};

	const getTabIcon = (tab: string) => {
		switch (tab) {
			case 'plan': return <FiList size={16} />;
			case 'scripture': return <FiBook size={16} />;
			case 'songs': return <FiMusic size={16} />;
			default: return <FiList size={16} />;
		}
	};

	const renderLeftPanelContent = () => {
		switch (activeTab) {
			case 'plan':
				return (
					<div className="h-full overflow-y-auto">
						{/* Service Items */}
						<div className="p-4 space-y-3">
							{serviceItems.map((item, index) => (
								<div
									key={item.id}
									className={`p-3 rounded-lg border cursor-pointer transition-all ${index === currentSlideIndex
										? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
										: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
										}`}
									onClick={() => setCurrentSlideIndex(index)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${index === currentSlideIndex
												? 'bg-blue-500 text-white'
												: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
												}`}>
												{index + 1}
											</div>
											<div>
												<h4 className="text-sm font-medium text-gray-900 dark:text-white">
													{item.title}
												</h4>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{item.author}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-1">
											<button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
												<FiEdit size={14} className="text-gray-400" />
											</button>
											<button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
												<FiTrash2 size={14} className="text-gray-400" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				);

			case 'scripture':
				return (
					<div className="h-full flex flex-col">
						<QuickScriptureSearch />
					</div>
				);

			case 'songs':
				return (
					<div className="h-full overflow-y-auto">
						{/* Search */}
						<div className="p-4 border-b border-gray-200 dark:border-gray-700">
							<div className="relative">
								<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<input
									type="text"
									placeholder="Search songs..."
									className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>

						{/* Songs List */}
						<div className="p-4 space-y-3">
							{songs.map((song) => (
								<div
									key={song.id}
									className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-colors"
								>
									<div className="flex items-center justify-between">
										<div>
											<h4 className="text-sm font-medium text-gray-900 dark:text-white">
												{song.title}
											</h4>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{song.artist} • Key: {song.key}
											</p>
										</div>
										<FiMusic className="text-gray-400" size={16} />
									</div>
								</div>
							))}
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col h-screen bg-background dark:bg-gray-900">
			{/* Header */}
			<header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
				<div className="flex items-center gap-4">
					<span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded">
						{serviceTitle}
					</span>
					<span className="text-sm text-gray-500 dark:text-gray-400">
						{date}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<button
						onClick={toggleLive}
						className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${isLive
							? "bg-red-600 text-white hover:bg-red-700"
							: "bg-blue-600 text-white hover:bg-blue-700"
							}`}
					>
						<FiPlay className="text-white" />
						{isLive ? "End Live" : "Go Live"}
					</button>
					<button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
						<BellIcon size={24} />
					</button>
				</div>
			</header>

			{/* Main Content with Resizable Panels */}
			<div ref={containerRef} className="flex flex-1 overflow-hidden relative">
				{/* Left Panel - Service Plan, Scripture, Songs */}
				<div
					className="flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
					style={{ width: `${leftPanelWidth}%` }}
				>
					{/* Tab Navigation */}
					<div className="flex border-b border-gray-200 dark:border-gray-700">
						{[
							{ key: 'plan', label: 'Service Plan' },
							{ key: 'scripture', label: 'Scripture' },
							{ key: 'songs', label: 'Songs' }
						].map((tab) => (
							<button
								key={tab.key}
								onClick={() => setActiveTab(tab.key)}
								className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === tab.key
									? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
									: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
									}`}
							>
								{getTabIcon(tab.key)}
								{tab.label}
							</button>
						))}
					</div>

					{/* Tab Content */}
					<div className="flex-1 overflow-hidden">
						{renderLeftPanelContent()}
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

				{/* Right Panel - Shared Preview & Live with Controls */}
				<PreviewLivePanel
					leftPanelWidth={leftPanelWidth}
					showControls={true}
					onPrevious={currentSlideIndex > 0 ? goToPreviousSlide : undefined}
					onNext={currentSlideIndex < serviceItems.length - 1 ? goToNextSlide : undefined}
				/>
			</div>
		</div>
	);
};

export default LivePresentation; 