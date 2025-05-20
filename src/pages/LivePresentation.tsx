import { BellElectricIcon, BellIcon } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiSkipBack, FiSkipForward, FiMonitor, FiBook, FiMusic, FiList } from 'react-icons/fi';
import ScriptureDisplay from '../components/ScriptureDisplay';
import { Scripture } from '../database/models/bible';
import { mockServiceItems, mockScriptures, mockSongs } from '@/db/mockDb';
import { RenderScriptureTab } from '../components/RenderScriptureTab';


type SlideType = {
  title: string;
  content: string;
  reference: string;
} | null;

const LivePresentation = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('plan');
  const [currentLiveSlide, setCurrentLiveSlide] = useState<SlideType>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [selectedScripture, setSelectedScripture] = useState<Scripture | null>(null);
  const [previewScripture, setPreviewScripture] = useState<Scripture | null>(null);
  const [liveScripture, setLiveScripture] = useState<Scripture | null>(null);
  const [selectedBible, setSelectedBible] = useState<string>('kjv');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Handle mouse down to start resizing
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // Handle dragging
  const handleDrag = (e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate percentage (constrain between 20% and 80%)
    let newLeftWidth = (mouseX / containerWidth) * 100;
    newLeftWidth = Math.max(20, Math.min(80, newLeftWidth));
    
    setLeftPanelWidth(newLeftWidth);
  };

  // Handle drag end
  const handleDragEnd = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Clean up event listeners when unmounting
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  // Handle scripture selection
  const handleScriptureSelect = (scripture: Scripture) => {
    setSelectedScripture(scripture);
    setPreviewScripture(scripture);
  };

  // Handle Bible selection
  const handleBibleSelect = (bibleId: string) => {
    setSelectedBible(bibleId);
  };

  // Handle song preview
  const handleSongPreview = (song: any) => {
    // Mock implementation - in real app, this would get the song lyrics
    console.log(`Previewing song: ${song.title}`);
  };

  // Mock data based on the image
  const serviceTitle = "Live Sunday 9am Service";
  const date = "May 18, 2024";

  const currentSlide = {
    title: "For God so loved the world...",
    content: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    reference: "John 3:16"
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < mockServiceItems.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const toggleLive = () => {
    setIsLive(prev => !prev);
  };

  const blankToBlack = () => {
    // Logic to blank the screen to black
    console.log("Blank to black");
  };

  const sendToLive = () => {
    setCurrentLiveSlide(currentSlide);
    if (previewScripture) {
      setLiveScripture(previewScripture);
    }
  };



  return (
    <div className="flex flex-col h-screen bg-background dark:bg-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded">
            {serviceTitle}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLive}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              isLive 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <FiPlay className="text-white" />
            {isLive ? "End Live" : "Go Live"}
          </button>
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
           <BellIcon className='' size={30} />
          </button>
        </div>
      </header>

      {/* Main Content with Resizable Panels */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* Left Panel - Service Plan */}
        <div 
          className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FiMonitor className="text-gray-600 dark:text-gray-300" />
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">Worship Service</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
            </div>
            <div className="flex gap-2">
              <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                + New Item
              </button>
              <button className="text-sm bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800">
                Clear Plan
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={`flex items-center px-4 py-2 font-medium text-sm ${
                activeTab === 'plan'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('plan')}
            >
              <FiList className="mr-2" />
              Plan
            </button>
            <button
              className={`flex items-center px-4 py-2 font-medium text-sm ${
                activeTab === 'scripture'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('scripture')}
            >
              <FiBook className="mr-2" />
              Scripture
            </button>
            <button
              className={`flex items-center px-4 py-2 font-medium text-sm ${
                activeTab === 'songs'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('songs')}
            >
              <FiMusic className="mr-2" />
              Songs
            </button>
          </div>

          {/* Tab Content */}
          {RenderScriptureTab(activeTab, currentSlideIndex, handleScriptureSelect, handleBibleSelect, selectedBible, handleSongPreview)}
        </div>

        {/* Resizable Divider */}
        <div 
          className="absolute h-full w-1 bg-transparent hover:bg-blue-500 cursor-col-resize flex items-center justify-center z-10"
          style={{ left: `${leftPanelWidth}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleDragStart}
        >
          <div className="h-16 w-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Right Panel - Preview & Live */}
        <div 
          className="flex flex-col"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Preview Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
            <h2 className="text-center text-lg font-medium text-gray-800 dark:text-white mb-2">Preview</h2>
            
            {/* Slide Preview */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-6 mb-4 relative">              
              <div className="text-center flex flex-col items-center justify-center min-h-[140px]">
                {previewScripture ? (
                  <ScriptureDisplay scripture={previewScripture} />
                ) : (
                  <>
                    <h3 className="text-xl font-bold mb-3">FOR GOD SO LOVED THE WORLD</h3>
                    <p className="text-lg mb-3">
                      For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.
                    </p>
                    <span className="text-sm font-medium text-blue-200">John 3:16</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <button 
                onClick={goToPreviousSlide}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <FiSkipBack />
                Previous
              </button>
              
              <button 
                onClick={sendToLive}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send to Live
              </button>
              
              <button 
                onClick={goToNextSlide}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Next
                <FiSkipForward />
              </button>
            </div>
          </div>

          {/* Live Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-center text-lg font-medium text-gray-800 dark:text-white">Currently Live</h2>
              <div className="flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{isLive ? 'LIVE' : 'Not Live'}</span>
              </div>
            </div>
            
            {/* Live Slide */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-800 text-white rounded-lg p-6 mb-4 relative">
              <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
                LIVE
              </div>
              
              <div className="text-center flex flex-col items-center justify-center min-h-[140px]">
                {liveScripture ? (
                  <ScriptureDisplay scripture={liveScripture} />
                ) : (
                  <>
                    <h3 className="text-xl font-bold mb-3">FOR GOD SO LOVED THE WORLD</h3>
                    <p className="text-lg mb-3">
                      For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.
                    </p>
                    <span className="text-sm font-medium text-blue-200">John 3:16</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Live Controls */}
            <div className="flex justify-center">
              <button 
                onClick={blankToBlack}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                Blank to Black
              </button>
            </div>
          </div>
          
          {/* Mobile Remote Control */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="ml-2 text-gray-700 dark:text-gray-300">Mobile Remote Control</span>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800">
              <div className="text-center mb-2 text-gray-700 dark:text-gray-300">Current Slide:</div>
              <div className="text-center mb-4 text-sm text-gray-700 dark:text-gray-300 truncate">
                {liveScripture ? liveScripture.reference : "For God so loved the world..."}
              </div>
              
              <div className="flex justify-between">
                <button className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
                  <FiSkipBack />
                </button>
                <button className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-700 dark:text-gray-300">
                  <FiSkipForward />
                </button>
              </div>
              
              <div className="mt-3 text-center">
                <button className="w-full py-2 bg-gray-200 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                  Blank to Black
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePresentation; 