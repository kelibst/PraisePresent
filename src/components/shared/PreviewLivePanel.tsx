import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import { sendPreviewToLive, clearLive } from '../../lib/presentationSlice';
import { FiEye, FiMonitor, FiSkipBack, FiSkipForward, FiPlay, FiSquare } from 'react-icons/fi';

interface PreviewLivePanelProps {
	leftPanelWidth: number;
	showControls?: boolean;
	onPrevious?: () => void;
	onNext?: () => void;
}

const PreviewLivePanel: React.FC<PreviewLivePanelProps> = ({
	leftPanelWidth,
	showControls = false,
	onPrevious,
	onNext
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const { previewItem, liveItem } = useSelector((state: RootState) => state.presentation);

	const sendToLive = () => {
		if (previewItem) {
			dispatch(sendPreviewToLive());
		}
	};

	const blankToBlack = () => {
		dispatch(clearLive());
	};

	return (
		<div
			className="flex flex-col bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700"
			style={{ width: `${100 - leftPanelWidth}%` }}
		>
			{/* Controls Bar (only show in live presentation) */}
			{showControls && (
				<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-2">
						<button
							onClick={onPrevious}
							className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
							disabled={!onPrevious}
						>
							<FiSkipBack size={20} />
						</button>
						<button
							onClick={sendToLive}
							disabled={!previewItem}
							className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:text-black disabled:cursor-not-allowed font-medium flex items-center gap-2"
						>
							<FiPlay size={16} />
							Send to Live
						</button>
						<button
							onClick={onNext}
							className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
							disabled={!onNext}
						>
							<FiSkipForward size={20} />
						</button>
					</div>
					<button
						onClick={blankToBlack}
						className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center gap-2"
					>
						<FiSquare size={16} />
						Blank
					</button>
				</div>
			)}

			<div className="flex-1 flex flex-col lg:flex-row max-h-[50vh]">
				{/* Preview Panel */}
				<div className="flex-1 p-6 border-r border-gray-200 dark:border-gray-700">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
								<FiEye size={20} />
								Preview
							</h3>
						</div>

						<div className="p-6 h-full">
							{previewItem && previewItem.type === 'scripture' ? (
								<div className="space-y-4">
									{/* Verse Display */}
									<div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
										<div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
											{previewItem.reference}
										</div>
										<div className="text-lg text-gray-900 dark:text-white leading-relaxed mb-3">
											{previewItem.content}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">
											{previewItem.translation}
										</div>
									</div>

									{/* Action Buttons - only show if not in live presentation controls */}
									{!showControls && (
										<div className="space-y-2">
											<button
												onClick={sendToLive}
												className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center justify-center gap-2"
											>
												<FiMonitor size={16} />
												Send to Live
											</button>
										</div>
									)}
								</div>
							) : (
								<div className="text-center py-12">
									<div className="text-gray-400 dark:text-gray-500 mb-4">
										<FiEye className="mx-auto h-16 w-16" />
									</div>
									<div className="text-gray-500 dark:text-gray-400">
										No scripture in preview
									</div>
									<div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
										Search and select a verse to preview
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Live Panel */}
				<div className="flex-1 p-6">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
								<FiMonitor size={20} />
								Currently Live
								{liveItem && (
									<span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
										<span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
										LIVE
									</span>
								)}
							</h3>
						</div>

						<div className="p-6 h-full">
							{liveItem && liveItem.type === 'scripture' ? (
								<div className="space-y-4">
									{/* Verse Display */}
									<div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-6">
										<div className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
											{liveItem.reference}
										</div>
										<div className="text-lg text-gray-900 dark:text-white leading-relaxed mb-3">
											{liveItem.content}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">
											{liveItem.translation}
										</div>
									</div>

									{/* Live Actions */}
									<div className="flex gap-2">
										<button
											onClick={blankToBlack}
											className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center justify-center gap-2"
										>
											<FiSquare size={16} />
											Blank
										</button>
									</div>
								</div>
							) : (
								<div className="text-center py-12">
									<div className="text-gray-400 dark:text-gray-500 mb-4">
										<FiMonitor className="mx-auto h-16 w-16" />
									</div>
									<div className="text-gray-500 dark:text-gray-400">
										Nothing currently live
									</div>
									<div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
										Send content to live from preview
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>



			<div className="flex-1 flex flex-col lg:flex-row max-h-[50vh]">
				<div className="flex-1 p-6 border-r border-gray-200 dark:border-gray-700">
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
					</div>
				</div>
			</div>
		</div>
	);
};

export default PreviewLivePanel; 