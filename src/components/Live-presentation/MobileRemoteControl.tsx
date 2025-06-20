import React from 'react';
import { FiSkipBack, FiSkipForward, FiSmartphone } from "react-icons/fi";
import { MobileRemoteControlProps } from './types';

export const MobileRemoteControl: React.FC<MobileRemoteControlProps> = ({
	liveItem,
	onPrevious,
	onNext,
	onBlankToBlack,
}) => (
	<div className="p-4 border-t border-gray-200 dark:border-gray-700">
		<div className="flex items-center justify-center mb-2">
			<FiSmartphone className="h-6 w-6 text-gray-500 dark:text-gray-400" />
			<span className="ml-2 text-gray-700 dark:text-gray-300">Mobile Remote Control</span>
		</div>

		<div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800">
			<div className="text-center mb-2 text-gray-700 dark:text-gray-300">Current Slide:</div>
			<div className="text-center mb-4 text-sm text-gray-700 dark:text-gray-300 truncate">
				{liveItem ? liveItem.title : 'Nothing live'}
			</div>

			<div className="flex justify-between">
				<button
					onClick={onPrevious}
					className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-700 dark:text-gray-300"
				>
					<FiSkipBack />
				</button>
				<button
					onClick={onNext}
					className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-700 dark:text-gray-300"
				>
					<FiSkipForward />
				</button>
			</div>

			<div className="mt-3 text-center">
				<button
					onClick={onBlankToBlack}
					className="w-full py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
				>
					Blank to Black
				</button>
			</div>
		</div>
	</div>
); 