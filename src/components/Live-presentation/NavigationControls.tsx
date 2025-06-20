import React from 'react';
import { FiSkipBack, FiSkipForward, FiPlay } from "react-icons/fi";
import { NavigationControlsProps } from './types';

export const NavigationControls: React.FC<NavigationControlsProps> = ({
	onPrevious,
	onNext,
	onSendToLive,
	hasPreviewItem
}) => (
	<div className="flex justify-between items-center">
		<button
			onClick={onPrevious}
			className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
		>
			<FiSkipBack />
			Previous
		</button>

		<button
			onClick={onSendToLive}
			disabled={!hasPreviewItem}
			className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<FiPlay className="mr-1" />
			Send to Live
		</button>

		<button
			onClick={onNext}
			className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
		>
			Next
			<FiSkipForward />
		</button>
	</div>
); 