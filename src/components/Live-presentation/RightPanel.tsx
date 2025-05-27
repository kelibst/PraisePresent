import { FiSkipBack, FiSkipForward } from "react-icons/fi";


const RightPanel = ({ leftPanelWidth, previewItem, liveItem, isLive, goToPreviousSlide, sendToLive, goToNextSlide, blankToBlack, renderPreviewContent, renderLiveContent }: { leftPanelWidth: number, previewItem: any, liveItem: any, isLive: boolean, goToPreviousSlide: () => void, sendToLive: () => void, goToNextSlide: () => void, blankToBlack: () => void, renderPreviewContent: () => React.ReactNode, renderLiveContent: () => React.ReactNode }) => {
	return (
		<div
			className="flex flex-col"
			style={{ width: `${100 - leftPanelWidth}%` }}
		>
			{/* Preview Section */}
			<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
				<h2 className="text-center text-lg font-medium text-gray-800 dark:text-white mb-2">Preview</h2>

				{/* Slide Preview */}
				{renderPreviewContent()}

				{/* Navigation Controls */}
				<div className="flex justify-between items-center">
					<button
						onClick={goToPreviousSlide}
						className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
					>
						<FiSkipBack />
						Previous
					</button>

					<button
						onClick={sendToLive}
						disabled={!previewItem}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Send to Live
					</button>

					<button
						onClick={goToNextSlide}
						className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
					>
						Next
						<FiSkipForward />
					</button>
				</div>
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

				{/* Live Slide */}
				{renderLiveContent()}

				{/* Live Controls */}
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
			<div className="p-4 border-t border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-center mb-2">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
					<span className="ml-2 text-gray-700 dark:text-gray-300">Mobile Remote Control</span>
				</div>

				<div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800">
					<div className="text-center mb-2 text-gray-700 dark:text-gray-300">Current Slide:</div>
					<div className="text-center mb-4 text-sm text-gray-700 dark:text-gray-300 truncate">
						{liveItem ? liveItem.title : 'Nothing live'}
					</div>

					<div className="flex justify-between">
						<button className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
							<FiSkipBack />
						</button>
						<button className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
							<FiSkipForward />
						</button>
					</div>

					<div className="mt-3 text-center">
						<button
							onClick={blankToBlack}
							className="w-full py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
						>
							Blank to Black
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default RightPanel;