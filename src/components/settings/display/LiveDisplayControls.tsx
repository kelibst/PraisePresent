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
import { Alert, AlertDescription } from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
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
  } = useLiveDisplay();

  const handleCreateLive = async () => {
    const targetDisplayId = selectedDisplayId || selectedDisplay?.id;
    if (targetDisplayId) {
      await createLive(targetDisplayId);
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
        <CardContent>
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

          {liveDisplayStatus?.bounds && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Live window position: ({liveDisplayStatus.bounds.x},{" "}
                {liveDisplayStatus.bounds.y})
              </p>
              <p>
                Live window size: {liveDisplayStatus.bounds.width} ×{" "}
                {liveDisplayStatus.bounds.height}
              </p>
              {liveDisplayStatus.isFullscreen && <p>Fullscreen mode: Active</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default LiveDisplayControls;
