import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	LiveContentItem,
	TransitionAnimation,
	ScriptureStyleOptions,
	SongStyleOptions,
	AnnouncementStyleOptions,
	SlideStyleOptions,
	MediaStyleOptions
} from '../../types/LiveContent';

interface LiveContentRendererProps {
	content: LiveContentItem | null;
	transition?: TransitionAnimation;
	className?: string;
	style?: React.CSSProperties;
}

const LiveContentRenderer: React.FC<LiveContentRendererProps> = ({
	content,
	transition = { type: 'fade', duration: 500, easing: 'ease-in-out' },
	className = '',
	style = {}
}) => {
	// Convert transition settings to Framer Motion variants
	const getTransitionVariants = (transitionConfig: TransitionAnimation) => {
		const { type, duration, easing, direction } = transitionConfig;
		const durationInSeconds = duration / 1000;

		const baseTransition = {
			duration: durationInSeconds,
			ease: easing || 'ease-in-out'
		};

		switch (type) {
			case 'fade':
				return {
					initial: { opacity: 0 },
					animate: { opacity: 1 },
					exit: { opacity: 0 },
					transition: baseTransition
				};

			case 'slide':
				const slideDirection = direction || 'up';
				const slideDistance = 50;

				const slideTransforms = {
					up: { y: slideDistance },
					down: { y: -slideDistance },
					left: { x: slideDistance },
					right: { x: -slideDistance }
				};

				return {
					initial: { opacity: 0, ...slideTransforms[slideDirection] },
					animate: { opacity: 1, x: 0, y: 0 },
					exit: { opacity: 0, ...slideTransforms[slideDirection] },
					transition: baseTransition
				};

			case 'zoom':
				return {
					initial: { opacity: 0, scale: 0.8 },
					animate: { opacity: 1, scale: 1 },
					exit: { opacity: 0, scale: 0.8 },
					transition: baseTransition
				};

			case 'none':
			default:
				return {
					initial: { opacity: 1 },
					animate: { opacity: 1 },
					exit: { opacity: 1 },
					transition: { duration: 0 }
				};
		}
	};

	const variants = getTransitionVariants(transition);

	if (!content) {
		return (
			<div
				className={`flex items-center justify-center h-full bg-black text-white ${className}`}
				style={style}
			>
				<div className="text-center">
					<div className="text-4xl opacity-50 mb-4">No Content</div>
					<div className="text-xl opacity-30">Ready for live presentation</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`relative h-full w-full overflow-hidden ${className}`}
			style={style}
		>
			<AnimatePresence mode="wait">
				<motion.div
					key={content.id}
					{...variants}
					className="absolute inset-0 flex items-center justify-center"
				>
					{content.type === 'scripture' && (
						<ScriptureRenderer content={content} />
					)}
					{content.type === 'song' && (
						<SongRenderer content={content} />
					)}
					{content.type === 'announcement' && (
						<AnnouncementRenderer content={content} />
					)}
					{content.type === 'slide' && (
						<SlideRenderer content={content} />
					)}
					{content.type === 'media' && (
						<MediaRenderer content={content} />
					)}
					{content.type === 'black' && (
						<BlackScreenRenderer />
					)}
					{content.type === 'logo' && (
						<LogoRenderer content={content} />
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
};

// Scripture content renderer
const ScriptureRenderer: React.FC<{ content: Extract<LiveContentItem, { type: 'scripture' }> }> = ({ content }) => {
	const styling = content.styling || {} as ScriptureStyleOptions;

	const containerStyle: React.CSSProperties = {
		backgroundColor: styling.backgroundColor || 'transparent',
		backgroundImage: styling.backgroundImage ? `url(${styling.backgroundImage})` : undefined,
		color: styling.textColor || '#ffffff',
		fontFamily: styling.fontFamily || 'system-ui, -apple-system, sans-serif',
		textAlign: styling.textAlign || 'center',
		padding: `${styling.padding || 40}px`,
	};

	const textStyle: React.CSSProperties = {
		fontSize: `${styling.fontSize || 3.5}rem`,
		lineHeight: 1.4,
		textShadow: '0 2px 4px rgba(0,0,0,0.8)',
		marginBottom: '2rem'
	};

	const referenceStyle: React.CSSProperties = {
		fontSize: `${(styling.fontSize || 3.5) * 0.6}rem`,
		opacity: 0.9,
		fontWeight: 600
	};

	return (
		<div style={containerStyle} className="w-full h-full flex items-center justify-center">
			<div className="max-w-6xl w-full">
				{styling.showReference !== false && styling.referencePosition === 'top' && (
					<div style={referenceStyle} className="mb-8">
						{content.reference}
						{styling.showTranslation !== false && (
							<span className="ml-4 opacity-75">({content.translation})</span>
						)}
					</div>
				)}

				<div style={textStyle}>
					{content.text}
				</div>

				{styling.showReference !== false && styling.referencePosition !== 'top' && (
					<div style={referenceStyle} className="mt-8">
						{content.reference}
						{styling.showTranslation !== false && (
							<span className="ml-4 opacity-75">({content.translation})</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

// Song content renderer
const SongRenderer: React.FC<{ content: Extract<LiveContentItem, { type: 'song' }> }> = ({ content }) => {
	const styling = content.styling || {} as SongStyleOptions;

	const containerStyle: React.CSSProperties = {
		backgroundColor: styling.backgroundColor || 'transparent',
		backgroundImage: styling.backgroundImage ? `url(${styling.backgroundImage})` : undefined,
		color: styling.textColor || '#ffffff',
		fontFamily: styling.fontFamily || 'system-ui, -apple-system, sans-serif',
		textAlign: styling.textAlign || 'center',
		padding: `${styling.padding || 40}px`,
	};

	const titleStyle: React.CSSProperties = {
		fontSize: `${(styling.fontSize || 2.8) * 1.2}rem`,
		fontWeight: 700,
		marginBottom: '1.5rem',
		textShadow: '0 2px 4px rgba(0,0,0,0.8)'
	};

	const lyricsStyle: React.CSSProperties = {
		fontSize: `${styling.fontSize || 2.8}rem`,
		lineHeight: styling.lineSpacing || 1.5,
		textShadow: '0 2px 4px rgba(0,0,0,0.8)',
		whiteSpace: 'pre-line'
	};

	const artistStyle: React.CSSProperties = {
		fontSize: `${(styling.fontSize || 2.8) * 0.7}rem`,
		opacity: 0.8,
		marginTop: '2rem'
	};

	return (
		<div style={containerStyle} className="w-full h-full flex items-center justify-center">
			<div className="max-w-5xl w-full">
				{styling.showTitle !== false && (
					<div style={titleStyle}>
						{content.title}
					</div>
				)}

				<div style={lyricsStyle}>
					{content.lyrics}
				</div>

				{styling.showArtist !== false && content.artist && (
					<div style={artistStyle}>
						{content.artist}
					</div>
				)}

				{content.verse && content.totalVerses && (
					<div className="absolute bottom-8 right-8 text-xl opacity-60">
						{content.verse} / {content.totalVerses}
					</div>
				)}
			</div>
		</div>
	);
};

// Announcement content renderer
const AnnouncementRenderer: React.FC<{ content: Extract<LiveContentItem, { type: 'announcement' }> }> = ({ content }) => {
	const styling = content.styling || {} as AnnouncementStyleOptions;

	const containerStyle: React.CSSProperties = {
		backgroundColor: styling.backgroundColor || 'rgba(0,0,0,0.8)',
		backgroundImage: styling.backgroundImage ? `url(${styling.backgroundImage})` : undefined,
		color: styling.textColor || '#ffffff',
		fontFamily: styling.fontFamily || 'system-ui, -apple-system, sans-serif',
		textAlign: styling.textAlign || 'center',
		padding: `${styling.padding || 40}px`,
	};

	const titleStyle: React.CSSProperties = {
		fontSize: `${(styling.fontSize || 3)rem
	}`,
    fontWeight: 700,
    marginBottom: '1.5rem',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
  };

  const contentStyle: React.CSSProperties = {
    fontSize: `${(styling.fontSize || 3) * 0.8
}rem`,
    lineHeight: 1.4,
    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
    marginBottom: '1rem'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: `${ (styling.fontSize || 3) * 0.6 } rem`,
    opacity: 0.8
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'urgent': return '#ef4444';
      case 'prayer': return '#8b5cf6';
      case 'event': return '#10b981';
      default: return '#3b82f6';
    }
  };

  return (
    <div style={containerStyle} className="w-full h-full flex items-center justify-center">
      <div className="max-w-5xl w-full">
        {styling.showCategory !== false && content.category && (
          <div 
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: getCategoryColor(content.category) }}
          >
            {content.category.toUpperCase()}
          </div>
        )}
        
        <div style={titleStyle}>
          {content.title}
        </div>
        
        <div style={contentStyle}>
          {content.content}
        </div>
        
        {content.subtitle && (
          <div style={subtitleStyle}>
            {content.subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

// Slide content renderer
const SlideRenderer: React.FC<{ content: Extract<LiveContentItem, { type: 'slide' }> }> = ({ content }) => {
  const styling = content.styling || {} as SlideStyleOptions;
  
  const containerStyle: React.CSSProperties = {
    backgroundColor: styling.backgroundColor || 'transparent',
    backgroundImage: content.backgroundImage || styling.backgroundImage ? 
      `url(${ content.backgroundImage || styling.backgroundImage })` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: styling.textColor || '#ffffff',
    fontFamily: styling.fontFamily || 'system-ui, -apple-system, sans-serif',
    textAlign: styling.textAlign || 'center',
    padding: `${ styling.padding || 40 } px`,
  };

  const overlayStyle: React.CSSProperties = styling.overlayColor ? {
    backgroundColor: styling.overlayColor,
    opacity: styling.backgroundOpacity || 0.3
  } : {};

  const titleStyle: React.CSSProperties = {
    fontSize: `${ (styling.fontSize || 3.5) * 1.2 } rem`,
    fontWeight: 700,
    marginBottom: '2rem',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
  };

  const contentStyle: React.CSSProperties = {
    fontSize: `${ styling.fontSize || 3.5 } rem`,
    lineHeight: 1.4,
    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
    marginBottom: '1.5rem'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: `${ (styling.fontSize || 3.5) * 0.7 } rem`,
    opacity: 0.9
  };

  return (
    <div style={containerStyle} className="w-full h-full relative">
      {styling.overlayColor && (
        <div className="absolute inset-0" style={overlayStyle} />
      )}
      
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="max-w-6xl w-full">
          <div style={titleStyle}>
            {content.title}
          </div>
          
          <div style={contentStyle}>
            {content.content}
          </div>
          
          {content.subtitle && (
            <div style={subtitleStyle}>
              {content.subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Media content renderer
const MediaRenderer: React.FC<{ content: Extract<LiveContentItem, { type: 'media' }> }> = ({ content }) => {
  const styling = content.styling || {} as MediaStyleOptions;
  
  const containerStyle: React.CSSProperties = {
    backgroundColor: styling.backgroundColor || '#000000',
    color: styling.textColor || '#ffffff',
    textAlign: styling.textAlign || 'center'
  };

  const mediaStyle: React.CSSProperties = {
    objectFit: styling.objectFit || 'contain',
    opacity: styling.opacity || 1,
    maxWidth: '100%',
    maxHeight: '100%'
  };

  return (
    <div style={containerStyle} className="w-full h-full flex items-center justify-center">
      {content.mediaType === 'image' ? (
        <img 
          src={content.mediaUrl} 
          alt={content.title || 'Live media'}
          style={mediaStyle}
          className="max-w-full max-h-full"
        />
      ) : (
        <video 
          src={content.mediaUrl}
          style={mediaStyle}
          className="max-w-full max-h-full"
          autoPlay={content.autoPlay}
          loop={content.loop}
          controls={false}
          muted
        />
      )}
      
      {content.title && (
        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-black bg-opacity-60 rounded-lg px-6 py-4">
            <h3 className="text-2xl font-semibold">{content.title}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

// Black screen renderer
const BlackScreenRenderer: React.FC = () => {
  return (
    <div className="w-full h-full bg-black" />
  );
};

// Logo screen renderer
const LogoRenderer: React.FC<{ content: Extract<LiveContentItem, { type: 'logo' }> }> = ({ content }) => {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-center">
        {content.logoUrl && (
          <motion.img
            src={content.logoUrl}
            alt="Church Logo"
            className="w-96 h-96 object-contain mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
        
        {content.title && (
          <motion.h1
            className="text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {content.title}
          </motion.h1>
        )}
        
        {content.subtitle && (
          <motion.p
            className="text-2xl text-white opacity-80"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {content.subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default LiveContentRenderer;