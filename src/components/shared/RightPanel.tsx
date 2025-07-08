import { FiSkipBack, FiSkipForward, FiSquare, FiEye, FiMonitor, FiSmartphone, FiChevronDown } from 'react-icons/fi'
import { FiPlay } from 'react-icons/fi'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useState } from 'react';

export default function RightPanel({ leftPanelWidth}: { leftPanelWidth: number }) {
  const [showControls, setShowControls] = useState(false);
  const [onPrevious, setOnPrevious] = useState(false);
  const [onNext, setOnNext] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [liveItem, setLiveItem] = useState(null);
  const [sendToLive, setSendToLive] = useState(false);
  const [blankToBlack, setBlankToBlack] = useState(false);
  const [renderContentPreview, setRenderContentPreview] = useState(null);
  const [testLiveDisplay, setTestLiveDisplay] = useState(false);

  const handleShowControls = () => {
    setShowControls(!showControls);
  }

  const handleOnPrevious = () => {
    setOnPrevious(!onPrevious);
  }

  const handleOnNext = () => {
    setOnNext(!onNext);
  }

  const handleSendToLive = () => {
    setSendToLive(!sendToLive);
  }

  const handleBlankToBlack = () => {
    setBlankToBlack(!blankToBlack); 
  }

  const handleTestLiveDisplay = () => {
    setTestLiveDisplay(!testLiveDisplay);
  }

  const handleRenderContentPreview = (item: any, isLive: boolean, showControls: boolean) => {
    setRenderContentPreview(item);
  }

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
                      onClick={handleOnPrevious}
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                      disabled={!onPrevious}
                    >
                      <FiSkipBack size={20} />
                    </button>
                    <button
                      onClick={handleSendToLive}
                      disabled={!previewItem}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:text-black disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                      <FiPlay size={16} />
                      Send to Live
                    </button>
                    <button
                      onClick={handleOnNext}
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                      disabled={!onNext}
                    >
                      <FiSkipForward size={20} />
                    </button>
                  </div>
                  <button
                    onClick={handleBlankToBlack}
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
                          {/* {handleRenderContentPreview(previewItem, false, showControls)} */}
        
                          {/* Action Buttons - only show if not in live presentation controls */}
                          {!showControls && (
                            <div className="space-y-2">
                              <button
                                onClick={handleSendToLive}
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
                          {/* {renderContentPreview(liveItem, true, showControls)} */}
        
                          {/* Live Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={handleBlankToBlack}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                            >
                              <FiSquare size={16} />
                              Blank
                            </button>
                            <button
                              onClick={handleTestLiveDisplay}
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
                                {/* {liveItem ? liveItem.title || "Untitled Content" : "Nothing live"} */}
                              Live Item
                              </div>
                            </div>
        
                            <div className="flex justify-center gap-4 mb-4">
                              <button
                                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-700 dark:text-gray-300"
                                onClick={handleOnPrevious}
                                disabled={!onPrevious}
                                title="Previous"
                              >
                                <FiSkipBack size={18} />
                              </button>
                              <button
                                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-gray-700 dark:text-gray-300"
                                onClick={handleOnNext}
                                disabled={!onNext}
                                title="Next"
                              >
                                <FiSkipForward size={18} />
                              </button>
                            </div>
        
                            <button
                              onClick={handleBlankToBlack}
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
	)
}