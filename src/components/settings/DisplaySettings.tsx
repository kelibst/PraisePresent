import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiMonitor, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import {
  refreshDisplays,
  testDisplay,
  captureDisplay,
  setSelectedLiveDisplay as setDisplaySliceSelectedLiveDisplay,
  clearDisplayError,
  selectDisplays,
  selectSecondaryDisplay,
  selectSelectedLiveDisplay,
  selectDisplaySettings,
  selectHasMultipleDisplays,
  selectDisplayCount,
  selectDisplayLoading,
  selectDisplayError,
} from "@/lib/displaySlice";
import {
  setSelectedLiveDisplay as setSettingsSelectedLiveDisplay,
  selectSelectedLiveDisplayId,
} from "@/lib/settingsSlice";
import { RootState, AppDispatch } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "../ui/Alert";

// Import our extracted components
import LiveDisplayControls from "./display/LiveDisplayControls";
import DisplayStatusCard from "./display/DisplayStatusCard";
import DisplayListItem from "./display/DisplayListItem";
import LiveDisplayStatusPanel from "./display/LiveDisplayStatusPanel";
import DisplayRecommendations from "./display/DisplayRecommendations";

const DisplaySettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const displays = useSelector(selectDisplays);
  const secondaryDisplay = useSelector(selectSecondaryDisplay);
  const selectedLiveDisplay = useSelector(selectSelectedLiveDisplay);
  const displaySettings = useSelector(selectDisplaySettings);
  const hasMultipleDisplays = useSelector(selectHasMultipleDisplays);
  const displayCount = useSelector(selectDisplayCount);
  const isLoading = useSelector(selectDisplayLoading);
  const error = useSelector(selectDisplayError);
  const selectedLiveDisplayId = useSelector(selectSelectedLiveDisplayId);

  // Initialize displays on component mount
  useEffect(() => {
    dispatch(refreshDisplays());
  }, [dispatch]);

  // Sync settings between slices when displays change
  useEffect(() => {
    if (selectedLiveDisplayId && displays.length > 0) {
      const display = displays.find((d) => d.id === selectedLiveDisplayId);
      if (display) {
        dispatch(setDisplaySliceSelectedLiveDisplay(selectedLiveDisplayId));
      }
    }
  }, [selectedLiveDisplayId, displays, dispatch]);

  // Event handlers
  const handleRefreshDisplays = () => {
    dispatch(refreshDisplays());
  };

  const handleSelectDisplay = (displayId: number | null) => {
    // Update both slices to keep them in sync
    dispatch(setDisplaySliceSelectedLiveDisplay(displayId));
    dispatch(setSettingsSelectedLiveDisplay(displayId));
    console.log("Selected display for live output:", displayId);
  };

  const handleTestDisplay = (displayId: number) => {
    dispatch(testDisplay(displayId));
  };

  const handleCaptureDisplay = (displayId: number) => {
    dispatch(captureDisplay(displayId));
  };

  const clearError = () => {
    dispatch(clearDisplayError());
  };

  // Use the settings slice display ID as the source of truth
  const currentSelectedDisplay =
    displays.find((d) => d.id === selectedLiveDisplayId) || selectedLiveDisplay;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Display Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure multiple monitors for live presentation output
          </p>
        </div>
        <Button
          onClick={handleRefreshDisplays}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <FiRefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <FiAlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button onClick={clearError} variant="ghost" size="sm">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Live Display Controls */}
      <LiveDisplayControls
        selectedDisplay={currentSelectedDisplay}
        selectedDisplayId={selectedLiveDisplayId}
      />

      {/* Display Status */}
      <DisplayStatusCard
        displayCount={displayCount}
        hasMultipleDisplays={hasMultipleDisplays}
        currentSelectedDisplay={currentSelectedDisplay}
      />

      {/* Available Displays */}
      <Card>
        <CardHeader>
          <CardTitle>Available Displays</CardTitle>
          <CardDescription>
            Select which display to use for live presentation output
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <FiRefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Detecting displays...</span>
            </div>
          ) : displays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FiMonitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No displays detected</p>
              <Button
                onClick={handleRefreshDisplays}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Refresh Displays
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {displays.map((display) => (
                <DisplayListItem
                  key={display.id}
                  display={display}
                  isSelected={selectedLiveDisplayId === display.id}
                  isTestMode={displaySettings.testMode}
                  onSelect={handleSelectDisplay}
                  onTest={handleTestDisplay}
                  onCapture={handleCaptureDisplay}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {displays.length > 0 && (
        <DisplayRecommendations
          hasMultipleDisplays={hasMultipleDisplays}
          selectedLiveDisplayId={selectedLiveDisplayId}
          secondaryDisplay={secondaryDisplay}
          onSelectDisplay={handleSelectDisplay}
        />
      )}

      {/* Live Display Status Panel */}
      <LiveDisplayStatusPanel currentSelectedDisplay={currentSelectedDisplay} />
    </div>
  );
};

export default DisplaySettings;
