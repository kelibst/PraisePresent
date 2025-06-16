import React, { useState, useEffect } from "react";
import {
	FiMinus,
	FiSquare,
	FiX,
	FiMaximize2,
	FiMinimize2,
	FiSettings,
	FiMonitor,
} from "react-icons/fi";

interface TitleBarProps {
	title?: string;
	showControls?: boolean;
}

const TitleBar: React.FC<TitleBarProps> = ({
	title = "PraisePresent",
	showControls = true,
}) => {
	const [isMaximized, setIsMaximized] = useState(false);
	const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

	useEffect(() => {
		// Check initial window state
		checkWindowState();

		// For now, we'll poll for window state changes
		// This is a simple fallback until we implement proper event listeners
		const pollInterval = setInterval(() => {
			checkWindowState();
		}, 1000);

		return () => {
			clearInterval(pollInterval);
		};
	}, []);

	const checkWindowState = async () => {
		try {
			const maximized = await window.electronAPI?.invoke("window:isMaximized");
			const alwaysOnTop = await window.electronAPI?.invoke("window:isAlwaysOnTop");
			setIsMaximized(maximized);
			setIsAlwaysOnTop(alwaysOnTop);
		} catch (error) {
			console.error("Failed to check window state:", error);
		}
	};

	const handleMinimize = async () => {
		try {
			await window.electronAPI?.invoke("window:minimize");
		} catch (error) {
			console.error("Failed to minimize window:", error);
		}
	};

	const handleMaximize = async () => {
		try {
			if (isMaximized) {
				await window.electronAPI?.invoke("window:unmaximize");
			} else {
				await window.electronAPI?.invoke("window:maximize");
			}
		} catch (error) {
			console.error("Failed to maximize/unmaximize window:", error);
		}
	};

	const handleClose = async () => {
		try {
			await window.electronAPI?.invoke("window:close");
		} catch (error) {
			console.error("Failed to close window:", error);
		}
	};

	const toggleAlwaysOnTop = async () => {
		try {
			const newState = !isAlwaysOnTop;
			await window.electronAPI?.invoke("window:setAlwaysOnTop", newState);
			setIsAlwaysOnTop(newState);
		} catch (error) {
			console.error("Failed to toggle always on top:", error);
		}
	};

	const openSettings = () => {
		// Navigate to settings or trigger settings modal
		// This can be implemented based on your routing system
		console.log("Opening settings...");
	};

	const openDisplaySettings = () => {
		// Navigate to display settings
		console.log("Opening display settings...");
	};

	return (
		<div className="flex items-center justify-between h-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 select-none relative z-50">
			{/* App Icon and Title */}
			<div className="flex items-center px-4 py-1 drag-region flex-1">
				<div className="flex items-center gap-2">
					{/* App Icon */}
					<div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex items-center justify-center text-white text-xs font-bold">
						P
					</div>

					{/* Title */}
					<span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
						{title}
					</span>
				</div>
			</div>

			{/* Center - Quick Actions */}
			<div className="flex items-center gap-1 no-drag-region">
				<button
					onClick={toggleAlwaysOnTop}
					className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 ${isAlwaysOnTop
						? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
						: "text-gray-500 dark:text-gray-400"
						}`}
					title={isAlwaysOnTop ? "Disable Always on Top" : "Enable Always on Top"}
				>
					<FiMonitor size={12} />
				</button>

				<button
					onClick={openDisplaySettings}
					className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-gray-500 dark:text-gray-400"
					title="Display Settings"
				>
					<FiMonitor size={12} />
				</button>

				<button
					onClick={openSettings}
					className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-gray-500 dark:text-gray-400"
					title="Settings"
				>
					<FiSettings size={12} />
				</button>
			</div>

			{/* Window Controls */}
			{showControls && (
				<div className="flex items-center no-drag-region">
					<button
						onClick={handleMinimize}
						className="flex items-center justify-center w-12 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-gray-600 dark:text-gray-400"
						title="Minimize"
					>
						<FiMinus size={14} />
					</button>

					<button
						onClick={handleMaximize}
						className="flex items-center justify-center w-12 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-gray-600 dark:text-gray-400"
						title={isMaximized ? "Restore" : "Maximize"}
					>
						{isMaximized ? <FiMinimize2 size={12} /> : <FiMaximize2 size={12} />}
					</button>

					<button
						onClick={handleClose}
						className="flex items-center justify-center w-12 h-8 hover:bg-red-500 hover:text-white transition-colors duration-150 text-gray-600 dark:text-gray-400"
						title="Close"
					>
						<FiX size={14} />
					</button>
				</div>
			)}
		</div>
	);
};

export default TitleBar; 