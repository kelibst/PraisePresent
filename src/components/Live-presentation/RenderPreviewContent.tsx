import { FiMonitor } from "react-icons/fi";

// Render preview content
const RenderPreviewContent = ({ previewItem }: { previewItem: any }) => {
	if (!previewItem) {
		return (
			<div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-4 relative min-h-[140px] flex items-center justify-center">
				<div className="text-center text-gray-500 dark:text-gray-400">
					<FiMonitor size={48} className="mx-auto mb-2 opacity-50" />
					<p>No content in preview</p>
					<p className="text-sm mt-1">Select scripture from the sidebar to preview</p>
				</div>
			</div>
		);
	}

	if (previewItem.type === 'scripture') {
		return (
			<div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 mb-4 relative">
				<div className="text-center flex flex-col items-center justify-center min-h-[140px]">
					<h3 className="text-xl font-bold mb-3 uppercase">{previewItem.title}</h3>
					<p className="text-lg mb-3 leading-relaxed">
						{previewItem.content}
					</p>
					<span className="text-sm font-medium text-blue-200">{previewItem.reference} - {previewItem.translation}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 mb-4 relative">
			<div className="text-center flex flex-col items-center justify-center min-h-[140px]">
				<h3 className="text-xl font-bold mb-3">{previewItem.title}</h3>
				<p className="text-lg mb-3">{previewItem.content}</p>
			</div>
		</div>
	);
};

export default RenderPreviewContent;