import { FiMonitor } from "react-icons/fi";

// Render live content
const RenderLiveItem = ({ liveItem }: { liveItem: any }) => {
	if (!liveItem) {
		return (
			<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-4 relative min-h-[140px] flex items-center justify-center">
				<div className="text-center text-gray-500 dark:text-gray-400">
					<FiMonitor size={48} className="mx-auto mb-2 opacity-50" />
					<p>Nothing currently live</p>
					<p className="text-sm mt-1">Send content to live from preview</p>
				</div>
			</div>
		);
	}

	if (liveItem.type === 'scripture') {
		return (
			<div className="bg-gradient-to-r from-purple-600 to-indigo-800 text-white rounded-lg p-6 mb-4 relative">
				<div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
					LIVE
				</div>
				<div className="text-center flex flex-col items-center justify-center min-h-[140px]">
					<h3 className="text-xl font-bold mb-3 uppercase">{liveItem.title}</h3>
					<p className="text-lg mb-3 leading-relaxed">
						{liveItem.content}
					</p>
					<span className="text-sm font-medium text-blue-200">{liveItem.reference} - {liveItem.translation}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-r from-purple-600 to-indigo-800 text-white rounded-lg p-6 mb-4 relative">
			<div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
				LIVE
			</div>
			<div className="text-center flex flex-col items-center justify-center min-h-[140px]">
				<h3 className="text-xl font-bold mb-3">{liveItem.title}</h3>
				<p className="text-lg mb-3">{liveItem.content}</p>
			</div>
		</div>
	);
};

export default RenderLiveItem;