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
    | "black"
    | "logo"
    | "placeholder";
  title?: string;
  content?: string | any;
  verse?: string;
  reference?: string;
  lines?: string[];
  subtitle?: string;
}

const defaultTheme: LiveDisplayTheme = {
  backgroundColor: "#000000",
  backgroundGradient: "linear-gradient(135deg, #1e1e1e 0%, #000000 100%)",
  textColor: "#ffffff",
  subtitleColor: "#cccccc",
  referenceColor: "#60a5fa",
  fontSize: 3.5,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: 1.4,
  padding: 4,
  textShadow: true,
  alignment: "center",
  animation: "fade",
  borderColor: "#333333",
  borderWidth: 0,
  borderRadius: 0,
};

const LiveDisplayRenderer: React.FC = () => {
  console.log("🔴 LIVE DISPLAY RENDERER: Component is loading/mounting!");
  console.log("🔴 LIVE DISPLAY RENDERER: Current URL:", window.location.href);
  console.log(
    "🔴 LIVE DISPLAY RENDERER: Query params:",
    window.location.search
  );

  // Add DOM verification
  console.log("🔴 LIVE DISPLAY RENDERER: DOM body element:", document.body);
  console.log(
    "🔴 LIVE DISPLAY RENDERER: Document ready state:",
    document.readyState
  );

  // Enhanced electronAPI debugging
  console.log(
    "🔴 LIVE DISPLAY RENDERER: window object keys:",
    Object.keys(window)
  );
  console.log(
    "🔴 LIVE DISPLAY RENDERER: window.electronAPI:",
    window.electronAPI
  );
  console.log(
    "🔴 LIVE DISPLAY RENDERER: typeof window.electronAPI:",
    typeof window.electronAPI
  );

  if (window.electronAPI) {
    console.log(
      "🔴 LIVE DISPLAY RENDERER: electronAPI methods:",
      Object.keys(window.electronAPI)
    );
    console.log(
      "🔴 LIVE DISPLAY RENDERER: onLiveContentUpdate function:",
      window.electronAPI.onLiveContentUpdate
    );
    console.log(
      "🔴 LIVE DISPLAY RENDERER: invoke function:",
      window.electronAPI.invoke
    );
  } else {
    console.error("🔴 LIVE DISPLAY RENDERER: ❌ electronAPI is NOT AVAILABLE!");
    console.log(
      "🔴 LIVE DISPLAY RENDERER: This suggests preload script didn't load properly"
    );
  }

  // Test if we can access other window properties that might indicate preload issues
  console.log(
    "🔴 LIVE DISPLAY RENDERER: window.__dirname:",
    (window as any).__dirname
  );
  console.log(
    "🔴 LIVE DISPLAY RENDERER: window.require:",
    (window as any).require
  );
  console.log(
    "🔴 LIVE DISPLAY RENDERER: window.process:",
    (window as any).process
  );

  // Get live content from Redux store
  const liveItem = useSelector(
    (state: RootState) => state.presentation.liveItem
  );
  const dispatch = useDispatch();

  console.log(
    "🔴 LIVE DISPLAY RENDERER: Component rendered with liveItem:",
    liveItem
  );

  // Convert Redux live item to LiveContent format
  const getContentFromRedux = (): LiveContent | null => {
    console.log(
      "🔴 LIVE DISPLAY RENDERER: getContentFromRedux called with liveItem:",
      liveItem
    );

    if (!liveItem) {
      console.log(
        "🔴 LIVE DISPLAY RENDERER: No liveItem, returning placeholder"
      );
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
      console.log(
        "🔴 LIVE DISPLAY RENDERER: Converting scripture liveItem to LiveContent"
      );
      return {
        type: "scripture",
        title: liveItem.title,
        content: liveItem.content,
        reference: liveItem.reference,
        subtitle: liveItem.translation,
      };
    }

    console.log(
      "🔴 LIVE DISPLAY RENDERER: Converting other liveItem type:",
      liveItem.type
    );
    // Handle other content types
    return {
      type: liveItem.type as any,
      title: liveItem.title,
      content: liveItem.content,
    };
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
    console.log("🔴 LIVE DISPLAY RENDERER: Redux state changed");
    console.log("  - Previous content:", content);
    console.log("  - New content from Redux:", newContent);
    console.log("  - Redux liveItem:", liveItem);

    setContent(newContent);
    setShowBlack(false);
    setShowLogo(false);
    setIsVisible(true);
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

      // Also update Redux store to keep everything in sync
      if (
        newContent.type === "scripture" &&
        newContent.reference &&
        newContent.content
      ) {
        const presentationItem = {
          id: `live-${Date.now()}`,
          type: "scripture" as const,
          title: newContent.reference || newContent.title || "Scripture",
          content: newContent.content,
          reference: newContent.reference,
          translation: newContent.subtitle,
        };
        console.log(
          "🔴 LIVE DISPLAY RENDERER: Dispatching setLiveItem to Redux:",
          presentationItem
        );
        dispatch(setLiveItem(presentationItem));
      } else if (newContent.type === "placeholder") {
        const presentationItem = {
          id: `live-placeholder-${Date.now()}`,
          type: "placeholder" as const,
          title: newContent.title || "PraisePresent",
          content: newContent.content,
        };
        console.log(
          "🔴 LIVE DISPLAY RENDERER: Dispatching placeholder setLiveItem to Redux:",
          presentationItem
        );
        dispatch(setLiveItem(presentationItem));
      }
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

      // Add a manual test to see if we can trigger the handler
      console.log("🔴 LIVE DISPLAY RENDERER: Testing manual handler call...");
      setTimeout(() => {
        console.log(
          "🔴 LIVE DISPLAY RENDERER: Calling handleContentUpdate manually for testing..."
        );
        handleContentUpdate({
          type: "scripture",
          title: "Test Scripture",
          content: "This is a test scripture content",
          reference: "Test 1:1",
        });
      }, 2000);

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
      fontSize: `${
        theme.fontSize * (isSubtitle ? 0.7 : isReference ? 0.8 : 1)
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
      maxWidth: "90%",
      width: "100%",
      textAlign: theme.alignment,
    };

    if (theme.borderWidth && theme.borderWidth > 0) {
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
      className={`live-display-animation ${theme.animation} ${
        isVisible ? "visible" : ""
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
        <div>🔴 LIVE DISPLAY RENDERER DEBUG</div>
        <div>IPC Connected: {ipcConnected ? "✅" : "❌"}</div>
        <div>Content Type: {content?.type || "none"}</div>
        <div>Content Title: {content?.title || "none"}</div>
        <div>Show Black: {showBlack ? "✅" : "❌"}</div>
        <div>Show Logo: {showLogo ? "✅" : "❌"}</div>
        <div>Is Visible: {isVisible ? "✅" : "❌"}</div>
        <div>Redux Item: {liveItem?.type || "none"}</div>
        <div>URL: {window.location.href}</div>
      </div>

      {content && isVisible ? (
        <div style={getContentContainerStyle()}>
          {content.type === "scripture" && (
            <div className="scripture-content">
              <div
                style={{
                  ...getTextStyle(),
                  fontSize: "2rem",
                  marginBottom: "1rem",
                  opacity: 0.8,
                }}
              >
                📖 SCRIPTURE CONTENT
              </div>
              {content.reference && (
                <div style={getTextStyle(false, true)}>{content.reference}</div>
              )}
              <div style={getTextStyle()}>
                {content.content || content.verse}
              </div>
              {content.subtitle && (
                <div style={getTextStyle(true)}>{content.subtitle}</div>
              )}
            </div>
          )}

          {content.type === "song" && (
            <div className="song-content">
              {content.title && (
                <div style={getTextStyle(false, true)}>{content.title}</div>
              )}
              <div style={getTextStyle()}>
                {content.lines ? (
                  content.lines.map((line, index) => (
                    <div key={index} style={{ marginBottom: "1rem" }}>
                      {line}
                    </div>
                  ))
                ) : (
                  <div>{content.content}</div>
                )}
              </div>
            </div>
          )}

          {content.type === "announcement" && (
            <div className="announcement-content">
              {content.title && (
                <div style={getTextStyle(false, true)}>{content.title}</div>
              )}
              <div style={getTextStyle()}>{content.content}</div>
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
