import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import {
	loadVersions,
	loadBooksForVersion,
	setSelectedVersion
} from '../../lib/bibleSlice';
import { setSelectedVersion as setPresentationVersion } from '../../lib/presentationSlice';

const EnhancedVersionSelector: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { versions, loading, selectedVersion } = useSelector((state: RootState) => state.bible);
	const { selectedVersion: presentationSelectedVersion } = useSelector((state: RootState) => state.presentation);

	// Load all versions on component mount
	useEffect(() => {
		dispatch(loadVersions());
	}, [dispatch]);

	// Set default version if none selected
	useEffect(() => {
		if (!selectedVersion && versions.length > 0) {
			// Try to find KJV first, then default marked version, then first version
			const kjvVersion = versions.find(v =>
				v.id.toLowerCase().includes('kjv') || v.name.toLowerCase().includes('kjv')
			);
			const defaultVersion = kjvVersion || versions.find(v => v.isDefault) || versions[0];

			dispatch(setSelectedVersion(defaultVersion.id));
			dispatch(setPresentationVersion(defaultVersion.id));
		}
	}, [versions, selectedVersion, dispatch]);

	const handleVersionChange = (versionId: string) => {
		console.log('Enhanced Version Selector - Version changed to:', versionId);

		// Update both slices
		dispatch(setSelectedVersion(versionId));
		dispatch(setPresentationVersion(versionId));

		// Load books, chapters, and verses for the new version
		dispatch(loadBooksForVersion(versionId));
	};

	if (loading) {
		return (
			<div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
				<div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">Bible Version</div>
				<div className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
					Loading versions...
				</div>
			</div>
		);
	}

	return (
		<div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
			<div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">Bible Version</div>
			<select
				value={selectedVersion || presentationSelectedVersion || ''}
				onChange={(e) => handleVersionChange(e.target.value)}
				className="w-full text-sm px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="">Select a version...</option>
				{versions.map((version) => (
					<option key={version.id} value={version.id}>
						{version.name} {version.year ? `(${version.year})` : ''}
					</option>
				))}
			</select>

			{/* Version info */}
			{selectedVersion && (
				<div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
					{(() => {
						const currentVersion = versions.find(v => v.id === selectedVersion);
						return currentVersion ? (
							<div>
								<div className="font-medium">{currentVersion.fullName}</div>
								{currentVersion.description && (
									<div className="opacity-75 mt-1">{currentVersion.description}</div>
								)}
								{currentVersion.publisher && (
									<div className="opacity-75">Published by {currentVersion.publisher}</div>
								)}
							</div>
						) : null;
					})()}
				</div>
			)}
		</div>
	);
};

export default EnhancedVersionSelector; 