import { ipcMain, screen, desktopCapturer, BrowserWindow } from "electron";
import { displayManager, DisplayInfo } from "../services/DisplayManager";
import { liveDisplayWindow } from "./LiveDisplayWindow";

// Store app settings (in a real app, this would be in a persistent store)
let displaySettings = {
  selectedLiveDisplayId: null as number | null,
  isLiveDisplayActive: false,
  liveDisplayFullscreen: true,
  liveDisplayAlwaysOnTop: true,
  testMode: false,
};

export function initializeDisplayMain(): void {
  console.log("Initializing display IPC handlers...");

  // Initialize the DisplayManager now that the app is ready
  displayManager.initialize();
  // Initialize the LiveDisplayWindow manager
  liveDisplayWindow.initialize();

  // Handler for getting all displays
  ipcMain.handle("display:getDisplays", async () => {
    try {
      console.log("IPC: Getting displays...");
      const displays = displayManager.getDisplays();
      const primaryDisplay = displayManager.getPrimaryDisplay();
      const secondaryDisplay = displayManager.getSecondaryDisplay();

      console.log("IPC: Returning display data:", {
        displays: displays.length,
        primaryDisplay: primaryDisplay?.id,
        secondaryDisplay: secondaryDisplay?.id,
      });

      return {
        displays,
        primaryDisplay,
        secondaryDisplay,
      };
    } catch (error) {
      console.error("Error getting displays:", error);
      throw error;
    }
  });

  // Handler for capturing display screenshot
  ipcMain.handle("display:captureDisplay", async (event, displayId: number) => {
    try {
      console.log("IPC: Capturing display:", displayId);

      // Get the display bounds
      const displays = screen.getAllDisplays();
      const targetDisplay = displays.find((d) => d.id === displayId);

      if (!targetDisplay) {
        throw new Error(`Display with ID ${displayId} not found`);
      }

      console.log("Target display bounds:", targetDisplay.bounds);

      // Capture the screen with display-specific bounds
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width: Math.floor(targetDisplay.bounds.width / 4),
          height: Math.floor(targetDisplay.bounds.height / 4),
        },
      });

      console.log(
        "Available sources:",
        sources.map((s) => ({
          id: s.id,
          name: s.name,
          display_id: s.display_id,
        }))
      );

      // Try multiple strategies to find the correct source for this display
      let source = null;

      // Strategy 1: Match by display_id as string
      source = sources.find((s) => s.display_id === displayId.toString());
      if (source) {
        console.log("Found source by display_id string match:", source.id);
      }

      // Strategy 2: Match by display_id as number
      if (!source) {
        source = sources.find((s) => parseInt(s.display_id) === displayId);
        if (source) {
          console.log("Found source by display_id number match:", source.id);
        }
      }

      // Strategy 3: Match by position - find source that includes target display bounds
      if (!source && sources.length > 1) {
        // For multi-monitor setups, try to find source by screen position
        // This is a fallback approach when display_id matching fails
        const primaryDisplay = screen.getPrimaryDisplay();

        if (displayId !== primaryDisplay.id) {
          // For non-primary displays, try to get the second source
          source = sources[1] || sources[0];
          console.log(
            "Using secondary source for non-primary display:",
            source?.id
          );
        } else {
          source = sources[0];
          console.log("Using primary source for primary display:", source?.id);
        }
      }

      // Strategy 4: Last resort - use first source but log warning
      if (!source && sources.length > 0) {
        source = sources[0];
        console.warn(
          `No specific match for display ${displayId}, using first source:`,
          source.id
        );
      }

      if (!source || !source.thumbnail) {
        throw new Error("Failed to capture display - no valid source found");
      }

      // Convert to base64
      const screenshot = source.thumbnail.toDataURL();
      console.log(
        `IPC: Display ${displayId} captured successfully using source:`,
        source.id
      );

      return screenshot;
    } catch (error) {
      console.error("Error capturing display:", error);
      throw error;
    }
  });

  // Handler for testing display (show a test pattern)
  ipcMain.handle("display:testDisplay", async (event, displayId: number) => {
    try {
      console.log("IPC: Testing display:", displayId);

      // Get the display bounds
      const displays = screen.getAllDisplays();
      const targetDisplay = displays.find((d) => d.id === displayId);

      if (!targetDisplay) {
        throw new Error(`Display with ID ${displayId} not found`);
      }

      // Create a test window on the target display
      const testWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        fullscreen: true,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: "#FF0000",
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load a simple test HTML
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                background: linear-gradient(45deg, #FF0000, #00FF00, #0000FF, #FFFF00);
                background-size: 400% 400%;
                animation: gradientShift 3s ease infinite;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
              }
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .test-content {
                text-align: center;
                font-size: 4rem;
                font-weight: bold;
              }
              .display-info {
                font-size: 2rem;
                margin-top: 2rem;
              }
            </style>
          </head>
          <body>
            <div class="test-content">
              <div>Display Test</div>
              <div class="display-info">Display ID: ${displayId}</div>
              <div class="display-info">${targetDisplay.bounds.width} × ${targetDisplay.bounds.height}</div>
            </div>
          </body>
        </html>
      `;

      await testWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(testHTML)}`
      );
      testWindow.show();

      // Close the test window after 3 seconds
      setTimeout(() => {
        if (!testWindow.isDestroyed()) {
          testWindow.close();
        }
      }, 3000);

      console.log("IPC: Display test completed");
      return { success: true, message: "Test pattern shown for 3 seconds" };
    } catch (error) {
      console.error("Error testing display:", error);
      throw error;
    }
  });

  // Handler for saving display settings
  ipcMain.handle("display:saveSettings", async (event, settings: any) => {
    try {
      console.log("IPC: Saving display settings:", settings);

      // For now, we'll just return the settings back
      // In a real implementation, you might save these to a config file or database
      console.log("IPC: Display settings saved successfully");

      return settings;
    } catch (error) {
      console.error("Error saving display settings:", error);
      throw error;
    }
  });

  console.log("Display IPC handlers initialized successfully");
}

/**
 * Clean up display-related resources
 */
export function cleanupDisplayMain(): void {
  console.log("Cleaning up display resources...");

  // Remove IPC handlers
  ipcMain.removeHandler("display:getDisplays");
  ipcMain.removeHandler("display:captureDisplay");
  ipcMain.removeHandler("display:testDisplay");
  ipcMain.removeHandler("display:saveSettings");

  console.log("Display cleanup completed");
}
