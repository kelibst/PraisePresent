import React from "react";
import { FiMonitor } from "react-icons/fi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Badge from "@/components/ui/Badge";
import { useLiveDisplay } from "@/hooks/useLiveDisplay";

interface DisplayStatusCardProps {
  displayCount: number;
  hasMultipleDisplays: boolean;
  currentSelectedDisplay: any;
}

const DisplayStatusCard: React.FC<DisplayStatusCardProps> = ({
  displayCount,
  hasMultipleDisplays,
  currentSelectedDisplay,
}) => {
  const { liveDisplayStatus } = useLiveDisplay();

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
              {liveDisplayStatus?.isVisible ? (
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
};

export default DisplayStatusCard;
