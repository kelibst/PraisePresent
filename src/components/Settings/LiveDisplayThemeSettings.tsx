import React, { useState, useEffect } from "react";

interface LiveDisplayTheme {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  textColor: string;
  subtitleColor: string;
  referenceColor: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  padding: number;
  textShadow: boolean;
  alignment: "left" | "center" | "right";
  animation: "none" | "fade" | "slide" | "zoom";
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

const defaultTheme: LiveDisplayTheme = {
  backgroundColor: "#000000",
  backgroundGradient: "linear-gradient(135deg, #1e1e1e 0%, #000000 100%)",
  textColor: "#ffffff",
  subtitleColor: "#cccccc",
  referenceColor: "#60a5fa",
  fontSize: 3.5,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: 1.4,
  padding: 4,
  textShadow: true,
  alignment: "center",
  animation: "fade",
  borderColor: "#333333",
  borderWidth: 0,
  borderRadius: 0,
};

const LiveDisplayThemeSettings: React.FC = () => {
  const [theme, setTheme] = useState<LiveDisplayTheme>(defaultTheme);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await window.electronAPI?.invoke(
        "live-display:getTheme"
      );
      if (savedTheme) {
        setTheme({ ...defaultTheme, ...savedTheme });
      }
    } catch (error) {
      console.log("No saved theme found, using defaults");
    }
  };

  const updateTheme = (updates: Partial<LiveDisplayTheme>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);

    // Send theme update to live display
    if (isPreviewMode) {
      window.electronAPI?.invoke("live-display:updateTheme", newTheme);
    }
  };

  const saveTheme = async () => {
    try {
      await window.electronAPI?.invoke("live-display:saveTheme", theme);
      // Also apply to current live display
      await window.electronAPI?.invoke("live-display:updateTheme", theme);
      alert("Theme saved successfully!");
    } catch (error) {
      console.error("Failed to save theme:", error);
      alert("Failed to save theme");
    }
  };

  const resetToDefaults = () => {
    setTheme(defaultTheme);
    if (isPreviewMode) {
      window.electronAPI?.invoke("live-display:updateTheme", defaultTheme);
    }
  };

  const togglePreview = async () => {
    if (!isPreviewMode) {
      // Start preview mode
      try {
        await window.electronAPI?.invoke("live-display:startPreview", theme);
        setIsPreviewMode(true);
      } catch (error) {
        console.error("Failed to start preview:", error);
      }
    } else {
      // End preview mode
      try {
        await window.electronAPI?.invoke("live-display:endPreview");
        setIsPreviewMode(false);
      } catch (error) {
        console.error("Failed to end preview:", error);
      }
    }
  };

  const fontOptions = [
    {
      value:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      label: "System Default",
    },
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "'Times New Roman', serif", label: "Times New Roman" },
    { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
    { value: "'Open Sans', sans-serif", label: "Open Sans" },
    { value: "'Roboto', sans-serif", label: "Roboto" },
    { value: "'Lato', sans-serif", label: "Lato" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Live Display Theme Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize the appearance of your live display presentation
        </p>
      </div>

      {/* Preview Controls */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Live Preview
          </h3>
          <button
            onClick={togglePreview}
            className={`px-4 py-2 rounded-md font-medium ${
              isPreviewMode
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isPreviewMode ? "Stop Preview" : "Start Preview"}
          </button>
        </div>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          {isPreviewMode
            ? "Live preview is active. Changes will be applied in real-time."
            : 'Click "Start Preview" to see changes on the live display in real-time.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colors Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Colors
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) =>
                  updateTheme({ backgroundColor: e.target.value })
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <input
                type="color"
                value={theme.textColor}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtitle Color
              </label>
              <input
                type="color"
                value={theme.subtitleColor}
                onChange={(e) => updateTheme({ subtitleColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Color (Scripture References)
              </label>
              <input
                type="color"
                value={theme.referenceColor}
                onChange={(e) =>
                  updateTheme({ referenceColor: e.target.value })
                }
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Typography
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Family
              </label>
              <select
                value={theme.fontFamily}
                onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {theme.fontSize}rem
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={theme.fontSize}
                onChange={(e) =>
                  updateTheme({ fontSize: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Line Height: {theme.lineHeight}
              </label>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={theme.lineHeight}
                onChange={(e) =>
                  updateTheme({ lineHeight: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Alignment
              </label>
              <select
                value={theme.alignment}
                onChange={(e) =>
                  updateTheme({
                    alignment: e.target.value as "left" | "center" | "right",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="textShadow"
                checked={theme.textShadow}
                onChange={(e) => updateTheme({ textShadow: e.target.checked })}
                className="mr-2"
              />
              <label
                htmlFor="textShadow"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Enable Text Shadow
              </label>
            </div>
          </div>
        </div>

        {/* Layout Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Layout
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Padding: {theme.padding}rem
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={theme.padding}
                onChange={(e) =>
                  updateTheme({ padding: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Animation Style
              </label>
              <select
                value={theme.animation}
                onChange={(e) =>
                  updateTheme({
                    animation: e.target.value as
                      | "none"
                      | "fade"
                      | "slide"
                      | "zoom",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="none">None</option>
                <option value="fade">Fade In</option>
                <option value="slide">Slide In</option>
                <option value="zoom">Zoom In</option>
              </select>
            </div>
          </div>
        </div>

        {/* Border Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Border & Effects
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Border Width: {theme.borderWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={theme.borderWidth || 0}
                onChange={(e) =>
                  updateTheme({ borderWidth: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            {(theme.borderWidth || 0) > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Border Color
                  </label>
                  <input
                    type="color"
                    value={theme.borderColor || "#333333"}
                    onChange={(e) =>
                      updateTheme({ borderColor: e.target.value })
                    }
                    className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Border Radius: {theme.borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={theme.borderRadius || 0}
                    onChange={(e) =>
                      updateTheme({ borderRadius: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preset Themes */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Preset Themes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() =>
              updateTheme({
                backgroundColor: "#000000",
                textColor: "#ffffff",
                subtitleColor: "#cccccc",
                referenceColor: "#60a5fa",
              })
            }
            className="p-4 border rounded-lg text-left hover:border-blue-500"
          >
            <div className="w-full h-4 bg-black rounded mb-2"></div>
            <span className="text-sm font-medium">Classic Black</span>
          </button>

          <button
            onClick={() =>
              updateTheme({
                backgroundColor: "#1e3a8a",
                textColor: "#ffffff",
                subtitleColor: "#bfdbfe",
                referenceColor: "#fbbf24",
              })
            }
            className="p-4 border rounded-lg text-left hover:border-blue-500"
          >
            <div className="w-full h-4 bg-blue-800 rounded mb-2"></div>
            <span className="text-sm font-medium">Royal Blue</span>
          </button>

          <button
            onClick={() =>
              updateTheme({
                backgroundColor: "#065f46",
                textColor: "#ffffff",
                subtitleColor: "#a7f3d0",
                referenceColor: "#fbbf24",
              })
            }
            className="p-4 border rounded-lg text-left hover:border-blue-500"
          >
            <div className="w-full h-4 bg-green-800 rounded mb-2"></div>
            <span className="text-sm font-medium">Forest Green</span>
          </button>

          <button
            onClick={() =>
              updateTheme({
                backgroundColor: "#7c2d12",
                textColor: "#ffffff",
                subtitleColor: "#fed7aa",
                referenceColor: "#fbbf24",
              })
            }
            className="p-4 border rounded-lg text-left hover:border-blue-500"
          >
            <div className="w-full h-4 bg-orange-800 rounded mb-2"></div>
            <span className="text-sm font-medium">Warm Brown</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={saveTheme}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          Save Theme
        </button>
        <button
          onClick={resetToDefaults}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default LiveDisplayThemeSettings;
