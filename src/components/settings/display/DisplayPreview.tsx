import React, { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiMonitor, FiRefreshCw, FiCamera } from "react-icons/fi";
import {
  captureDisplay,
  selectDisplayCapture,
  selectIsCapturing,
} from "@/lib/displaySlice";
import { AppDispatch } from "@/lib/store";
import { Button } from "@/components/ui/button";

interface DisplayPreviewProps {
  displayId: number;
}

const DisplayPreview: React.FC<DisplayPreviewProps> = ({ displayId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const screenshot = useSelector(selectDisplayCapture(displayId));
  const isCapturing = useSelector(selectIsCapturing(displayId));

  const handleCapture = useCallback(() => {
    dispatch(captureDisplay(displayId));
  }, [dispatch, displayId]);

  // Auto-refresh every 5 seconds if preview is visible
  useEffect(() => {
    if (screenshot) {
      const interval = setInterval(() => {
        dispatch(captureDisplay(displayId));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [dispatch, displayId, screenshot]);

  return (
    <div className="w-32 h-18 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border relative">
      {screenshot ? (
        <img
          src={screenshot}
          alt={`Display ${displayId} preview`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FiMonitor className="w-6 h-6 text-gray-400" />
        </div>
      )}

      {/* Overlay with capture button */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
        <Button
          onClick={handleCapture}
          disabled={isCapturing}
          size="sm"
          variant="secondary"
          className="text-xs"
        >
          {isCapturing ? (
            <FiRefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <FiCamera className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Auto-refresh indicator */}
      {screenshot && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default DisplayPreview;
