import React from "react";

interface DebugInfo {
	liveItemType: string;
	liveItemTitle: string;
	localContentType: string;
	hasSlide: boolean;
	slideType: string;
	ipcConnected: boolean;
	showBlack: boolean;
	showLogo: boolean;
}

interface DebugOverlayProps {
	debugInfo: DebugInfo;
	enabled?: boolean;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({ debugInfo, enabled = true }) => {
	if (!enabled) return null;

	return (
		<div className="universal-debug-overlay">
			<div>🔴 LIVE DISPLAY DEBUG (UNIFIED SLIDES)</div>
			<div>Redux liveItem Type: {debugInfo.liveItemType || "none"}</div>
			<div>Redux liveItem Title: {debugInfo.liveItemTitle || "none"}</div>
			<div>Local Content Type: {debugInfo.localContentType || "none"}</div>
			<div>Converted to Slide: {debugInfo.hasSlide ? "✅" : "❌"}</div>
			<div>Slide Type: {debugInfo.slideType || "none"}</div>
			<div>Using UniversalSlideRenderer: {debugInfo.hasSlide ? "✅" : "❌"}</div>
			<div>IPC Connected: {debugInfo.ipcConnected ? "✅" : "❌"}</div>
			<div>Show Black: {debugInfo.showBlack ? "✅" : "❌"}</div>
			<div>Show Logo: {debugInfo.showLogo ? "✅" : "❌"}</div>
		</div>
	);
};

export default DebugOverlay; 