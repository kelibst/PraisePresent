import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../lib/store";
import {
  sendPreviewToLive,
  clearLive,
  sendContentToLiveDisplay,
} from "../../lib/presentationSlice";
import {
  FiEye,
  FiMonitor,
  FiSkipBack,
  FiSkipForward,
  FiPlay,
  FiSquare,
  FiSmartphone,
  FiChevronDown,
  FiMusic,
  FiVideo,
  FiFileText,
  FiMic,
  FiImage,
} from "react-icons/fi";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";

interface PreviewLivePanelProps {
  leftPanelWidth: number;
  showControls?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

// Content type icon mapping
const getContentIcon = (type: string) => {
  switch (type) {
    case 'scripture':
      return <FiFileText size={20} className="text-blue-600 dark:text-blue-400" />;
    case 'song':
      return <FiMusic size={20} className="text-green-600 dark:text-green-400" />;
    case 'media':
    case 'video':
      return <FiVideo size={20} className="text-purple-600 dark:text-purple-400" />;
    case 'slide':
    case 'presentation':
      return <FiImage size={20} className="text-orange-600 dark:text-orange-400" />;
    case 'announcement':
      return <FiMic size={20} className="text-red-600 dark:text-red-400" />;
    case 'placeholder':
      return <FiEye size={20} className="text-gray-600 dark:text-gray-400" />;
    default:
      return <FiFileText size={20} className="text-gray-600 dark:text-gray-400" />;
  }
};

// Content type color mapping for backgrounds
const getContentColors = (type: string, isLive: boolean = false) => {
  const baseColors = {
    scripture: isLive ? 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200 dark:border-blue-700' : 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
    song: isLive ? 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-200 dark:border-green-700' : 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
    media: isLive ? 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-200 dark:border-purple-700' : 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20',
    slide: isLive ? 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-200 dark:border-orange-700' : 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20',
    announcement: isLive ? 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-200 dark:border-red-700' : 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20',
    placeholder: isLive ? 'from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border-green-200 dark:border-green-700' : 'from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30',
  };

  return baseColors[type as keyof typeof baseColors] || baseColors.scripture;
};

// Render content based on type
const renderContentPreview = (item: any, isLive: boolean = false, showControls: boolean = false) => {
  if (!item) return null;

  const contentColors = getContentColors(item.type, isLive);
  const contentIcon = getContentIcon(item.type);

  switch (item.type) {
    case 'scripture':
      return (
        <div className="space-y-4">
          <div className={`bg-gradient-to-br ${contentColors} rounded-lg p-6 ${isLive ? 'border-2' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              {contentIcon}
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {item.reference}
              </div>
            </div>
            <div className="text-lg text-gray-900 dark:text-white leading-relaxed mb-3">
              {item.content}
            </div>
            {item.translation && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {item.translation}
              </div>
            )}
            {isLive && (
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      );

    case 'song':
      return (
        <div className="space-y-4">
          <div className={`bg-gradient-to-br ${contentColors} rounded-lg p-6 ${isLive ? 'border-2' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              {contentIcon}
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                {item.title}
              </div>
            </div>

            {/* Song metadata */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400">
              {item.content?.artist && (
                <span>Artist: {item.content.artist}</span>
              )}
              {item.content?.key && (
                <span>Key: {item.content.key}</span>
              )}
              {item.content?.tempo && (
                <span>Tempo: {item.content.tempo}</span>
              )}
            </div>

            {/* Song content - could be full lyrics or specific slide */}
            <div className="text-lg text-gray-900 dark:text-white leading-relaxed">
              {item.content?.lyrics ? (
                <div className="whitespace-pre-line max-h-40 overflow-y-auto">
                  {typeof item.content.lyrics === 'string'
                    ? item.content.lyrics
                    : item.content.lyrics.join('\n')}
                </div>
              ) : item.content?.lines ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {item.content.lines.map((line: string, index: number) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  Song content not available
                </div>
              )}
            </div>

            {/* CCLI and copyright info */}
            {item.content?.ccliNumber && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                CCLI: {item.content.ccliNumber}
              </div>
            )}

            {isLive && (
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      );

    case 'media':
    case 'video':
      return (
        <div className="space-y-4">
          <div className={`bg-gradient-to-br ${contentColors} rounded-lg p-6 ${isLive ? 'border-2' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              {contentIcon}
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {item.title || 'Media Content'}
              </div>
            </div>

            {/* Media preview/info */}
            <div className="text-lg text-gray-900 dark:text-white leading-relaxed mb-3">
              {item.content?.description || item.content || 'Media content ready for display'}
            </div>

            {/* Media metadata */}
            {(item.content?.duration || item.content?.format || item.content?.resolution) && (
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                {item.content.duration && <span>Duration: {item.content.duration}</span>}
                {item.content.format && <span>Format: {item.content.format}</span>}
                {item.content.resolution && <span>Resolution: {item.content.resolution}</span>}
              </div>
            )}

            {isLive && (
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      );

    case 'slide':
    case 'presentation':
      return (
        <div className="space-y-4">
          <div className={`bg-gradient-to-br ${contentColors} rounded-lg p-6 ${isLive ? 'border-2' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              {contentIcon}
              <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {item.title || 'Presentation Slide'}
              </div>
            </div>

            <div className="text-lg text-gray-900 dark:text-white leading-relaxed mb-3">
              {typeof item.content === 'string'
                ? item.content
                : item.content?.text || item.content?.content || 'Slide content'}
            </div>

            {/* Slide metadata */}
            {item.content?.slideNumber && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Slide {item.content.slideNumber}
              </div>
            )}

            {isLive && (
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      );

    case 'announcement':
      return (
        <div className="space-y-4">
          <div className={`bg-gradient-to-br ${contentColors} rounded-lg p-6 ${isLive ? 'border-2' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              {contentIcon}
              <div className="text-sm font-medium text-red-600 dark:text-red-400">
                {item.title || 'Announcement'}
              </div>
            </div>

            <div className="text-lg text-gray-900 dark:text-white leading-relaxed">
              {typeof item.content === 'string'
                ? item.content
                : item.content?.text || item.content?.message || 'Announcement content'}
            </div>

            {item.content?.urgency && (
              <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.content.urgency === 'high'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                {item.content.urgency.toUpperCase()} PRIORITY
              </div>
            )}

            {isLive && (
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      );

    case 'placeholder':
      return (
        <div className="space-y-4">
          <div className={`bg-gradient-to-br ${contentColors} rounded-lg p-8 text-center ${isLive ? 'border-2' : ''}`}>
            <div className="text-4xl mb-4">
              {item.content?.icon || '🎵'}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {item.content?.mainText || item.title}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              {item.content?.subText}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isLive ? 'Live since' : 'Ready since'} {item.content?.timestamp}
            </div>
            {isLive && (
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                LIVE
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              {contentIcon}
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.title || 'Content'}
              </div>
            </div>
            <div className="text-lg text-gray-900 dark:text-white leading-relaxed">
              {typeof item.content === 'string'
                ? item.content
                : JSON.stringify(item.content, null, 2)}
            </div>
          </div>
        </div>
      );
  }
};

const PreviewLivePanel: React.FC<PreviewLivePanelProps> = ({
  leftPanelWidth,
  showControls = false,
  onPrevious,
  onNext,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { previewItem, liveItem } = useSelector(
    (state: RootState) => state.presentation
  );

  const sendToLive = async () => {
    if (previewItem) {
      try {
        // Use the proper thunk that actually sends content to live display
        await dispatch(sendContentToLiveDisplay(previewItem)).unwrap();
        console.log("Content sent to live display successfully");
      } catch (error) {
        console.error("Failed to send content to live display:", error);
      }
    }
  };

  const blankToBlack = async () => {
    dispatch(clearLive());
    // Send black screen command to live display
    try {
      await window.electronAPI?.invoke("live-display:showBlack");
    } catch (error) {
      console.error("Failed to show black screen:", error);
    }
  };

  const testLiveDisplay = async () => {
    console.log("PreviewLivePanel: Testing live display with direct IPC...");
    try {
      const testContent = {
        type: "scripture",
        reference: "Test Reference",
        content: "This is a test message sent directly via IPC",
        title: "IPC Test",
      };
      await window.electronAPI?.invoke("live-display:sendContent", testContent);
      console.log("PreviewLivePanel: Test content sent successfully");
    } catch (error) {
      console.error("PreviewLivePanel: Failed to send test content:", error);
    }
  };

  return (
    <div
      className="flex flex-col bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700"
      style={{ width: `${100 - leftPanelWidth}%` }}
    >
      {/* Controls Bar (only show in live presentation) */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              disabled={!onPrevious}
            >
              <FiSkipBack size={20} />
            </button>
            <button
              onClick={sendToLive}
              disabled={!previewItem}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:text-black disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <FiPlay size={16} />
              Send to Live
            </button>
            <button
              onClick={onNext}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              disabled={!onNext}
            >
              <FiSkipForward size={20} />
            </button>
          </div>
          <button
            onClick={blankToBlack}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center gap-2"
          >
            <FiSquare size={16} />
            Blank
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Preview Panel */}
        <div className="flex-1 p-6 border-r border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <FiEye size={20} />
                Preview
              </h3>
            </div>

            <div className="p-6 h-full">
              {previewItem ? (
                <div className="space-y-4">
                  {renderContentPreview(previewItem, false, showControls)}

                  {/* Action Buttons - only show if not in live presentation controls */}
                  {!showControls && (
                    <div className="space-y-2">
                      <button
                        onClick={sendToLive}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                      >
                        <FiMonitor size={16} />
                        Send to Live
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <FiEye className="mx-auto h-16 w-16" />
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    No content in preview
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Search and select content to preview
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Panel */}
        <div className="flex-1 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <FiMonitor size={20} />
                Currently Live
                {liveItem && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </h3>
            </div>

            <div className="p-6 h-full">
              {liveItem ? (
                <div className="space-y-4">
                  {renderContentPreview(liveItem, true, showControls)}

                  {/* Live Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={blankToBlack}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                    >
                      <FiSquare size={16} />
                      Blank
                    </button>
                    <button
                      onClick={testLiveDisplay}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
                    >
                      Test
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <FiMonitor className="mx-auto h-16 w-16" />
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Nothing currently live
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Send content to live from preview
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Remote Control Section */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="mobile-remote" className="border-0">
              <AccordionTrigger className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2">
                  <FiSmartphone size={18} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mobile Remote Control
                  </span>
                </div>
                <FiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200" />
              </AccordionTrigger>
              <AccordionContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Current Slide:
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {liveItem ? liveItem.title || "Untitled Content" : "Nothing live"}
                      </div>
                    </div>

                    <div className="flex justify-center gap-4 mb-4">
                      <button
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-700 dark:text-gray-300"
                        onClick={onPrevious}
                        disabled={!onPrevious}
                        title="Previous"
                      >
                        <FiSkipBack size={18} />
                      </button>
                      <button
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-700 dark:text-gray-300"
                        onClick={onNext}
                        disabled={!onNext}
                        title="Next"
                      >
                        <FiSkipForward size={18} />
                      </button>
                    </div>

                    <button
                      onClick={blankToBlack}
                      className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <FiSquare size={14} />
                      Blank to Black
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default PreviewLivePanel;
