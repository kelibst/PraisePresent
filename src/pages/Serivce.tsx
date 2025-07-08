import Plantab from '@/components/shared/Plantab'
import { BellIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { FiPlay } from 'react-icons/fi'
import { FiList, FiBook, FiMusic, FiSliders } from 'react-icons/fi'
import ScriptureTab from '../components/shared/ScriptureTab'
import SongsTab from '../components/shared/SongsTab'
import RightPanel from '@/components/shared/RightPanel'


const Service = () => {

	const containerRef = useRef<HTMLDivElement>(null);
	const isDraggingRef = useRef(false);
	const [leftPanelWidth, setLeftPanelWidth] = useState(25);
	const [activeTab, setActiveTab] = useState('plan');

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

	const getTabIcon = (tab: string) => {
		switch (tab) {
			case 'plan': return <FiList size={16} />;
			case 'scripture': return <FiBook size={16} />;
			case 'songs': return <FiMusic size={16} />;
			case 'slides': return <FiSliders size={16} />;
			default: return <FiList size={16} />;
		}
	};

	const renderLeftPanelContent = () => {
		switch (activeTab) {
			case 'plan':
				return <Plantab  />;

			case 'scripture':
				return <ScriptureTab />;

			case 'songs':
				return <SongsTab />;


			default:
				return <div>No content You got to a wrong route. 404! </div>
		}
	};


  return (
    <div className="flex flex-col h-screen bg-background dark:bg-gray-900">
      <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
				<div className="flex items-center gap-4">
					<span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded">
						{/* {service.serviceTitle} */}New Service name
					</span>
					<span className="text-sm text-gray-500 dark:text-gray-400">
						{/* {service.date} */}
            {new Date().toLocaleDateString()}
					</span>
				</div>
				<div className="flex items-center gap-4">
					<button
						// onClick={toggleLive}
						className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${true
							? "bg-red-600 text-white hover:bg-red-700"
							: "bg-blue-600 text-white hover:bg-blue-700"
							}`}
					>
						<FiPlay className="text-white" />
						{true ? "End Live" : "Go Live"}
					</button>
					<button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
						<BellIcon size={24} />
					</button>
				</div>
			</header>
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
							{ key: 'songs', label: 'Songs' },
							{ key: 'slides', label: 'Slides' }
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
					<div className="flex-1 overflow-y-auto">
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
				<RightPanel
					leftPanelWidth={leftPanelWidth}
				/>
			</div>

    </div>
  )
}

export default Service