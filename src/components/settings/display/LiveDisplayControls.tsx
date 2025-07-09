import React from "react";
import { FiEye, FiMonitor, FiRefreshCw } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLiveDisplay } from "@/hooks/useLiveDisplay";

interface LiveDisplayControlsProps {
  selectedDisplay: any;
  selectedDisplayId: number | null;
}

const LiveDisplayControls: React.FC<LiveDisplayControlsProps> = ({
  selectedDisplay,
  selectedDisplayId,
}) => {
  const {
    liveDisplayStatus,
    isCreatingLive,
    error,
    createLive,
    showLive,
    hideLive,
    closeLive,
    displaySettings,
  } = useLiveDisplay();

  const handleCreateLive = async () => {
    const targetDisplayId = selectedDisplayId || selectedDisplay?.id;
    if (targetDisplayId) {
      const success = await createLive(targetDisplayId);
      if (success) {
        console.log(`Live display created successfully on display ${targetDisplayId}`);
        // Send initial content to the live display
        await sendInitialContent();
      }
    }
  };

  const sendInitialContent = async () => {
    try {
      // Send a welcome message to the live display
      await window.electron.liveDisplay.sendContent({
        type: 'placeholder',
        title: 'Live Display Ready',
        content: {
          mainText: 'PraisePresent Live Display',
          subText: 'Ready to display content',
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } catch (error) {
      console.error('Failed to send initial content:', error);
    }
  };

  const handleShowTestContent = async () => {
    try {
      await window.electron.liveDisplay.sendContent({
        type: 'text',
        data: {
          text: 'Test Content\nLive Display Working!',
        },
      });
    } catch (error) {
      console.error('Failed to send test content:', error);
    }
  };

  const handleShowBlack = async () => {
    try {
      await window.electron.liveDisplay.showBlack();
    } catch (error) {
      console.error('Failed to show black screen:', error);
    }
  };

  const handleShowLogo = async () => {
    try {
      await window.electron.liveDisplay.showLogo();
    } catch (error) {
      console.error('Failed to show logo screen:', error);
    }
  };

  const handleClearContent = async () => {
    try {
      await window.electron.liveDisplay.clearContent();
    } catch (error) {
      console.error('Failed to clear content:', error);
    }
  };

  if (!selectedDisplay) {
    return null;
  }

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiEye className="w-5 h-5" />
            Live Display Controls
          </CardTitle>
          <CardDescription>
            Control the live display window on{" "}
            {selectedDisplay.friendlyName || selectedDisplay.label}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {liveDisplayStatus?.hasWindow ? (
                liveDisplayStatus.isVisible ? (
                  <Badge variant="default">Live Active</Badge>
                ) : (
                  <Badge variant="secondary">Hidden</Badge>
                )
              ) : (
                <Badge variant="outline">Not Created</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!liveDisplayStatus?.hasWindow ? (
                <Button
                  onClick={handleCreateLive}
                  disabled={isCreatingLive}
                  variant="default"
                  size="sm"
                >
                  {isCreatingLive ? (
                    <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FiMonitor className="w-4 h-4 mr-2" />
                  )}
                  Create Live Display
                </Button>
              ) : (
                <>
                  {liveDisplayStatus.isVisible ? (
                    <Button onClick={hideLive} variant="outline" size="sm">
                      Hide Display
                    </Button>
                  ) : (
                    <Button onClick={showLive} variant="default" size="sm">
                      Show Display
                    </Button>
                  )}
                  <Button onClick={closeLive} variant="destructive" size="sm">
                    Close Display
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content Control Section */}
          {liveDisplayStatus?.hasWindow && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Content Controls</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleShowTestContent} 
                  variant="outline" 
                  size="sm"
                >
                  Test Content
                </Button>
                <Button 
                  onClick={handleShowBlack} 
                  variant="outline" 
                  size="sm"
                >
                  Black Screen
                </Button>
                <Button 
                  onClick={handleShowLogo} 
                  variant="outline" 
                  size="sm"
                >
                  Logo Screen
                </Button>
                <Button 
                  onClick={handleClearContent} 
                  variant="outline" 
                  size="sm"
                >
                  Clear Content
                </Button>
              </div>
            </div>
          )}

          {/* Display Information */}
          {liveDisplayStatus?.bounds && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Display Information</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Position: ({liveDisplayStatus.bounds.x}, {liveDisplayStatus.bounds.y})
                </p>
                <p>
                  Size: {liveDisplayStatus.bounds.width} × {liveDisplayStatus.bounds.height}
                </p>
                <p>
                  Display ID: {liveDisplayStatus.currentDisplayId}
                </p>
                {liveDisplayStatus.isFullscreen && (
                  <p className="text-green-600">Fullscreen mode active</p>
                )}
                {displaySettings.isLiveDisplayActive && (
                  <p className="text-blue-600">Live display is active</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default LiveDisplayControls;