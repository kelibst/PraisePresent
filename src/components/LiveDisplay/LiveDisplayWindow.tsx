import React, { useEffect, useState } from 'react';
import './LiveDisplayWindow.css';

interface LiveContent {
	type: 'scripture' | 'song' | 'announcement' | 'black' | 'logo';
	title?: string;
	content?: string;
	verse?: string;
	reference?: string;
	lines?: string[];
}

const LiveDisplayWindow: React.FC = () => {
	const [content, setContent] = useState<LiveContent | null>(null);
	const [showBlack, setShowBlack] = useState(false);
	const [showLogo, setShowLogo] = useState(false);

	useEffect(() => {
		// Listen for content updates from main process
		const handleContentUpdate = (event: any, newContent: LiveContent) => {
			console.log('Live display received content:', newContent);
			setContent(newContent);
			setShowBlack(false);
			setShowLogo(false);
		};

		const handleContentClear = () => {
			console.log('Live display content cleared');
			setContent(null);
			setShowBlack(false);
			setShowLogo(false);
		};

		const handleShowBlack = () => {
			console.log('Live display showing black screen');
			setShowBlack(true);
			setShowLogo(false);
		};

		const handleShowLogo = () => {
			console.log('Live display showing logo screen');
			setShowLogo(true);
			setShowBlack(false);
		};

		// Register IPC listeners (using proper Electron IPC pattern)
		const removeContentUpdate = window.electronAPI?.invoke('ipc:addListener', 'live-content-update', handleContentUpdate);
		const removeContentClear = window.electronAPI?.invoke('ipc:addListener', 'live-content-clear', handleContentClear);
		const removeShowBlack = window.electronAPI?.invoke('ipc:addListener', 'live-show-black', handleShowBlack);
		const removeShowLogo = window.electronAPI?.invoke('ipc:addListener', 'live-show-logo', handleShowLogo);

		// Cleanup listeners
		return () => {
			if (removeContentUpdate) removeContentUpdate;
			if (removeContentClear) removeContentClear;
			if (removeShowBlack) removeShowBlack;
			if (removeShowLogo) removeShowLogo;
		};
	}, []);

	// Render black screen
	if (showBlack) {
		return <div className="live-display-container black-screen" />;
	}

	// Render logo screen
	if (showLogo) {
		return (
			<div className="live-display-container logo-screen">
				<div className="logo-container">
					<h1 className="church-logo">✝️</h1>
					<h2 className="church-name">Church Name</h2>
				</div>
			</div>
		);
	}

	// Render content or default black screen
	return (
		<div className="live-display-container">
			{content ? (
				<div className="content-container">
					{content.type === 'scripture' && (
						<div className="scripture-content">
							{content.reference && (
								<div className="scripture-reference">{content.reference}</div>
							)}
							<div className="scripture-text">
								{content.content || content.verse}
							</div>
						</div>
					)}

					{content.type === 'song' && (
						<div className="song-content">
							{content.title && (
								<div className="song-title">{content.title}</div>
							)}
							<div className="song-lyrics">
								{content.lines ? (
									content.lines.map((line, index) => (
										<div key={index} className="song-line">
											{line}
										</div>
									))
								) : (
									<div className="song-line">{content.content}</div>
								)}
							</div>
						</div>
					)}

					{content.type === 'announcement' && (
						<div className="announcement-content">
							{content.title && (
								<div className="announcement-title">{content.title}</div>
							)}
							<div className="announcement-text">{content.content}</div>
						</div>
					)}
				</div>
			) : (
				<div className="default-screen">
					<div className="ready-message">
						<h1>Ready for Presentation</h1>
						<p>Waiting for content...</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default LiveDisplayWindow; 