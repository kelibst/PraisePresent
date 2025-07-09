import React, { useEffect, useState, useRef } from 'react';
import { SlideRenderer } from './SlideRenderer';
import { Slide, SlideTheme, renderingEngine } from '@/services/RenderingEngine';

interface LiveDisplayRendererProps {
  displayId?: number;
  theme?: SlideTheme;
  className?: string;
}

interface LiveContent {
  type: 'slide' | 'text' | 'image' | 'video' | 'black' | 'logo' | 'placeholder';
  data?: any;
  slide?: Slide;
  title?: string;
  content?: any;
}

export const LiveDisplayRenderer: React.FC<LiveDisplayRendererProps> = ({
  displayId,
  theme,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentContent, setCurrentContent] = useState<LiveContent | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<SlideTheme | undefined>(theme);

  useEffect(() => {
    // Set up IPC listeners for live display content
    const handleContentUpdate = (content: LiveContent) => {
      console.log('Live display content update:', content);
      setCurrentContent(content);
      setIsVisible(true);
    };

    const handleContentClear = () => {
      console.log('Live display content cleared');
      setCurrentContent(null);
    };

    const handleShowBlack = () => {
      console.log('Live display showing black screen');
      setCurrentContent({ type: 'black' });
      setIsVisible(true);
    };

    const handleShowLogo = () => {
      console.log('Live display showing logo screen');
      setCurrentContent({ type: 'logo' });
      setIsVisible(true);
    };

    const handleThemeUpdate = (newTheme: SlideTheme) => {
      console.log('Live display theme update:', newTheme);
      setCurrentTheme(newTheme);
    };

    // Set up IPC listeners (these would be set up in the preload script)
    if (window.electron) {
      window.addEventListener('live-content-update', (event: any) => {
        handleContentUpdate(event.detail);
      });

      window.addEventListener('live-content-clear', () => {
        handleContentClear();
      });

      window.addEventListener('live-show-black', () => {
        handleShowBlack();
      });

      window.addEventListener('live-show-logo', () => {
        handleShowLogo();
      });

      window.addEventListener('live-theme-update', (event: any) => {
        handleThemeUpdate(event.detail);
      });
    }

    // Initialize with placeholder content
    setCurrentContent({
      type: 'placeholder',
      title: 'Live Display Ready',
      content: {
        mainText: 'PraisePresent Live Display',
        subText: 'Ready to display content',
        timestamp: new Date().toLocaleTimeString(),
      },
    });

    return () => {
      // Clean up listeners
      if (window.electron) {
        window.removeEventListener('live-content-update', handleContentUpdate as any);
        window.removeEventListener('live-content-clear', handleContentClear);
        window.removeEventListener('live-show-black', handleShowBlack);
        window.removeEventListener('live-show-logo', handleShowLogo);
        window.removeEventListener('live-theme-update', handleThemeUpdate as any);
      }
    };
  }, []);

  // Set display info in rendering engine
  useEffect(() => {
    if (displayId) {
      // This would typically get display info from the display manager
      const displayInfo = {
        id: displayId,
        bounds: { 
          x: 0, 
          y: 0, 
          width: window.innerWidth, 
          height: window.innerHeight 
        },
        workArea: { 
          x: 0, 
          y: 0, 
          width: window.innerWidth, 
          height: window.innerHeight 
        },
        scaleFactor: 1,
        rotation: 0,
        touchSupport: "unavailable" as const,
        isPrimary: false,
        label: `Display ${displayId}`,
        friendlyName: `Display ${displayId}`,
      };
      renderingEngine.setDisplayInfo(displayInfo);
    }
  }, [displayId]);

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

    switch (currentContent.type) {
      case 'slide':
        if (currentContent.slide) {
          return (
            <SlideRenderer
              slide={currentContent.slide}
              theme={currentTheme}
              isActive={isVisible}
              className="live-slide"
            />
          );
        }
        return <div>Invalid slide data</div>;

      case 'black':
        return <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />;

      case 'logo':
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
              PraisePresent
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              color: '#cccccc',
              textAlign: 'center',
            }}>
              Live Display System
            </div>
          </div>
        );

      case 'placeholder':
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#2a2a2a',
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
              {currentContent.content?.mainText || 'Live Display'}
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              color: '#cccccc',
              marginBottom: '2rem',
            }}>
              {currentContent.content?.subText || 'Ready to display content'}
            </div>
            {currentContent.content?.timestamp && (
              <div style={{ 
                fontSize: '1rem', 
                color: '#999999',
              }}>
                {currentContent.content.timestamp}
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#ffffff',
            padding: '2rem',
          }}>
            {currentContent.data?.text || 'Text Content'}
          </div>
        );

      case 'image':
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img 
              src={currentContent.data?.url} 
              alt="Live content"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <video 
              src={currentContent.data?.url}
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

      default:
        return (
          <div style={{ 
            fontSize: '2rem', 
            color: '#ff6b6b',
            textAlign: 'center',
          }}>
            Unknown content type: {currentContent.type}
          </div>
        );
    }
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