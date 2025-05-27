import { BellIcon } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../lib/store';
import { sendPreviewToLive, clearLive } from '../lib/presentationSlice';
import { FiPlay, FiSkipBack, FiSkipForward, FiMonitor, FiEdit, FiTrash2, FiBook, FiMusic, FiList } from 'react-icons/fi';
import LeftPanel from '@/components/Live-presentation/LeftPanel';
import RightPanel from '@/components/Live-presentation/RightPanel';
import RenderPreviewContent from '@/components/Live-presentation/RenderPreviewContent';
import RenderLiveItem from '@/components/Live-presentation/RenderLiveItem';

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

	const blankToBlack = () => {
		dispatch(clearLive());
		console.log("Blank to black");
	};

	const sendToLive = () => {
		if (previewItem) {
			dispatch(sendPreviewToLive());
		}
	};






	return (
		<div className="flex flex-col h-screen bg-background dark:bg-gray-900">
			{/* Header */}
			<header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-4">
					<span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded">
						{serviceTitle}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<button
						onClick={toggleLive}
						className={`flex items-center gap-2 px-4 py-2 rounded-md ${isLive
							? "bg-red-600 text-white hover:bg-red-700"
							: "bg-blue-600 text-white hover:bg-blue-700"
							}`}
					>
						<FiPlay className="text-white" />
						{isLive ? "End Live" : "Go Live"}
					</button>
					<button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
						<BellIcon size={30} />
					</button>
				</div>
			</header>

			{/* Main Content with Resizable Panels */}
			<div ref={containerRef} className="flex flex-1 overflow-hidden relative">
				{/* Left Panel - Service Plan */}
				<LeftPanel
					leftPanelWidth={leftPanelWidth}
					date={date}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					currentSlideIndex={currentSlideIndex}
					serviceItems={serviceItems}
					songs={songs}
				/>

				{/* Resizable Divider */}
				<div
					className="absolute h-full w-1 bg-transparent hover:bg-blue-500 cursor-col-resize flex items-center justify-center z-10"
					style={{ left: `${leftPanelWidth}%`, transform: 'translateX(-50%)' }}
					onMouseDown={handleDragStart}
				>
					<div className="h-16 w-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
				</div>

				{/* Right Panel - Preview & Live */}
				<RightPanel
					leftPanelWidth={leftPanelWidth}
					previewItem={previewItem}
					liveItem={liveItem}
					isLive={isLive}
					goToPreviousSlide={goToPreviousSlide}
					sendToLive={sendToLive}
					goToNextSlide={goToNextSlide}
					blankToBlack={blankToBlack}
					renderPreviewContent={() => <RenderPreviewContent previewItem={previewItem} />}
					renderLiveContent={() => <RenderLiveItem liveItem={liveItem} />}
				/>
			</div>
		</div>
	);
};

export default LivePresentation; 