import React from 'react'
import QuickScriptureSearch from '@/components/shared/QuickScriptureSearch';
import EnhancedVersionSelector from '@/components/bible/EnhancedVersionSelector';


const ScriptureTab = () => {
	return (

		<div className="h-full flex flex-col">
			{/* Enhanced Version Selector */}
			<div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
				<EnhancedVersionSelector />
			</div>

			{/* Scripture Search */}
			<div className="flex-1 min-h-0">
				<QuickScriptureSearch />
			</div>
		</div>
	);

}

export default ScriptureTab