import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiMonitor, FiCheck, FiPlay, FiRefreshCw, FiAlertCircle, FiCamera, FiEye } from 'react-icons/fi';
import {
	refreshDisplays,
	testDisplay,
	captureDisplay,
	setSelectedLiveDisplay,
	clearDisplayError,
	selectDisplays,
	selectPrimaryDisplay,
	selectSecondaryDisplay,
	selectSelectedLiveDisplay,
	selectDisplaySettings,
	selectHasMultipleDisplays,
	selectDisplayCount,
	selectDisplayLoading,
	selectDisplayError,
	selectDisplayCaptures,
	selectCapturingDisplays,
	selectDisplayCapture,
	selectIsCapturing,
} from '@/lib/displaySlice';
import { RootState, AppDispatch } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '../ui/Alert';
import Badge from '../ui/Badge';




// Display Preview Component
const DisplayPreview: React.FC<{ displayId: number }> = ({ displayId }) => {
	const dispatch = useDispatch<AppDispatch>();
	const screenshot = useSelector(selectDisplayCapture(displayId));
	const isCapturing = useSelector(selectIsCapturing(displayId));

	const handleCapture = useCallback(() => {
		dispatch(captureDisplay(displayId));
	}, [dispatch, displayId]);

	// Auto-refresh every 5 seconds if preview is visible
	useEffect(() => {
		if (screenshot) {
			const interval = setInterval(() => {
				dispatch(captureDisplay(displayId));
			}, 5000);
			return () => clearInterval(interval);
		}
	}, [dispatch, displayId, screenshot]);

	return (
		<div className="w-32 h-18 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border relative">
			{screenshot ? (
				<img
					src={screenshot}
					alt={`Display ${displayId} preview`}
					className="w-full h-full object-cover"
				/>
			) : (
				<div className="w-full h-full flex items-center justify-center">
					<FiMonitor className="w-6 h-6 text-gray-400" />
				</div>
			)}

			{/* Overlay with capture button */}
			<div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
				<Button
					onClick={handleCapture}
					disabled={isCapturing}
					size="sm"
					variant="secondary"
					className="text-xs"
				>
					{isCapturing ? (
						<FiRefreshCw className="w-3 h-3 animate-spin" />
					) : (
						<FiCamera className="w-3 h-3" />
					)}
				</Button>
			</div>

			{/* Auto-refresh indicator */}
			{screenshot && (
				<div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
			)}
		</div>
	);
};

// Live Display Window IPC calls
const createLiveDisplay = async (displayId: number) => {
	return window.electronAPI?.invoke('live-display:create', { displayId });
};

const showLiveDisplay = async () => {
	return window.electronAPI?.invoke('live-display:show');
};

const hideLiveDisplay = async () => {
	return window.electronAPI?.invoke('live-display:hide');
};

const closeLiveDisplay = async () => {
	return window.electronAPI?.invoke('live-display:close');
};

const getLiveDisplayStatus = async () => {
	return window.electronAPI?.invoke('live-display:getStatus');
};

const DisplaySettings: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();

	const displays = useSelector(selectDisplays);
	const primaryDisplay = useSelector(selectPrimaryDisplay);
	const secondaryDisplay = useSelector(selectSecondaryDisplay);
	const selectedLiveDisplay = useSelector(selectSelectedLiveDisplay);
	const settings = useSelector(selectDisplaySettings);
	const hasMultipleDisplays = useSelector(selectHasMultipleDisplays);
	const displayCount = useSelector(selectDisplayCount);
	const isLoading = useSelector(selectDisplayLoading);
	const error = useSelector(selectDisplayError);

	// Live display state
	const [liveDisplayStatus, setLiveDisplayStatus] = React.useState<any>(null);
	const [isCreatingLive, setIsCreatingLive] = React.useState(false);

	// Load displays on component mount and check live display status
	useEffect(() => {
		dispatch(refreshDisplays());
		checkLiveDisplayStatus();
	}, [dispatch]);

	const checkLiveDisplayStatus = async () => {
		try {
			const status = await getLiveDisplayStatus();
			setLiveDisplayStatus(status);
		} catch (error) {
			console.error('Failed to get live display status:', error);
		}
	};

	const handleCreateLiveDisplay = async () => {
		if (!selectedLiveDisplay) {
			alert('Please select a display for live output first');
			return;
		}

		setIsCreatingLive(true);
		try {
			const result = await createLiveDisplay(selectedLiveDisplay.id);
			if (result?.success) {
				await checkLiveDisplayStatus();
				console.log('Live display created successfully');
			}
		} catch (error) {
			console.error('Failed to create live display:', error);
			alert('Failed to create live display');
		} finally {
			setIsCreatingLive(false);
		}
	};

	const handleShowLiveDisplay = async () => {
		try {
			await showLiveDisplay();
			await checkLiveDisplayStatus();
		} catch (error) {
			console.error('Failed to show live display:', error);
			alert('Failed to show live display');
		}
	};

	const handleHideLiveDisplay = async () => {
		try {
			await hideLiveDisplay();
			await checkLiveDisplayStatus();
		} catch (error) {
			console.error('Failed to hide live display:', error);
			alert('Failed to hide live display');
		}
	};

	const handleCloseLiveDisplay = async () => {
		try {
			await closeLiveDisplay();
			await checkLiveDisplayStatus();
		} catch (error) {
			console.error('Failed to close live display:', error);
			alert('Failed to close live display');
		}
	};

	const handleRefreshDisplays = () => {
		dispatch(refreshDisplays());
	};

	const handleSelectDisplay = (displayId: number | null) => {
		dispatch(setSelectedLiveDisplay(displayId));
	};

	const handleTestDisplay = (displayId: number) => {
		dispatch(testDisplay(displayId));
	};

	const handleCaptureDisplay = (displayId: number) => {
		dispatch(captureDisplay(displayId));
	};

	const clearError = () => {
		dispatch(clearDisplayError());
	};

	const formatResolution = (width: number, height: number) => {
		return `${width} × ${height}`;
	};

	const getDisplayTypeIcon = (display: any) => {
		if (display.manufacturer) {
			const manufacturer = display.manufacturer.toLowerCase();
			if (manufacturer.includes('samsung')) return '📱';
			if (manufacturer.includes('lg')) return '🖥️';
			if (manufacturer.includes('dell')) return '💻';
			if (manufacturer.includes('hp')) return '🖨️';
			if (manufacturer.includes('acer')) return '⚡';
			if (manufacturer.includes('asus')) return '🎮';
		}
		return '🖥️';
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-medium">Display Configuration</h3>
					<p className="text-sm text-muted-foreground">
						Configure multiple monitors for live presentation output
					</p>
				</div>
				<Button
					onClick={handleRefreshDisplays}
					disabled={isLoading}
					variant="outline"
					size="sm"
				>
					<FiRefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
					Refresh
				</Button>
			</div>

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive">
					<FiAlertCircle className="h-4 w-4" />
					<AlertDescription className="flex items-center justify-between">
						{error}
						<Button onClick={clearError} variant="ghost" size="sm">
							Dismiss
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{/* Display Status */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FiMonitor className="w-5 h-5" />
						Display Status
					</CardTitle>
					<CardDescription>
						Current display configuration detected
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="font-medium">Total Displays:</span>
							<span className="ml-2">{displayCount}</span>
						</div>
						<div>
							<span className="font-medium">Multiple Displays:</span>
							<span className="ml-2">
								{hasMultipleDisplays ? (
									<Badge variant="default">Available</Badge>
								) : (
									<Badge variant="secondary">Not Available</Badge>
								)}
							</span>
						</div>
						<div>
							<span className="font-medium">Live Display:</span>
							<span className="ml-2">
								{selectedLiveDisplay ? (
									<Badge variant="default">{selectedLiveDisplay.friendlyName || selectedLiveDisplay.label}</Badge>
								) : (
									<Badge variant="outline">Not Selected</Badge>
								)}
							</span>
						</div>
						<div>
							<span className="font-medium">Status:</span>
							<span className="ml-2">
								{settings.isLiveDisplayActive ? (
									<Badge variant="default">Active</Badge>
								) : (
									<Badge variant="secondary">Inactive</Badge>
								)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Available Displays */}
			<Card>
				<CardHeader>
					<CardTitle>Available Displays</CardTitle>
					<CardDescription>
						Select which display to use for live presentation output
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<FiRefreshCw className="w-6 h-6 animate-spin mr-2" />
							<span>Detecting displays...</span>
						</div>
					) : displays.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<FiMonitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>No displays detected</p>
							<Button onClick={handleRefreshDisplays} variant="outline" size="sm" className="mt-2">
								Refresh Displays
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{displays.map((display) => (
								<div
									key={display.id}
									className={`border rounded-lg p-4 transition-colors ${selectedLiveDisplay?.id === display.id
										? 'border-primary bg-primary/5'
										: 'border-border'
										}`}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div className="relative">
												<div className="text-2xl">{getDisplayTypeIcon(display)}</div>
												{display.isPrimary && (
													<div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
												)}
											</div>

											{/* Display Preview */}
											<DisplayPreview displayId={display.id} />

											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h4 className="font-medium text-lg">
														{display.friendlyName || display.label}
													</h4>
													{display.isPrimary && (
														<Badge variant="default" className="text-xs">Primary</Badge>
													)}
													{selectedLiveDisplay?.id === display.id && (
														<Badge variant="default" className="text-xs">Live Output</Badge>
													)}
												</div>

												<div className="space-y-1 text-sm text-muted-foreground">
													<div>
														{formatResolution(display.bounds.width, display.bounds.height)} •
														Scale: {Math.round(display.scaleFactor * 100)}%
													</div>
													{display.manufacturer && (
														<div>Manufacturer: {display.manufacturer}</div>
													)}
													{display.model && (
														<div>Model: {display.model}</div>
													)}
													<div>Position: ({display.bounds.x}, {display.bounds.y})</div>
												</div>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<Button
												onClick={() => handleCaptureDisplay(display.id)}
												variant="outline"
												size="sm"
												title="Capture Screenshot"
											>
												<FiCamera className="w-4 h-4 mr-1" />
												Capture
											</Button>

											<Button
												onClick={() => handleTestDisplay(display.id)}
												disabled={settings.testMode}
												variant="outline"
												size="sm"
											>
												<FiPlay className="w-4 h-4 mr-1" />
												Test
											</Button>

											{selectedLiveDisplay?.id === display.id ? (
												<Button
													onClick={() => handleSelectDisplay(null)}
													variant="outline"
													size="sm"
												>
													<FiCheck className="w-4 h-4 mr-1" />
													Selected
												</Button>
											) : (
												<Button
													onClick={() => handleSelectDisplay(display.id)}
													variant="default"
													size="sm"
												>
													Select for Live
												</Button>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recommendations */}
			{displays.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Recommendations</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3 text-sm">
							{!hasMultipleDisplays && (
								<div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
									<FiAlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
									<div>
										<p className="font-medium text-yellow-800 dark:text-yellow-200">
											Single Display Detected
										</p>
										<p className="text-yellow-700 dark:text-yellow-300">
											Connect a second monitor for optimal presentation experience.
											Currently, live content will mirror on your main display.
										</p>
									</div>
								</div>
							)}

							{hasMultipleDisplays && !selectedLiveDisplay && (
								<div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<FiMonitor className="w-4 h-4 text-blue-600 mt-0.5" />
									<div>
										<p className="font-medium text-blue-800 dark:text-blue-200">
											Select Live Display
										</p>
										<p className="text-blue-700 dark:text-blue-300">
											Choose which display to use for live presentation output.
											We recommend using your secondary display for the audience.
										</p>
									</div>
								</div>
							)}

							{hasMultipleDisplays && secondaryDisplay && !selectedLiveDisplay && (
								<div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
									<FiCheck className="w-4 h-4 text-green-600 mt-0.5" />
									<div>
										<p className="font-medium text-green-800 dark:text-green-200">
											Quick Setup Available
										</p>
										<p className="text-green-700 dark:text-green-300">
											Your secondary display "{secondaryDisplay.friendlyName || secondaryDisplay.label}" is ready to use for live presentations.
										</p>
										<Button
											onClick={() => handleSelectDisplay(secondaryDisplay.id)}
											variant="outline"
											size="sm"
											className="mt-2"
										>
											Use {secondaryDisplay.friendlyName || secondaryDisplay.label}
										</Button>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default DisplaySettings; 