import React from "react";
import { FiCheck, FiPlay, FiCamera } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DisplayPreview from "@/components/settings/display/DisplayPreview";

interface DisplayListItemProps {
  display: any;
  isSelected: boolean;
  isTestMode: boolean;
  onSelect: (displayId: number | null) => void;
  onTest: (displayId: number) => void;
  onCapture: (displayId: number) => void;
}

const getDisplayTypeIcon = (display: any) => {
  if (display.manufacturer) {
    const manufacturer = display.manufacturer.toLowerCase();
    if (manufacturer.includes("samsung")) return "📱";
    if (manufacturer.includes("lg")) return "🖥️";
    if (manufacturer.includes("dell")) return "💻";
    if (manufacturer.includes("hp")) return "🖨️";
    if (manufacturer.includes("acer")) return "⚡";
    if (manufacturer.includes("asus")) return "🎮";
  }
  return "🖥️";
};

const formatResolution = (width: number, height: number) => {
  return `${width} × ${height}`;
};

const DisplayListItem: React.FC<DisplayListItemProps> = ({
  display,
  isSelected,
  isTestMode,
  onSelect,
  onTest,
  onCapture,
}) => {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="text-2xl">{getDisplayTypeIcon(display)}</div>
            {display.isPrimary && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
            )}
          </div>

          {/* Display Preview */}
          <DisplayPreview displayId={display.id} />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-lg">
                {display.friendlyName || display.label}
              </h4>
              {display.isPrimary && (
                <Badge variant="default" className="text-xs">
                  Primary
                </Badge>
              )}
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  Live Output
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                {formatResolution(display.bounds.width, display.bounds.height)}{" "}
                • Scale: {Math.round(display.scaleFactor * 100)}%
              </div>
              {display.manufacturer && (
                <div>Manufacturer: {display.manufacturer}</div>
              )}
              {display.model && <div>Model: {display.model}</div>}
              <div>
                Position: ({display.bounds.x}, {display.bounds.y})
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onCapture(display.id)}
            variant="outline"
            size="sm"
            title="Capture Screenshot"
          >
            <FiCamera className="w-4 h-4 mr-1" />
            Capture
          </Button>

          <Button
            onClick={() => onTest(display.id)}
            disabled={isTestMode}
            variant="outline"
            size="sm"
          >
            <FiPlay className="w-4 h-4 mr-1" />
            Test
          </Button>

          {isSelected ? (
            <Button onClick={() => onSelect(null)} variant="outline" size="sm">
              <FiCheck className="w-4 h-4 mr-1" />
              Selected
            </Button>
          ) : (
            <Button
              onClick={() => onSelect(display.id)}
              variant="default"
              size="sm"
            >
              Select for Live
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisplayListItem;
