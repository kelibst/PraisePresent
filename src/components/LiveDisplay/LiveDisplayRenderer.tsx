import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../lib/store";
import { setLiveItem } from "../../lib/presentationSlice";
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

    // Handle other content types
    return {
      type: liveItem.type as any,
      title: liveItem.title,
      content: liveItem.content,
    };
  };

  // Calculate adaptive text size class based on content length
  const getScriptureTextSizeClass = (text: string): string => {
    const textLength = text?.length || 0;

    if (textLength < 100) {
      return 'short';
    } else if (textLength < 200) {
      return 'medium';
    } else if (textLength < 350) {
      return 'long';
    } else if (textLength < 500) {
      return 'very-long';
    } else {
      return 'ultra-long';
    }
  };

  const [content, setContent] = useState<LiveContent | null>(
    getContentFromRedux()
  );
  const [theme, setTheme] = useState<LiveDisplayTheme>(defaultTheme);
  const [showBlack, setShowBlack] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [ipcConnected, setIpcConnected] = useState(false);

  console.log("🔴 LIVE DISPLAY RENDERER: Initial state set, content:", content);

  // Update content when Redux state changes
  useEffect(() => {
    const newContent = getContentFromRedux();
    // console.log("🔴 LIVE DISPLAY: Redux state changed");
    // console.log("  - liveItem type:", liveItem?.type);
    // console.log("  - liveItem title:", liveItem?.title);
    // console.log("  - New content type:", newContent?.type);

    // Only update if the content has actually changed to prevent unnecessary re-renders
    const contentChanged =
      !content ||
      content.type !== newContent?.type ||
      content.title !== newContent?.title ||
      content.content !== newContent?.content;

    if (contentChanged) {
      // console.log("🔴 LIVE DISPLAY: Content changed, updating local state");
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

      // Try to debug why electronAPI is not available
      console.log(
        "🔴 LIVE DISPLAY RENDERER: Attempting to find electronAPI..."
      );
      console.log(
        "🔴 LIVE DISPLAY RENDERER: window keys containing 'electron':",
        Object.keys(window).filter((key) =>
          key.toLowerCase().includes("electron")
        )
      );

      // Check if preload was set correctly
      console.log("🔴 LIVE DISPLAY RENDERER: Checking for any exposed APIs...");
      const exposedAPIs = Object.keys(window).filter(
        (key) =>
          ![
            "window",
            "self",
            "document",
            "location",
            "history",
            "navigator",
            "screen",
          ].includes(key) &&
          !key.startsWith("webkit") &&
          !key.startsWith("chrome") &&
          !key.startsWith("on")
      );
      console.log(
        "🔴 LIVE DISPLAY RENDERER: Non-standard window properties:",
        exposedAPIs
      );

      return;
    }

    console.log(
      "🔴 LIVE DISPLAY RENDERER: electronAPI methods available:",
      Object.keys(window.electronAPI)
    );

    // IPC Content Update Handler
    const handleContentUpdate = (newContent: LiveContent) => {
      console.log(
        "🔴 LIVE DISPLAY RENDERER: *** IPC CONTENT UPDATE RECEIVED ***",
        newContent
      );
      console.log("🔴 LIVE DISPLAY RENDERER: Content type:", newContent.type);
      console.log("🔴 LIVE DISPLAY RENDERER: Content details:", {
        title: newContent.title,
        content: newContent.content,
        reference: newContent.reference,
        verse: newContent.verse,
      });

      // Update local state for immediate UI update
      setContent(newContent);
      setShowBlack(false);
      setShowLogo(false);
      setIsVisible(true);

      // DO NOT dispatch to Redux here - it would create a circular loop
      // The Redux state should already be updated by the action that triggered this IPC message
      console.log(
        "🔴 LIVE DISPLAY RENDERER: Local state updated, NOT dispatching to Redux to avoid loop"
      );
    };

    const handleContentClear = () => {
      console.log(
        "🔴 LIVE DISPLAY RENDERER: *** IPC CONTENT CLEAR RECEIVED ***"
      );
      setContent({
        type: "placeholder",
        title: "PraisePresent",
        content: {
          mainText: "Live Display Ready",
          subText: "Waiting for content...",
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      setShowBlack(false);
      setShowLogo(false);
      setIsVisible(true);
    };

    const handleShowBlack = () => {
      console.log(
        "🔴 LIVE DISPLAY RENDERER: *** IPC BLACK SCREEN RECEIVED ***"
      );
      setShowBlack(true);
      setShowLogo(false);
      setIsVisible(false);
    };

    const handleShowLogo = () => {
      console.log("🔴 LIVE DISPLAY RENDERER: *** IPC LOGO SCREEN RECEIVED ***");
      setShowLogo(true);
      setShowBlack(false);
      setIsVisible(false);
    };

    const handleThemeUpdate = (newTheme: Partial<LiveDisplayTheme>) => {
      console.log(
        "🔴 LIVE DISPLAY RENDERER: *** IPC THEME UPDATE RECEIVED ***",
        newTheme
      );
      setTheme((prev) => ({ ...prev, ...newTheme }));
    };

    // Set up IPC listeners with enhanced error handling
    try {
      console.log(
        "🔴 LIVE DISPLAY RENDERER: Setting up onLiveContentUpdate listener..."
      );

      // Test if the function exists and is callable
      console.log(
        "🔴 LIVE DISPLAY RENDERER: onLiveContentUpdate type:",
        typeof window.electronAPI.onLiveContentUpdate
      );
      console.log(
        "🔴 LIVE DISPLAY RENDERER: onLiveContentUpdate function:",
        window.electronAPI.onLiveContentUpdate
      );

      // Test the listener setup
      const cleanupContentUpdate =
        window.electronAPI.onLiveContentUpdate?.(handleContentUpdate);
      console.log(
        "🔴 LIVE DISPLAY RENDERER: onLiveContentUpdate listener setup result:",
        !!cleanupContentUpdate
      );
      console.log(
        "🔴 LIVE DISPLAY RENDERER: cleanup function type:",
        typeof cleanupContentUpdate
      );

      const cleanupContentClear =
        window.electronAPI.onLiveContentClear?.(handleContentClear);
      const cleanupShowBlack =
        window.electronAPI.onLiveShowBlack?.(handleShowBlack);
      const cleanupShowLogo =
        window.electronAPI.onLiveShowLogo?.(handleShowLogo);
      const cleanupThemeUpdate =
        window.electronAPI.onLiveThemeUpdate?.(handleThemeUpdate);

      // Test IPC invoke functionality
      console.log("🔴 LIVE DISPLAY RENDERER: Testing IPC invoke...");
      try {
        window.electronAPI
          .invoke("live-display:getStatus")
          .then((status) => {
            console.log(
              "🔴 LIVE DISPLAY RENDERER: IPC invoke test successful:",
              status
            );
          })
          .catch((error) => {
            console.error(
              "🔴 LIVE DISPLAY RENDERER: IPC invoke test failed:",
              error
            );
          });
      } catch (error) {
        console.error(
          "🔴 LIVE DISPLAY RENDERER: IPC invoke test error:",
          error
        );
      }

      setIpcConnected(true);
      console.log(
        "🔴 LIVE DISPLAY RENDERER: All IPC listeners setup complete!"
      );

      // Manual test removed to prevent unnecessary updates

      // Cleanup function
      return () => {
        console.log("🔴 LIVE DISPLAY RENDERER: Cleaning up IPC listeners");
        try {
          cleanupContentUpdate?.();
          cleanupContentClear?.();
          cleanupShowBlack?.();
          cleanupShowLogo?.();
          cleanupThemeUpdate?.();
        } catch (error) {
          console.error(
            "🔴 LIVE DISPLAY RENDERER: Error during cleanup:",
            error
          );
        }
      };
    } catch (error) {
      console.error(
        "🔴 LIVE DISPLAY RENDERER: Error setting up IPC listeners:",
        error
      );
    }
  }, []);

  // Add periodic state logging for debugging
  useEffect(() => {
    const logInterval = setInterval(() => {
      console.log("🔴 LIVE DISPLAY RENDERER: Periodic state check:", {
        content: content,
        ipcConnected: ipcConnected,
        showBlack: showBlack,
        showLogo: showLogo,
        isVisible: isVisible,
        reduxLiveItem: liveItem,
      });
    }, 10000); // Log every 10 seconds

    return () => clearInterval(logInterval);
  }, [content, ipcConnected, showBlack, showLogo, isVisible, liveItem]);

  const getContainerStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      width: "100vw",
      height: "100vh",
      margin: 0,
      padding: `${theme.padding}rem`,
      fontFamily: theme.fontFamily,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      cursor: "none",
      textAlign: theme.alignment,
      boxSizing: "border-box",
    };

    if (theme.backgroundImage) {
      style.backgroundImage = `url(${theme.backgroundImage})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
      style.backgroundRepeat = "no-repeat";
    } else if (theme.backgroundGradient) {
      style.background = theme.backgroundGradient;
    } else {
      style.backgroundColor = theme.backgroundColor;
    }

    return style;
  };

  const getTextStyle = (
    isSubtitle = false,
    isReference = false
  ): React.CSSProperties => {
    let color = theme.textColor;
    if (isSubtitle) color = theme.subtitleColor;
    if (isReference) color = theme.referenceColor;

    return {
      color,
      fontSize: `${theme.fontSize * (isSubtitle ? 0.7 : isReference ? 0.8 : 1)
        }rem`,
      lineHeight: theme.lineHeight,
      textShadow: theme.textShadow ? "0 2px 4px rgba(0, 0, 0, 0.7)" : "none",
      fontWeight: isReference ? 600 : isSubtitle ? 300 : 400,
      margin: 0,
      padding: "0.5rem 0",
    };
  };

  const getContentContainerStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      maxWidth: content?.type === "scripture" ? "100%" : "90%",
      width: "100%",
      height: content?.type === "scripture" ? "100%" : "auto",
      textAlign: theme.alignment,
      display: content?.type === "scripture" ? "flex" : "block",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: content?.type === "scripture" ? "1rem" : "2rem",
    };

    if (theme.borderWidth && theme.borderWidth > 0 && content?.type !== "scripture") {
      style.border = `${theme.borderWidth}px solid ${theme.borderColor}`;
      style.borderRadius = `${theme.borderRadius}px`;
      style.padding = "2rem";
      style.backgroundColor = "rgba(0, 0, 0, 0.3)";
      style.backdropFilter = "blur(10px)";
    }

    return style;
  };

  // Render black screen
  if (showBlack) {
    return (
      <div style={{ ...getContainerStyle(), backgroundColor: "#000000" }} />
    );
  }

  // Render logo screen
  if (showLogo) {
    return (
      <div
        style={{
          ...getContainerStyle(),
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

  // Render content or default screen
  return (
    <div
      style={getContainerStyle()}
      className={`live-display-animation ${theme.animation} ${isVisible ? "visible" : ""
        }`}
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
        <div>🔴 LIVE DISPLAY DEBUG</div>
        <div>Redux liveItem Type: {liveItem?.type || "none"}</div>
        <div>Redux liveItem Title: {liveItem?.title || "none"}</div>
        <div>Local Content Type: {content?.type || "none"}</div>
        <div>IPC Connected: {ipcConnected ? "✅" : "❌"}</div>
        <div>Show Black: {showBlack ? "✅" : "❌"}</div>
        <div>Show Logo: {showLogo ? "✅" : "❌"}</div>
      </div>

      {content && isVisible ? (
        <div style={getContentContainerStyle()}>
          {content.type === "scripture" && (
            <div className="scripture-content scripture-display">
              {content.reference && (
                <div className="scripture-reference">
                  {content.reference}
                </div>
              )}
              <div className={`scripture-text ${getScriptureTextSizeClass(content.content || content.verse || '')}`}>
                {content.content || content.verse}
              </div>
              {(content.subtitle || content.translation) && (
                <div className="scripture-translation">
                  — {content.translation || content.subtitle}
                </div>
              )}
            </div>
          )}

          {content.type === "song" && (
            <div className="song-content">
              {content.title && (
                <div
                  style={{
                    ...getTextStyle(false, true),
                    fontSize: "2.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  🎵 {content.title}
                </div>
              )}
              <div style={getTextStyle()}>
                {content.lines && Array.isArray(content.lines) ? (
                  content.lines.map((line, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "1.5rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {line}
                    </div>
                  ))
                ) : content.content && typeof content.content === "string" ? (
                  content.content.split("\n").map((line, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "1.5rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <div>{content.content}</div>
                )}
              </div>
              {content.subtitle && (
                <div
                  style={{
                    ...getTextStyle(true),
                    fontSize: "1.8rem",
                    opacity: 0.7,
                    marginTop: "2rem",
                    fontStyle: "italic",
                  }}
                >
                  {content.subtitle}
                </div>
              )}
            </div>
          )}

          {content.type === "announcement" && (
            <div className="announcement-content">
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "2rem",
                  opacity: 0.8,
                  color: theme.referenceColor,
                }}
              >
                📢
              </div>
              {content.title && (
                <div
                  style={{
                    ...getTextStyle(false, true),
                    fontSize: "2.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  {content.title}
                </div>
              )}
              <div style={getTextStyle()}>
                {typeof content.content === "string"
                  ? content.content.split("\n").map((line, index) => (
                    <div key={index} style={{ marginBottom: "1rem" }}>
                      {line}
                    </div>
                  ))
                  : content.content}
              </div>
              {content.subtitle && (
                <div
                  style={{
                    ...getTextStyle(true),
                    fontSize: "1.8rem",
                    opacity: 0.7,
                    marginTop: "2rem",
                  }}
                >
                  {content.subtitle}
                </div>
              )}
            </div>
          )}

          {content.type === "media" && (
            <div className="media-content">
              <div
                style={{
                  fontSize: "4rem",
                  marginBottom: "2rem",
                  opacity: 0.8,
                  color: theme.referenceColor,
                }}
              >
                🎬
              </div>
              {content.title && (
                <div
                  style={{
                    ...getTextStyle(false, true),
                    fontSize: "2.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  {content.title}
                </div>
              )}
              {content.content && (
                <div style={getTextStyle()}>{content.content}</div>
              )}
              {content.subtitle && (
                <div
                  style={{
                    ...getTextStyle(true),
                    fontSize: "1.8rem",
                    opacity: 0.7,
                    marginTop: "2rem",
                  }}
                >
                  {content.subtitle}
                </div>
              )}
            </div>
          )}

          {content.type === "slide" && (
            <div className="slide-content">
              {content.title && (
                <div
                  style={{
                    ...getTextStyle(false, true),
                    fontSize: "2.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  📄 {content.title}
                </div>
              )}
              <div style={getTextStyle()}>
                {typeof content.content === "string"
                  ? content.content.split("\n").map((line, index) => (
                    <div key={index} style={{ marginBottom: "1rem" }}>
                      {line}
                    </div>
                  ))
                  : content.content}
              </div>
              {content.subtitle && (
                <div
                  style={{
                    ...getTextStyle(true),
                    fontSize: "1.6rem",
                    opacity: 0.6,
                    marginTop: "2rem",
                    fontStyle: "italic",
                  }}
                >
                  {content.subtitle}
                </div>
              )}
            </div>
          )}

          {content.type === "placeholder" && (
            <div className="placeholder-content">
              <div
                style={{ fontSize: "6rem", marginBottom: "2rem", opacity: 0.8 }}
              >
                🎵
              </div>
              <div style={getTextStyle(false, true)}>
                {content.content?.mainText || content.title}
              </div>
              <div style={getTextStyle(true)}>
                {content.content?.subText || "Live Display Ready"}
              </div>
              {content.content?.timestamp && (
                <div
                  style={{
                    ...getTextStyle(true),
                    fontSize: "1.5rem",
                    opacity: 0.7,
                    marginTop: "2rem",
                  }}
                >
                  Ready since {content.content.timestamp}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", opacity: 0.6 }}>
          <div
            style={{
              fontSize: "4rem",
              fontWeight: 300,
              marginBottom: "1rem",
              color: theme.textColor,
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
      )}
    </div>
  );
};

export default LiveDisplayRenderer;
