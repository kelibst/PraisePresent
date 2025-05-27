import { FiEdit, FiTrash2, FiBook } from "react-icons/fi";

export default function RenderTabContent({ activeTab, currentSlideIndex, serviceItems, songs }: { activeTab: string, currentSlideIndex: number, serviceItems: any[], songs: any[] }) {
	switch (activeTab) {
		case 'plan':
			return (
				<div className="space-y-3">
					{serviceItems.map((item, index) => (
						<div
							key={item.id}
							className={`flex items-start p-3 rounded-lg border ${currentSlideIndex === index
								? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700"
								: "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
								}`}
						>
							<div className="flex-1">
								<div className="flex justify-between">
									<h3 className="font-medium text-gray-800 dark:text-white">{item.title}</h3>
									<div className="flex items-center gap-2">
										<button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
											<FiEdit size={16} />
										</button>
										<button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
											<FiTrash2 size={16} />
										</button>
									</div>
								</div>
								<p className="text-sm text-gray-500 dark:text-gray-400">{item.author}</p>
							</div>
						</div>
					))}
				</div>
			);
		case 'scripture':
			return (
				<div className="space-y-4 p-4">
					<div className="text-center text-gray-500 dark:text-gray-400">
						<FiBook size={48} className="mx-auto mb-2 opacity-50" />
						<p className="text-sm">Scripture selection is now available in the sidebar.</p>
						<p className="text-xs mt-1">Select a Bible version and browse scriptures from the left panel.</p>
					</div>
				</div>
			);
		case 'songs':
			return (
				<div className="space-y-3">
					{songs.map((song) => (
						<div
							key={song.id}
							className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
						>
							<div className="flex-1">
								<div className="flex justify-between">
									<h3 className="font-medium text-gray-800 dark:text-white">{song.title}</h3>
									<span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">Key: {song.key}</span>
								</div>
								<p className="text-sm text-gray-500 dark:text-gray-400">{song.artist}</p>
								<div className="flex gap-2 mt-2">
									<button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Lyrics</button>
									<button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Show in Preview</button>
								</div>
							</div>
						</div>
					))}
				</div>
			);
		default:
			return null;
	}
};