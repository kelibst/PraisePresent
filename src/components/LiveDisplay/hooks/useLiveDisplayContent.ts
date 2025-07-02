import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../lib/store";
import { UniversalSlide } from "../../../lib/universalSlideSlice";
import { LiveContent, LiveDisplayTheme, DEFAULT_LIVE_DISPLAY_THEME } from "../types";
import { convertContentToSlide, applyThemeToSlide, createFallbackSlide } from "../contentConverters";

export const useLiveDisplayContent = () => {
  const liveItem = useSelector((state: RootState) => state.presentation.liveItem);
  const [content, setContent] = useState<LiveContent | null>(null);
  const [theme, setTheme] = useState<LiveDisplayTheme>(DEFAULT_LIVE_DISPLAY_THEME);
  const [isVisible, setIsVisible] = useState(true);

  console.log("🔴 LIVE DISPLAY CONTENT: Redux liveItem:", liveItem);

  // Convert Redux live item to LiveContent format
  const getContentFromRedux = useCallback((): LiveContent | null => {
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
  }, [liveItem]);

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
      setIsVisible(true);
    } else {
      console.log("🔴 LIVE DISPLAY: Content unchanged, skipping update");
    }
  }, [liveItem, content, getContentFromRedux]);

  // Convert content to themed slide
  const themedSlide = useMemo((): UniversalSlide | null => {
    if (!content) return null;
    
    const slide = convertContentToSlide(content);
    if (!slide) return null;
    
    return applyThemeToSlide(slide, theme);
  }, [content, theme]);

  // Fallback slide for when no content is available
  const fallbackSlide = useMemo(() => createFallbackSlide(theme), [theme]);

  // Content update handlers for IPC
  const handleContentUpdate = useCallback((newContent: LiveContent) => {
    setContent(newContent);
    setIsVisible(true);
  }, []);

  const handleContentClear = useCallback(() => {
    setContent({
      type: "placeholder",
      title: "PraisePresent",
      content: {
        mainText: "Live Display Ready",
        subText: "Cleared",
        timestamp: new Date().toLocaleTimeString(),
      },
    });
    setIsVisible(true);
  }, []);

  const handleThemeUpdate = useCallback((newTheme: Partial<LiveDisplayTheme>) => {
    setTheme(prevTheme => ({ ...prevTheme, ...newTheme }));
  }, []);

  const handleVisibilityChange = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);

  return {
    content,
    theme,
    themedSlide,
    fallbackSlide,
    isVisible,
    liveItem,
    handleContentUpdate,
    handleContentClear,
    handleThemeUpdate,
    handleVisibilityChange
  };
}; 