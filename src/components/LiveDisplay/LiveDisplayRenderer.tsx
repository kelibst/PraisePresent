import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../lib/store";
import { setLiveItem } from "../../lib/presentationSlice";
import UniversalSlideRenderer from "../UniversalSlideRenderer";
import { convertVerseToSlide, convertSongSlideToSlide, convertNoteToSlide } from "../../lib/slideConverters";
import { UniversalSlide } from "../../lib/universalSlideSlice";
import "./LiveDisplayRenderer.css";

interface LiveDisplayTheme {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  textColor: string;
  subtitleColor: string;
  referenceColor: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  padding: number;
  textShadow: boolean;
  alignment: "left" | "center" | "right";
  animation: "none" | "fade" | "slide" | "zoom";
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

interface LiveContent {
  type:
  | "scripture"
  | "song"
  | "announcement"
  | "media"
  | "slide"
  | "universal-slide"
  | "black"
  | "logo"
  | "placeholder";
  title?: string;
  content?: string | any;
  verse?: string;
  reference?: string;
  lines?: string[];
  subtitle?: string;
  translation?: string;
  universalSlide?: any; // For Universal Slide data
}

const defaultTheme: LiveDisplayTheme = {
  backgroundColor: "#000000",
  backgroundGradient: "linear-gradient(135deg, #1e1e1e 0%, #000000 100%)",
  textColor: "#ffffff",
  subtitleColor: "#cccccc",
  referenceColor: "#60a5fa",
  fontSize: 5,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: 1.3,
  padding: 2,
  textShadow: true,
  alignment: "center",
  animation: "fade",
  borderColor: "#333333",
  borderWidth: 0,
  borderRadius: 0,
};

// Convert content item to Universal Slide
const convertContentToSlide = (content: LiveContent): UniversalSlide | null => {
  if (!content || content.type === 'black' || content.type === 'logo' || content.type === 'placeholder') {
    return null;
  }

  // If already a universal slide, return it
  if (content.type === 'universal-slide' && content.universalSlide) {
    return content.universalSlide;
  }

  // Convert based on content type
  switch (content.type) {
    case 'scripture':
      // Create a mock verse object for conversion with all required fields
      const mockVerse = {
        id: `verse-${Date.now()}`,
        bookId: 1,
        chapter: parseInt(content.reference?.split(':')[0]?.split(' ').pop() || '1'),
        verse: parseInt(content.reference?.split(':')[1] || '1'),
        text: content.content || content.verse || '',
        versionId: 'kjv',
        book: {
          id: 1,
          name: content.title?.split(' ')[0] || 'Unknown',
          shortName: content.title?.split(' ')[0] || 'Unknown',
          testament: 'unknown',
          category: 'unknown',
          chapters: 1,
          order: 1
        },
        version: {
          id: 'kjv',
          name: content.translation || content.subtitle || 'Unknown',
          fullName: content.translation || content.subtitle || 'Unknown',
          translationId: 'kjv',
          isDefault: true
        }
      };
      return convertVerseToSlide(mockVerse, content.translation || content.subtitle);

    case 'song':
      // Create a mock song and slide for conversion with all required fields
      const mockSong = {
        id: `song-${Date.now()}`,
        title: content.title || 'Untitled Song',
        artist: content.subtitle || '',
        author: content.subtitle || '',
        lyrics: Array.isArray(content.lines) ? content.lines.join('\n') : (content.content || ''),
        structure: { slides: [], order: [] },
        key: '',
        tempo: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };
      const mockSongSlide = {
        id: `slide-${Date.now()}`,
        type: 'verse' as const,
        title: content.title || 'Verse 1',
        content: Array.isArray(content.lines) ? content.lines.join('\n') : (content.content || '')
      };
      return convertSongSlideToSlide(mockSong, mockSongSlide);

    case 'announcement':
    case 'media':
    case 'slide':
      return convertNoteToSlide(
        content.title || 'Untitled',
        content.content || ''
      );

    default:
      return convertNoteToSlide(
        content.title || 'Content',
        content.content || ''
      );
  }
};

const LiveDisplayRenderer: React.FC = () => {
  console.log("🔴 LIVE DISPLAY RENDERER: Component mounting");

  // Get live content from Redux store
  const liveItem = useSelector(
    (state: RootState) => state.presentation.liveItem
  );
  const dispatch = useDispatch();

  console.log("🔴 LIVE DISPLAY RENDERER: Redux liveItem:", liveItem);

  // Convert Redux live item to LiveContent format
  const getContentFromRedux = (): LiveContent | null => {
    if (!liveItem) {
      return {
        type: "placeholder",
        title: "PraisePresent",
        content: {
          mainText: "Live Display Ready",
          subText: "Waiting for content...",
          timestamp: new Date().toLocaleTimeString(),
        },
      };
    }

    if (liveItem.type === "scripture") {
      return {
        type: "scripture",
        title: liveItem.title,
        content: liveItem.content,
        reference: liveItem.reference,
        subtitle: liveItem.translation,
      };
    }

    if (liveItem.type === "song") {
      return {
        type: "song",
        title: liveItem.title,
        content: liveItem.content?.lyrics || liveItem.content,
        subtitle: liveItem.content?.artist || "",
        lines: liveItem.content?.lyrics ? liveItem.content.lyrics.split('\n') : [],
      };
    }

    if (liveItem.type === "universal-slide") {
      return {
        type: "universal-slide",
        title: liveItem.title,
        content: liveItem.content,
        subtitle: liveItem.reference,
        universalSlide: liveItem.universalSlide,
      };
    }

    // Handle other content types
    return {
      type: liveItem.type as any,
      title: liveItem.title,
      content: liveItem.content,
    };
  };

  const [content, setContent] = useState<LiveContent | null>(getContentFromRedux());
  const [theme, setTheme] = useState<LiveDisplayTheme>(defaultTheme);
  const [showBlack, setShowBlack] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [ipcConnected, setIpcConnected] = useState(false);

  console.log("🔴 LIVE DISPLAY RENDERER: Initial state set, content:", content);

  // Update content when Redux state changes
  useEffect(() => {
    const newContent = getContentFromRedux();

    // Only update if the content has actually changed to prevent unnecessary re-renders
    const contentChanged =
      !content ||
      content.type !== newContent?.type ||
      content.title !== newContent?.title ||
      content.content !== newContent?.content;

    if (contentChanged) {
      console.log("🔴 LIVE DISPLAY: Content changed, updating local state");
      setContent(newContent);
      setShowBlack(false);
      setShowLogo(false);
      setIsVisible(true);
    } else {
      console.log("🔴 LIVE DISPLAY: Content unchanged, skipping update");
    }
  }, [liveItem]);

  useEffect(() => {
    console.log("🔴 LIVE DISPLAY RENDERER: Setting up IPC listeners...");
    console.log(
      "🔴 LIVE DISPLAY RENDERER: window.electronAPI available:",
      !!window.electronAPI
    );

    if (!window.electronAPI) {
      console.warn(
        "🔴 LIVE DISPLAY RENDERER: electronAPI not available - using Redux state only"
      );
      return;
    }

    // Set up IPC handlers for direct communication from main process
    const handleContentUpdate = (newContent: LiveContent) => {
      console.log("🔴 LIVE DISPLAY: IPC content update received:", newContent);
      setContent(newContent);
      setShowBlack(false);
      setShowLogo(false);
      setIsVisible(true);
    };

    const handleContentClear = () => {
      console.log("🔴 LIVE DISPLAY: IPC content clear");
      setContent({
        type: "placeholder",
        title: "PraisePresent",
        content: {
          mainText: "Live Display Ready",
          subText: "Cleared",
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      setShowBlack(false);
      setShowLogo(false);
      setIsVisible(true);
    };

    const handleShowBlack = () => {
      console.log("🔴 LIVE DISPLAY: IPC show black screen");
      setShowBlack(true);
      setShowLogo(false);
      setIsVisible(false);
    };

    const handleShowLogo = () => {
      console.log("🔴 LIVE DISPLAY: IPC show logo");
      setShowLogo(true);
      setShowBlack(false);
      setIsVisible(false);
    };

    const handleThemeUpdate = (newTheme: Partial<LiveDisplayTheme>) => {
      console.log("🔴 LIVE DISPLAY: IPC theme update:", newTheme);
      setTheme(prevTheme => ({ ...prevTheme, ...newTheme }));
    };

    // Register IPC handlers using existing API structure
    try {
      const cleanupContentUpdate = window.electronAPI.onLiveContentUpdate?.(handleContentUpdate);
      const cleanupContentClear = window.electronAPI.onLiveContentClear?.(handleContentClear);
      const cleanupShowBlack = window.electronAPI.onLiveShowBlack?.(handleShowBlack);
      const cleanupShowLogo = window.electronAPI.onLiveShowLogo?.(handleShowLogo);
      const cleanupThemeUpdate = window.electronAPI.onLiveThemeUpdate?.(handleThemeUpdate);

      setIpcConnected(true);
      console.log("🔴 LIVE DISPLAY RENDERER: IPC listeners registered successfully");

      // Cleanup function
      return () => {
        try {
          cleanupContentUpdate?.();
          cleanupContentClear?.();
          cleanupShowBlack?.();
          cleanupShowLogo?.();
          cleanupThemeUpdate?.();
          console.log("🔴 LIVE DISPLAY RENDERER: IPC listeners cleaned up");
        } catch (error) {
          console.error("🔴 LIVE DISPLAY RENDERER: Error cleaning up listeners:", error);
        }
      };
    } catch (error) {
      console.error("🔴 LIVE DISPLAY RENDERER: Failed to register IPC listeners:", error);
      setIpcConnected(false);
    }
  }, []);

  // Render black screen
  if (showBlack) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Completely black - no content */}
      </div>
    );
  }

  // Render logo/church branding
  if (showLogo) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "#ffffff" }}>
          <div
            style={{
              fontSize: "8rem",
              marginBottom: "2rem",
              textShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            ✝️
          </div>
          <h2
            style={{
              fontSize: "4rem",
              fontWeight: 300,
              opacity: 0.9,
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            Church Name
          </h2>
        </div>
      </div>
    );
  }

  // Convert content to slide and render using UniversalSlideRenderer
  const slide = content ? convertContentToSlide(content) : null;

  // Override slide background to ensure consistency with dark theme
  const consistentSlide = slide ? {
    ...slide,
    background: {
      type: 'gradient' as const,
      colors: ['#1e1e1e', '#000000'],
      opacity: 1
    }
  } : null;

  return (
    <div
      className={`live-display-container ${theme.animation} ${isVisible ? "visible" : ""}`}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundGradient,
      }}
    >
      {/* Debug info overlay - remove in production */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(0,0,0,0.8)",
          color: "#00ff00",
          padding: "10px",
          fontSize: "12px",
          borderRadius: "5px",
          fontFamily: "monospace",
          zIndex: 1000,
          opacity: 0.7,
        }}
      >
        <div>🔴 LIVE DISPLAY DEBUG (UNIFIED SLIDES)</div>
        <div>Redux liveItem Type: {liveItem?.type || "none"}</div>
        <div>Redux liveItem Title: {liveItem?.title || "none"}</div>
        <div>Local Content Type: {content?.type || "none"}</div>
        <div>Converted to Slide: {consistentSlide ? "✅" : "❌"}</div>
        <div>Slide Type: {consistentSlide?.type || "none"}</div>
        <div>Background: Dark Theme Applied</div>
        <div>IPC Connected: {ipcConnected ? "✅" : "❌"}</div>
        <div>Show Black: {showBlack ? "✅" : "❌"}</div>
        <div>Show Logo: {showLogo ? "✅" : "❌"}</div>
      </div>

      {/* Render content using UniversalSlideRenderer or placeholder */}
      {consistentSlide ? (
        <div className="w-full h-full">
          <UniversalSlideRenderer
            slide={consistentSlide}
            width={1920}
            height={1080}
            isPreview={false}
            onSlideComplete={() => { /* Handle slide completion if needed */ }}
          />
        </div>
      ) : content?.type === "placeholder" ? (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: theme.backgroundGradient,
            color: theme.textColor
          }}
        >
          <div className="text-center">
            <div
              style={{
                fontSize: "6rem",
                marginBottom: "2rem",
                opacity: 0.8,
              }}
            >
              🎵
            </div>
            <div
              style={{
                fontSize: "4rem",
                fontWeight: 300,
                marginBottom: "1rem",
              }}
            >
              {content.content?.mainText || content.title}
            </div>
            <div
              style={{
                fontSize: "2rem",
                opacity: 0.7,
                color: theme.subtitleColor,
              }}
            >
              {content.content?.subText || "Live Display Ready"}
            </div>
            {content.content?.timestamp && (
              <div
                style={{
                  fontSize: "1.5rem",
                  opacity: 0.7,
                  marginTop: "2rem",
                  color: theme.subtitleColor,
                }}
              >
                Ready since {content.content.timestamp}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: theme.backgroundGradient,
            color: theme.textColor
          }}
        >
          <div className="text-center opacity-60">
            <div
              style={{
                fontSize: "4rem",
                fontWeight: 300,
                marginBottom: "1rem",
              }}
            >
              Ready for Presentation
            </div>
            <p
              style={{
                fontSize: "2rem",
                opacity: 0.7,
                color: theme.subtitleColor,
              }}
            >
              Waiting for content...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDisplayRenderer;
