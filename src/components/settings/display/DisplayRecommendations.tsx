import React from "react";
import { FiAlertCircle, FiMonitor, FiCheck } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DisplayRecommendationsProps {
  hasMultipleDisplays: boolean;
  selectedLiveDisplayId: number | null;
  secondaryDisplay: any;
  onSelectDisplay: (displayId: number) => void;
}

const DisplayRecommendations: React.FC<DisplayRecommendationsProps> = ({
  hasMultipleDisplays,
  selectedLiveDisplayId,
  secondaryDisplay,
  onSelectDisplay,
}) => {
  // Don't show recommendations if no displays
  if (!hasMultipleDisplays && !selectedLiveDisplayId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {!hasMultipleDisplays && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <FiAlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Single Display Detected
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Connect a second monitor for optimal presentation experience.
                  Currently, live content will mirror on your main display.
                </p>
              </div>
            </div>
          )}

          {hasMultipleDisplays && !selectedLiveDisplayId && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FiMonitor className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Select Live Display
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Choose which display to use for live presentation output. We
                  recommend using your secondary display for the audience.
                </p>
              </div>
            </div>
          )}

          {hasMultipleDisplays &&
            secondaryDisplay &&
            !selectedLiveDisplayId && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FiCheck className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Quick Setup Available
                  </p>
                  <p className="text-green-700 dark:text-green-300">
                    Your secondary display "
                    {secondaryDisplay.friendlyName || secondaryDisplay.label}"
                    is ready to use for live presentations.
                  </p>
                  <Button
                    onClick={() => onSelectDisplay(secondaryDisplay.id)}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Use{" "}
                    {secondaryDisplay.friendlyName || secondaryDisplay.label}
                  </Button>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DisplayRecommendations;
