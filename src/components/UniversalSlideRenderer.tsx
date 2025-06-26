import React, { useEffect, useState, useMemo } from 'react';
import {
	UniversalSlide,
	ScriptureSlideContent,
	SongSlideContent,
	MediaSlideContent,
	NoteSlideContent,
	AnnouncementSlideContent
} from '../lib/universalSlideSlice';

interface UniversalSlideRendererProps {
	slide: UniversalSlide;
	isPreview?: boolean;
	width?: number;
	height?: number;
	onSlideComplete?: () => void;
}

const UniversalSlideRenderer: React.FC<UniversalSlideRendererProps> = ({
	slide,
	isPreview = false,
	width = 1920,
	height = 1080,
	onSlideComplete
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

	// Generate background style
	const backgroundStyle = useMemo(() => {
		const bg = slide.background;
		let style: React.CSSProperties = {};

		switch (bg.type) {
			case 'solid':
				style.backgroundColor = bg.colors?.[0] || '#000000';
				break;
			case 'gradient':
				if (bg.colors && bg.colors.length >= 2) {
					style.background = `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})`;
				}
				break;
			case 'image':
				if (bg.imageUrl) {
					style.backgroundImage = `url(${bg.imageUrl})`;
					style.backgroundSize = 'cover';
					style.backgroundPosition = 'center';
					style.backgroundRepeat = 'no-repeat';
				}
				break;
		}
		style.opacity = bg.opacity;
		return style;
	}, [slide.background]);

	// Calculate text size based on content length
	const getTextSizeClass = (text: string): string => {
		const textLength = text?.length || 0;
		if (textLength < 100) return 'universal-text short';
		if (textLength < 200) return 'universal-text medium';
		if (textLength < 350) return 'universal-text long';
		if (textLength < 500) return 'universal-text very-long';
		return 'universal-text ultra-long';
	};

	// Render content based on slide type
	const renderSlideContent = () => {
		const baseTextStyle: React.CSSProperties = {
			color: slide.textFormatting?.contentFont?.color || '#ffffff',
			fontFamily: slide.textFormatting?.contentFont?.family || 'Arial, sans-serif',
			fontWeight: slide.textFormatting?.contentFont?.weight || 'normal',
			lineHeight: slide.textFormatting?.contentFont?.lineHeight || 1.4,
			textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
			textAlign: 'center' as const
		};

		const titleStyle: React.CSSProperties = {
			color: slide.textFormatting?.titleFont?.color || '#60a5fa',
			fontFamily: slide.textFormatting?.titleFont?.family || 'Arial, sans-serif',
			fontWeight: slide.textFormatting?.titleFont?.weight || 'bold',
			fontSize: slide.textFormatting?.titleFont?.size ? `${slide.textFormatting.titleFont.size}px` : undefined,
			textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
			textAlign: 'center' as const,
			marginBottom: '2rem'
		};

		switch (slide.type) {
			case 'scripture': {
				const content = slide.content as ScriptureSlideContent;
				const fullText = content.verses?.map(v => v.text).join(' ') || '';

				return (
					<div className="scripture-display universal-content">
						{/* Scripture Reference */}
						<div className="universal-title" style={titleStyle}>
							{content.reference || slide.title}
						</div>

						{/* Scripture Text */}
						<div
							className={getTextSizeClass(fullText)}
							style={{
								...baseTextStyle,
								marginBottom: '2rem',
								maxWidth: '95%'
							}}
						>
							{content.verses?.map((verse, index) => (
								<span key={index}>
									{verse.text}
									{index < content.verses!.length - 1 && ' '}
								</span>
							)) || fullText}
						</div>

						{/* Scripture Translation */}
						{content.translation && (
							<div className="universal-subtitle" style={{
								...baseTextStyle,
								fontSize: '1.8rem',
								opacity: 0.8,
								fontStyle: 'italic',
								color: '#cccccc'
							}}>
								— {content.translation}
							</div>
						)}
					</div>
				);
			}

			case 'song': {
				const content = slide.content as SongSlideContent;

				return (
					<div className="song-content universal-content">
						{/* Song Title */}
						{slide.title && (
							<div className="universal-title" style={titleStyle}>
								🎵 {slide.title}
							</div>
						)}

						{/* Song Lyrics */}
						<div
							className={getTextSizeClass(content.lyrics || '')}
							style={{
								...baseTextStyle,
								marginBottom: '2rem',
								lineHeight: 1.6
							}}
						>
							{content.lyrics?.split('\n').map((line, index) => (
								<div key={index} style={{ marginBottom: '1.5rem' }}>
									{line || '\u00A0'}
								</div>
							)) || content.lyrics}
						</div>

						{/* Song Info */}
						{(content.key || content.tempo || content.ccliNumber) && (
							<div className="universal-subtitle" style={{
								...baseTextStyle,
								fontSize: '1.6rem',
								opacity: 0.7,
								color: '#cccccc'
							}}>
								{content.key && `Key: ${content.key}`}
								{content.key && content.tempo && ' • '}
								{content.tempo && `Tempo: ${content.tempo}`}
								{(content.key || content.tempo) && content.ccliNumber && ' • '}
								{content.ccliNumber && `CCLI: ${content.ccliNumber}`}
							</div>
						)}
					</div>
				);
			}

			case 'note': {
				const content = slide.content as NoteSlideContent;

				return (
					<div className="note-content universal-content">
						{/* Note Title */}
						{slide.title && (
							<div className="universal-title" style={titleStyle}>
								{slide.title}
							</div>
						)}

						{/* Note Text */}
						{content.text && (
							<div
								className={getTextSizeClass(content.text)}
								style={{
									...baseTextStyle,
									marginBottom: '2rem',
									textAlign: 'left'
								}}
							>
								{content.text.split('\n').map((line, index) => (
									<div key={index} style={{ marginBottom: '1.5rem' }}>
										{line || '\u00A0'}
									</div>
								))}
							</div>
						)}

						{/* Bullet Points */}
						{content.bulletPoints && content.bulletPoints.length > 0 && (
							<div style={{ marginTop: '2rem', textAlign: 'left' }}>
								{content.bulletPoints.map((point, index) => (
									<div key={index} style={{
										...baseTextStyle,
										marginBottom: '1.5rem',
										display: 'flex',
										alignItems: 'flex-start',
										textAlign: 'left'
									}}>
										<span style={{ marginRight: '1rem', fontSize: '1.5em' }}>•</span>
										<span>{point}</span>
									</div>
								))}
							</div>
						)}
					</div>
				);
			}

			case 'announcement': {
				const content = slide.content as AnnouncementSlideContent;

				return (
					<div className="announcement-content universal-content">
						{/* Announcement Icon */}
						<div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.8 }}>
							📢
						</div>

						{/* Announcement Title */}
						{slide.title && (
							<div className="universal-title" style={titleStyle}>
								{slide.title}
							</div>
						)}

						{/* Announcement Message */}
						<div
							className={getTextSizeClass(content.message || '')}
							style={{
								...baseTextStyle,
								marginBottom: '2rem'
							}}
						>
							{content.message?.split('\n').map((line, index) => (
								<div key={index} style={{ marginBottom: '1rem' }}>
									{line}
								</div>
							)) || content.message}
						</div>

						{/* Date and Contact Info */}
						{(content.startDate || content.contactInfo) && (
							<div className="universal-subtitle" style={{
								...baseTextStyle,
								fontSize: '1.6rem',
								opacity: 0.7,
								color: '#cccccc'
							}}>
								{content.startDate && `Date: ${content.startDate}`}
								{content.startDate && content.contactInfo && ' • '}
								{content.contactInfo && `Contact: ${content.contactInfo}`}
							</div>
						)}
					</div>
				);
			}

			case 'media': {
				const content = slide.content as MediaSlideContent;

				return (
					<div className="media-content universal-content">
						{/* Media Icon */}
						<div style={{ fontSize: '5rem', marginBottom: '2rem', opacity: 0.8 }}>
							🎬
						</div>

						{/* Media Title */}
						{slide.title && (
							<div className="universal-title" style={titleStyle}>
								{slide.title}
							</div>
						)}

						{/* Media Overlay Text */}
						{content.overlayText && (
							<div
								className={getTextSizeClass(content.overlayText)}
								style={{
									...baseTextStyle,
									marginBottom: '2rem'
								}}
							>
								{content.overlayText}
							</div>
						)}

						{/* Duration */}
						{content.duration && (
							<div className="universal-subtitle" style={{
								...baseTextStyle,
								fontSize: '1.6rem',
								opacity: 0.7,
								color: '#cccccc'
							}}>
								Duration: {content.duration}
							</div>
						)}
					</div>
				);
			}

			default: {
				// Fallback for any slide type
				return (
					<div className="universal-content">
						{slide.title && (
							<div className="universal-title" style={titleStyle}>
								{slide.title}
							</div>
						)}
						{slide.subtitle && (
							<div className="universal-subtitle" style={{
								...baseTextStyle,
								fontSize: '2rem',
								opacity: 0.8,
								color: '#cccccc'
							}}>
								{slide.subtitle}
							</div>
						)}
					</div>
				);
			}
		}
	};

	// Fade in effect
	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div
			className={`relative overflow-hidden transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
			style={{
				width: `${width}px`,
				height: `${height}px`,
				...backgroundStyle
			}}
		>
			<div className="relative z-10 w-full h-full flex items-center justify-center p-8">
				{renderSlideContent()}
			</div>

			{/* Preview indicator */}
			{isPreview && (
				<div className="absolute top-4 left-4 z-20">
					<div className="bg-blue-600 bg-opacity-75 rounded px-2 py-1 text-white text-xs">
						PREVIEW
					</div>
				</div>
			)}
		</div>
	);
};

export default UniversalSlideRenderer;
