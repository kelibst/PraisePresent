import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { SlideRenderer } from './SlideRenderer';
import { Slide, SlideTheme, renderingEngine } from '@/services/RenderingEngine';
import { useDisplayBounds } from '@/hooks/useDisplayInfo';
import { useRenderingEngine } from '@/hooks/useRenderingEngine';
import { 
  selectLiveDisplayContent, 
  selectLiveDisplayTheme,
  setLiveDisplayContent,
  setLiveDisplayTheme,
  clearLiveDisplayContent
} from '@/lib/displaySlice';
import { 
  Content, 
  isSlideContent, 
  isTextContent, 
  isMediaContent, 
  isSystemContent,
  isBlackScreen,
  isLogoScreen,
  isPlaceholder,
  isError,
  createPlaceholderContent
} from '@/types/content';

interface LiveDisplayRendererProps {
  displayId?: number;
  theme?: SlideTheme;
  className?: string;
}

export const LiveDisplayRenderer: React.FC<LiveDisplayRendererProps> = ({
  displayId,
  theme,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(true);
  
  // Get state from Redux store
  const { bounds, workArea, scaleFactor } = useDisplayBounds(displayId || null);
  const currentContent = useSelector(selectLiveDisplayContent);
  const currentTheme = useSelector(selectLiveDisplayTheme) || theme;
  const { engine: renderingEngine, state: renderingState } = useRenderingEngine();

  useEffect(() => {
    // Set up IPC listeners for live display content
    const handleContentUpdate = (content: Content) => {
      console.log('Live display content update:', content);
      dispatch(setLiveDisplayContent(content));
      setIsVisible(true);
    };

    const handleContentClear = () => {
      console.log('Live display content cleared');
      dispatch(clearLiveDisplayContent());
    };

    const handleShowBlack = () => {
      console.log('Live display showing black screen');
      dispatch(setLiveDisplayContent({
        id: 'black-screen',
        type: 'system',
        data: { variant: 'black' }
      }));
      setIsVisible(true);
    };

    const handleShowLogo = () => {
      console.log('Live display showing logo screen');
      dispatch(setLiveDisplayContent({
        id: 'logo-screen',
        type: 'system',
        data: { 
          variant: 'logo',
          title: 'PraisePresent',
          subtitle: 'Live Display System'
        }
      }));
      setIsVisible(true);
    };

    const handleThemeUpdate = (newTheme: SlideTheme) => {
      console.log('Live display theme update:', newTheme);
      dispatch(setLiveDisplayTheme(newTheme));
    };

    // Set up proper IPC listeners through the preload script
    let cleanupFunctions: (() => void)[] = [];

    if (window.electron?.liveDisplay) {
      // Set up IPC event listeners
      cleanupFunctions.push(
        window.electron.liveDisplay.onContentUpdate(handleContentUpdate),
        window.electron.liveDisplay.onContentClear(handleContentClear),
        window.electron.liveDisplay.onShowBlack(handleShowBlack),
        window.electron.liveDisplay.onShowLogo(handleShowLogo),
        window.electron.liveDisplay.onThemeUpdate(handleThemeUpdate)
      );
    }

    // Initialize with placeholder content
    dispatch(setLiveDisplayContent(createPlaceholderContent(
      'initial-placeholder',
      'PraisePresent Live Display',
      'Ready to display content'
    )));

    return () => {
      // Clean up IPC listeners
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, []);

  // Set display info in rendering engine
  useEffect(() => {
    if (displayId && bounds) {
      // Use proper display information from Redux store
      const displayInfo = {
        id: displayId,
        bounds: bounds,
        workArea: workArea || bounds,
        scaleFactor: scaleFactor,
        rotation: 0,
        touchSupport: "unavailable" as const,
        isPrimary: false,
        label: `Display ${displayId}`,
        friendlyName: `Display ${displayId}`,
      };
      renderingEngine.setDisplayInfo(displayInfo);
    }
  }, [displayId, bounds, workArea, scaleFactor]);

  const containerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  const renderContent = () => {
    if (!currentContent) {
      return <div>No content to display</div>;
    }

    // Handle slide content
    if (isSlideContent(currentContent)) {
      // For slide content, we need to convert it to a Slide object
      // This is a temporary solution - ideally the slide data should be passed properly
      return <div>Slide content rendering not yet implemented</div>;
    }

    // Handle text content
    if (isTextContent(currentContent)) {
      const { text, styling } = currentContent.data;
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: styling.textAlign as any,
          fontSize: styling.fontSize,
          fontFamily: styling.fontFamily,
          fontWeight: styling.fontWeight,
          color: styling.textColor,
          backgroundColor: styling.backgroundColor,
          padding: `${styling.padding.top}px ${styling.padding.right}px ${styling.padding.bottom}px ${styling.padding.left}px`,
        }}>
          {text}
        </div>
      );
    }

    // Handle media content
    if (isMediaContent(currentContent)) {
      const { url, mediaType } = currentContent.data;
      
      if (mediaType === 'image') {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img 
              src={url} 
              alt="Live content"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        );
      }

      if (mediaType === 'video') {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <video 
              src={url}
              autoPlay
              loop
              muted
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        );
      }

      return <div>Unsupported media type: {mediaType}</div>;
    }

    // Handle system content
    if (isSystemContent(currentContent)) {
      const systemData = currentContent.data;

      if (isBlackScreen(systemData)) {
        return <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />;
      }

      if (isLogoScreen(systemData)) {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <div style={{ 
              fontSize: '4rem', 
              fontWeight: 'bold', 
              marginBottom: '2rem',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              {systemData.title || 'PraisePresent'}
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              color: '#cccccc',
              textAlign: 'center',
            }}>
              {systemData.subtitle || 'Live Display System'}
            </div>
          </div>
        );
      }

      if (isPlaceholder(systemData)) {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#ffffff',
            }}>
              {systemData.title}
            </div>
            {systemData.subtitle && (
              <div style={{ 
                fontSize: '1.5rem', 
                color: '#cccccc',
                marginBottom: '2rem',
              }}>
                {systemData.subtitle}
              </div>
            )}
            {systemData.timestamp && (
              <div style={{ 
                fontSize: '1rem', 
                color: '#999999',
              }}>
                {systemData.timestamp}
              </div>
            )}
          </div>
        );
      }

      if (isError(systemData)) {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#ff6b6b',
            }}>
              Error: {systemData.message}
            </div>
            {systemData.details && (
              <div style={{ 
                fontSize: '1rem', 
                color: '#cccccc',
              }}>
                {systemData.details}
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div style={{ 
        fontSize: '2rem', 
        color: '#ff6b6b',
        textAlign: 'center',
      }}>
        Unknown content type: {currentContent.type}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`live-display-renderer ${className}`}
      style={containerStyle}
    >
      {renderContent()}
    </div>
  );
};

export default LiveDisplayRenderer; 