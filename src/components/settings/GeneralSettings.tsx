import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiSun,
  FiMoon,
  FiMonitor,
  FiSave,
  FiRotateCcw,
  FiCheck,
} from "react-icons/fi";
import {
  selectSettings,
  selectSettingsLoading,
  selectSettingsError,
  selectLastSaved,
  setTheme,
  updateSetting,
  saveSettings,
  resetSettings,
} from "@/lib/settingsSlice";
import { RootState, AppDispatch } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import { useTheme } from "@/lib/theme";

const GeneralSettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector(selectSettings);
  const isLoading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const lastSaved = useSelector(selectLastSaved);

  // Theme context for applying theme changes
  const { setTheme: applyTheme } = useTheme();

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    dispatch(setTheme(newTheme));
    applyTheme(newTheme);
  };

  const handleSettingChange = (key: string, value: any) => {
    dispatch(updateSetting({ key: key as any, value }));
  };

  const handleSaveSettings = () => {
    dispatch(saveSettings({}));
  };

  const handleResetSettings = () => {
    if (
      confirm(
        "Are you sure you want to reset all settings to defaults? This action cannot be undone."
      )
    ) {
      dispatch(resetSettings());
      // Apply default theme
      applyTheme("system");
    }
  };

  const formatLastSaved = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">General Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure general application preferences and behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <Badge variant="outline" className="text-xs">
              <FiCheck className="w-3 h-3 mr-1" />
              Saved {formatLastSaved(lastSaved)}
            </Badge>
          )}
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <FiSave className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiSun className="w-5 h-5" />
            Theme & Appearance
          </CardTitle>
          <CardDescription>
            Choose your preferred theme and appearance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">
              Theme Selection
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <FiSun className="w-6 h-6" />
                <span className="text-sm font-medium">Light</span>
                {settings.theme === "light" && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </button>

              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <FiMoon className="w-6 h-6" />
                <span className="text-sm font-medium">Dark</span>
                {settings.theme === "dark" && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </button>

              <button
                onClick={() => handleThemeChange("system")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.theme === "system"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <FiMonitor className="w-6 h-6" />
                <span className="text-sm font-medium">System</span>
                {settings.theme === "system" && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              System theme automatically switches between light and dark based
              on your operating system settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Save Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Save Settings</CardTitle>
          <CardDescription>
            Configure automatic saving behavior for your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Auto-Save</label>
              <p className="text-xs text-muted-foreground">
                Automatically save your work at regular intervals
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSaveEnabled}
                onChange={(e) =>
                  handleSettingChange("autoSaveEnabled", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {settings.autoSaveEnabled && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Auto-Save Interval
              </label>
              <select
                value={settings.autoSaveInterval}
                onChange={(e) =>
                  handleSettingChange(
                    "autoSaveInterval",
                    parseInt(e.target.value)
                  )
                }
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value={1}>Every 1 minute</option>
                <option value={2}>Every 2 minutes</option>
                <option value={5}>Every 5 minutes</option>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Language & Localization</CardTitle>
          <CardDescription>
            Choose your preferred language and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Interface Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange("language", e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value="en">English</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="pt">Português (Portuguese)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Language changes will take effect after restarting the
              application.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Advanced configuration options for power users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Debug Mode</label>
              <p className="text-xs text-muted-foreground">
                Enable additional logging and debugging features
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.debugMode}
                onChange={(e) =>
                  handleSettingChange("debugMode", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Performance Mode</label>
              <p className="text-xs text-muted-foreground">
                Optimize for better performance on older hardware
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.performanceMode}
                onChange={(e) =>
                  handleSettingChange("performanceMode", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Reset Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Reset Settings</CardTitle>
          <CardDescription>
            Reset all settings to their default values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                This will reset all your settings to the default values and
                cannot be undone.
              </p>
            </div>
            <Button
              onClick={handleResetSettings}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              <FiRotateCcw className="w-4 h-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
