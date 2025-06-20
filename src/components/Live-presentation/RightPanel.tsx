import React from 'react';
import { ContentDisplay } from './ContentDisplay';
import { NavigationControls } from './NavigationControls';
import { MobileRemoteControl } from './MobileRemoteControl';
import { RightPanelProps } from './types';

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
				<h2 className="text-center text-lg font-medium text-gray-800 dark:text-white mb-2">Preview</h2>
				<ContentDisplay item={previewItem} isPreview={true} />
				<NavigationControls
					onPrevious={goToPreviousSlide}
					onNext={goToNextSlide}
					onSendToLive={sendToLive}
					hasPreviewItem={!!previewItem}
				/>
			</div>

			{/* Live Section */}
			<div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
				<div className="flex justify-between items-center mb-2">
					<h2 className="text-center text-lg font-medium text-gray-800 dark:text-white">Currently Live</h2>
					<div className="flex items-center">
						<span className={`inline-block w-3 h-3 rounded-full mr-2 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
						<span className="text-sm text-gray-600 dark:text-gray-400">{isLive ? 'LIVE' : 'Not Live'}</span>
					</div>
				</div>

				<ContentDisplay item={liveItem} isPreview={false} />

				<div className="flex justify-center">
					<button
						onClick={blankToBlack}
						className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
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