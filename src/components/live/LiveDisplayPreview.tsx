import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { selectSettings } from "@/lib/settingsSlice";
import { useLiveDisplay } from "@/hooks/useLiveDisplay";
import { motion } from "framer-motion";

/* @ts-ignore */
import logoDark from "../../assets/logo-dark.png";
/* @ts-ignore */
import logoLight from "../../assets/logo-white.png";

interface LiveDisplayPreviewProps {
  className?: string;
  showHeader?: boolean;
}

const LiveDisplayPreview: React.FC<LiveDisplayPreviewProps> = ({
  className = "",
  showHeader = true,
}) => {
  const settings = useSelector(selectSettings);
  const { liveItem } = useSelector((state: RootState) => state.presentation);
  const { liveDisplayStatus } = useLiveDisplay();

  // Determine theme based on settings
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Format current time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const currentTime = new Date();

  // Render live content if available
  const renderLiveContent = () => {
    if (liveItem) {
      return (
        <div className="flex items-center justify-center h-full bg-black text-white p-4">
          <div className="text-center max-w-full">
            <div className="text-2xl font-bold mb-4 truncate">
              {liveItem.title}
            </div>
            {liveItem.content && (
              <div className="text-lg leading-relaxed whitespace-pre-line overflow-hidden">
                {liveItem.content.length > 200
                  ? liveItem.content.substring(0, 200) + "..."
                  : liveItem.content}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default intro screen (scaled down)
    return (
      <div
        className={`h-full ${
          isDark
            ? "bg-gradient-to-b from-blue-900 to-purple-900"
            : "bg-gradient-to-b from-blue-500 to-purple-500"
        } text-white relative overflow-hidden flex flex-col justify-center items-center`}
      >
        {/* Decorative circles (scaled down) */}
        <div
          className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full border-2 border-blue-400 opacity-30"
          style={{ transform: "translate(-30%,-30%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border-2 border-blue-400 opacity-30"
          style={{ transform: "translate(30%,30%)" }}
        />

        {/* Logo (smaller) */}
        <div className="relative mb-3">
          <img
            src={isDark ? logoLight : logoDark}
            alt="PraisePresent Logo"
            className="w-16 h-16 object-contain rounded-full"
          />
        </div>

        {/* Welcome text (smaller) */}
        <h1 className="text-2xl font-bold mb-2 text-center">
          Welcome to Worship
        </h1>

        <p className="text-sm mb-4 opacity-90 text-center max-w-xs">
          Preparing for an amazing time of praise and worship
        </p>

        {/* Time and Date (smaller) */}
        <div className="text-center space-y-1">
          <div className="text-lg font-bold">{formatTime(currentTime)}</div>
          <div className="text-xs opacity-80">{formatDate(currentTime)}</div>
        </div>

        {/* Live indicator (smaller) */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold">LIVE</span>
        </div>

        {/* Church name (smaller) */}
        <div className="absolute bottom-2 left-2">
          <p className="text-xs opacity-75">Your Church Name</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Live Display Preview
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                liveDisplayStatus?.isVisible ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {liveDisplayStatus?.isVisible ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      )}

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border aspect-video">
        {liveDisplayStatus?.hasWindow ? (
          renderLiveContent()
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">📺</div>
              <p className="text-sm">Live Display Not Active</p>
              <p className="text-xs opacity-70">
                Create live display to see preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDisplayPreview;
