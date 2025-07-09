import React, { useRef, useEffect, useState } from 'react';
import { ProcessedMediaContent } from '@/services/RenderingEngine';

interface MediaRendererProps {
  content: ProcessedMediaContent;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({ content }) => {
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    left: content.positioning.x,
    top: content.positioning.y,
    width: content.positioning.width,
    height: content.positioning.height,
    zIndex: content.positioning.zIndex,
    transform: `scale(${content.scaling.scaleX}, ${content.scaling.scaleY}) rotate(${content.scaling.rotation}deg) skew(${content.scaling.skewX}deg, ${content.scaling.skewY}deg)`,
    objectFit: getObjectFit(content.displayMode),
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setError(null);
  };

  const handleError = () => {
    setError('Failed to load media');
    setIsLoaded(false);
  };

  useEffect(() => {
    // Reset loading state when content changes
    setIsLoaded(false);
    setError(null);
  }, [content.asset.url]);

  if (error) {
    return (
      <div className="media-renderer error" style={containerStyle}>
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="media-renderer" style={containerStyle}>
      {content.asset.type === 'image' && (
        <img
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={content.asset.url}
          alt={content.asset.metadata?.alt || ''}
          style={mediaStyle}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {content.asset.type === 'video' && (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={content.asset.url}
          style={mediaStyle}
          autoPlay={content.playbackSettings.autoplay}
          loop={content.playbackSettings.loop}
          muted={content.playbackSettings.volume === 0}
          controls={false}
          onLoadedData={handleLoad}
          onError={handleError}
        />
      )}

      {content.asset.type === 'audio' && (
        <audio
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={content.asset.url}
          autoPlay={content.playbackSettings.autoplay}
          loop={content.playbackSettings.loop}
          controls={false}
          onLoadedData={handleLoad}
          onError={handleError}
          onLoadedMetadata={(e) => {
            const audio = e.target as HTMLAudioElement;
            audio.volume = content.playbackSettings.volume;
          }}
        />
      )}

      {!isLoaded && !error && (
        <div className="loading-placeholder">
          Loading media...
        </div>
      )}

      {content.overlays && (
        <div className="media-overlays">
          {content.overlays.elements.map((overlay, index) => (
            <div
              key={overlay.id || index}
              className={`overlay overlay-${overlay.type}`}
              style={{
                position: 'absolute',
                left: overlay.position.x,
                top: overlay.position.y,
                width: overlay.position.width,
                height: overlay.position.height,
                zIndex: overlay.position.zIndex,
                ...overlay.styling,
              }}
            >
              {overlay.type === 'text' && overlay.content}
              {overlay.type === 'image' && (
                <img src={overlay.content} alt="" style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getObjectFit = (displayMode: string): React.CSSProperties['objectFit'] => {
  switch (displayMode) {
    case 'fit':
      return 'contain';
    case 'fill':
      return 'cover';
    case 'stretch':
      return 'fill';
    case 'center':
      return 'none';
    default:
      return 'contain';
  }
};

export default MediaRenderer; 