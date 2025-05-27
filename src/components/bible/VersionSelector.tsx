import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../lib/store';
import { loadVersions } from '../../lib/bibleSlice';
import { setSelectedVersion } from '../../lib/presentationSlice';

const VersionSelector: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { versions, loading } = useSelector((state: RootState) => state.bible);
	const { selectedVersion } = useSelector((state: RootState) => state.presentation);

	// Load all versions on component mount
	useEffect(() => {
		dispatch(loadVersions());
	}, [dispatch]);

	// Set default version if none selected
	useEffect(() => {
		if (!selectedVersion && versions.length > 0) {
			const defaultVersion = versions.find(v => v.isDefault) || versions[0];
			dispatch(setSelectedVersion(defaultVersion.id));
		}
	}, [versions, selectedVersion, dispatch]);

	const handleVersionChange = (versionId: string) => {
		dispatch(setSelectedVersion(versionId));
	};

	if (loading) {
		return (
			<div className="px-2 mb-4">
				<div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bible Version</div>
				<div className="text-sm text-gray-600 dark:text-gray-300">Loading...</div>
			</div>
		);
	}

	return (
		<div className="px-2 mb-4">
			<div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bible Version</div>
			<select
				value={selectedVersion || ''}
				onChange={(e) => handleVersionChange(e.target.value)}
				className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
			>
				{versions.map((version) => (
					<option key={version.id} value={version.id}>
						{version.name}
					</option>
				))}
			</select>
		</div>
	);
};

export default VersionSelector; 