import React from "react";
import { FiEye } from "react-icons/fi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveDisplay } from "@/hooks/useLiveDisplay";

interface LiveDisplayStatusPanelProps {
  currentSelectedDisplay: any;
}

const LiveDisplayStatusPanel: React.FC<LiveDisplayStatusPanelProps> = ({
  currentSelectedDisplay,
}) => {
  const { liveDisplayStatus } = useLiveDisplay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiEye className="w-5 h-5" />
          Live Display Status
        </CardTitle>
        <CardDescription>
          Real-time status and controls for the live display window
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Window Created:</span>
              <span className="ml-2">
                {liveDisplayStatus?.hasWindow ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium">Window Visible:</span>
              <span className="ml-2">
                {liveDisplayStatus?.isVisible ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium">Target Display:</span>
              <span className="ml-2">
                {liveDisplayStatus?.currentDisplayId ? (
                  <Badge variant="default">
                    Display {liveDisplayStatus.currentDisplayId}
                  </Badge>
                ) : (
                  <Badge variant="outline">None</Badge>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium">Fullscreen:</span>
              <span className="ml-2">
                {liveDisplayStatus?.isFullscreen ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="outline">No</Badge>
                )}
              </span>
            </div>
          </div>

          {/* Window Position Info */}
          {liveDisplayStatus?.bounds && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
              <h5 className="font-medium text-sm mb-2">Live Window Position</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>X Position: {liveDisplayStatus.bounds.x}</div>
                <div>Y Position: {liveDisplayStatus.bounds.y}</div>
                <div>Width: {liveDisplayStatus.bounds.width}</div>
                <div>Height: {liveDisplayStatus.bounds.height}</div>
              </div>
            </div>
          )}

          {/* Selected Display Info */}
          {currentSelectedDisplay && (
            <div className="mt-4 p-3 bg-accent/50 rounded-lg">
              <h5 className="font-medium text-sm mb-2">
                Selected Display Info
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Display ID: {currentSelectedDisplay.id}</div>
                <div>
                  Name:{" "}
                  {currentSelectedDisplay.friendlyName ||
                    currentSelectedDisplay.label}
                </div>
                <div>Target X: {currentSelectedDisplay.bounds.x}</div>
                <div>Target Y: {currentSelectedDisplay.bounds.y}</div>
                <div>
                  Resolution: {currentSelectedDisplay.bounds.width} ×{" "}
                  {currentSelectedDisplay.bounds.height}
                </div>
                <div>
                  Primary: {currentSelectedDisplay.isPrimary ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveDisplayStatusPanel;
