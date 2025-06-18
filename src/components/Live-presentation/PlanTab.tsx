import { FiEdit, FiTrash2 } from "react-icons/fi";

export interface ServiceItem {
	id: number;
	type: string;
	title: string;
	author: string;
	content: string;
}

const PlanTab = ({ serviceItems, currentSlideIndex, setCurrentSlideIndex }: any) => {
	return (
		<div className="p-4 space-y-3">
			{serviceItems.map((item: ServiceItem, index: number) => (
				<div
					key={item.id}
					className={`p-3 rounded-lg border cursor-pointer transition-all ${index === currentSlideIndex
						? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
						: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
						}`}
					onClick={() => setCurrentSlideIndex(index)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${index === currentSlideIndex
								? 'bg-blue-500 text-white'
								: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
								}`}>
								{index + 1}
							</div>
							<div>
								<h4 className="text-sm font-medium text-gray-900 dark:text-white">
									{item.title}
								</h4>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									{item.author}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-1">
							<button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
								<FiEdit size={14} className="text-gray-400" />
							</button>
							<button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
								<FiTrash2 size={14} className="text-gray-400" />
							</button>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default PlanTab;