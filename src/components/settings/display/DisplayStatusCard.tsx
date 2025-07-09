import React, { memo, useEffect } from "react";
import { FiMonitor } from "react-icons/fi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveDisplay } from "@/hooks/useLiveDisplay";

interface DisplayStatusCardProps {
  displayCount: number;
  hasMultipleDisplays: boolean;
  currentSelectedDisplay: any;
}

const DisplayStatusCard: React.FC<DisplayStatusCardProps> = memo(({
  displayCount,
  hasMultipleDisplays,
  currentSelectedDisplay,
}) => {
  const { liveDisplayStatus, refreshStatus, selectedDisplay } = useLiveDisplay();

  // Check status when component mounts and when selected display changes
  useEffect(() => {
    if (selectedDisplay?.id) {
      refreshStatus();
    }
  }, [selectedDisplay?.id, refreshStatus]);

  const displayName = currentSelectedDisplay?.friendlyName || currentSelectedDisplay?.label;
  const isActive = liveDisplayStatus?.isVisible;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiMonitor className="w-5 h-5" />
          Display Status
        </CardTitle>
        <CardDescription>
          Current display configuration detected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Displays:</span>
            <span className="ml-2">{displayCount}</span>
          </div>
          <div>
            <span className="font-medium">Multiple Displays:</span>
            <span className="ml-2">
              {hasMultipleDisplays ? (
                <Badge variant="default">Available</Badge>
              ) : (
                <Badge variant="secondary">Not Available</Badge>
              )}
            </span>
          </div>
          <div>
            <span className="font-medium">Live Display:</span>
            <span className="ml-2">
              {currentSelectedDisplay ? (
                <Badge variant="default">
                  {currentSelectedDisplay.friendlyName ||
                    currentSelectedDisplay.label}
                </Badge>
              ) : (
                <Badge variant="outline">Not Selected</Badge>
              )}
            </span>
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <span className="ml-2">
              {isActive ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

DisplayStatusCard.displayName = "DisplayStatusCard";

export default DisplayStatusCard;