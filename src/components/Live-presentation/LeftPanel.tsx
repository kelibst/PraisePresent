import { FiMonitor, FiList, FiBook, FiMusic } from 'react-icons/fi';
import RenderTabContent from './RenderTabContent';

const LeftPanel = ({ leftPanelWidth, date, activeTab, setActiveTab, currentSlideIndex, serviceItems, songs }: { leftPanelWidth: number, date: string, activeTab: string, setActiveTab: (tab: string) => void, currentSlideIndex: number, serviceItems: any[], songs: any[] }) => {
	return (
		<div
			className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4"
			style={{ width: `${leftPanelWidth}%` }}
		>
			<div className="flex justify-between items-center mb-4">
				<div className="flex items-center gap-2">
					<FiMonitor className="text-gray-600 dark:text-gray-300" />
					<h2 className="text-lg font-medium text-gray-800 dark:text-white">Worship Service</h2>
					<span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
				</div>
				<div className="flex gap-2">
					<button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
						+ New Item
					</button>
					<button className="text-sm bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800">
						Clear Plan
					</button>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
				<button
					className={`flex items-center px-4 py-2 font-medium text-sm ${activeTab === 'plan'
						? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
						: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
						}`}
					onClick={() => setActiveTab('plan')}
				>
					<FiList className="mr-2" />
					Plan
				</button>
				<button
					className={`flex items-center px-4 py-2 font-medium text-sm ${activeTab === 'scripture'
						? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
						: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
						}`}
					onClick={() => setActiveTab('scripture')}
				>
					<FiBook className="mr-2" />
					Scripture
				</button>
				<button
					className={`flex items-center px-4 py-2 font-medium text-sm ${activeTab === 'songs'
						? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
						: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
						}`}
					onClick={() => setActiveTab('songs')}
				>
					<FiMusic className="mr-2" />
					Songs
				</button>
			</div>

			{/* Tab Content */}
			{RenderTabContent({ activeTab, currentSlideIndex, serviceItems, songs })}
		</div>
	)
}

export default LeftPanel;