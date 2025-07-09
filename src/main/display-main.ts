import { ipcMain, screen, desktopCapturer, BrowserWindow } from "electron";
import { displayManager } from "@/services/DisplayManager";
import { liveDisplayWindow } from "@/main/liveDisplayWindow";
import { 
  LiveDisplayConfig, 
  LiveDisplayResult,
  LiveDisplayError,
  validateDisplayId,
  handleLiveDisplayError,
  createSuccessResult,
  sendContentWithDelay,
  createInitialContent
} from "@/shared/liveDisplayUtils";

// Store app settings (in a real app, this would be in a persistent store)
let displaySettings = {
  selectedLiveDisplayId: null as number | null,
  isLiveDisplayActive: false,
  liveDisplayFullscreen: true,
  liveDisplayAlwaysOnTop: true,
  testMode: false,
};

export function initializeDisplayMain(): void {
  // Display information handlers
  ipcMain.handle("display:getDisplays", async () => {
    try {
      return {
        displays: displayManager.getDisplays(),
        primaryDisplay: displayManager.getPrimaryDisplay(),
        secondaryDisplay: displayManager.getSecondaryDisplay(),
      };
    } catch (error) {
      console.error("Error getting displays:", error);
      throw error;
    }
  });

  ipcMain.handle("display:captureDisplay", async (_, displayId: number) => {
    try {
      const display = screen.getAllDisplays().find(d => d.id === displayId);
      if (!display) throw new Error(`Display ${displayId} not found`);

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width: Math.floor(display.bounds.width / 4),
          height: Math.floor(display.bounds.height / 4),
        },
      });

      const source = sources.find(s => s.display_id === displayId.toString()) 
        || sources.find(s => parseInt(s.display_id) === displayId)
        || (displayId === screen.getPrimaryDisplay().id ? sources[0] : sources[1])
        || sources[0];

      if (!source?.thumbnail) {
        throw new Error("Failed to capture display");
      }

      return source.thumbnail.toDataURL();
    } catch (error) {
      console.error("Error capturing display:", error);
      throw error;
    }
  });

  ipcMain.handle("display:testDisplay", async (_, displayId: number) => {
    try {
      const display = screen.getAllDisplays().find(d => d.id === displayId);
      if (!display) throw new Error(`Display ${displayId} not found`);

      const testWindow = new BrowserWindow({
        ...display.bounds,
        fullscreen: true,
        frame: false,
        alwaysOnTop: true,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

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
            </style>
          </head>
          <body>
            <div class="test-content">
              <div>Display Test</div>
              <div>Display ${displayId}</div>
              <div>${display.bounds.width} × ${display.bounds.height}</div>
            </div>
          </body>
        </html>
      `;

      await testWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(testHTML)}`);
      testWindow.show();
      setTimeout(() => !testWindow.isDestroyed() && testWindow.close(), 3000);

      return { success: true };
    } catch (error) {
      console.error("Error testing display:", error);
      throw error;
    }
  });

  // Live display handlers
  ipcMain.handle("live-display:create", async (_, { displayId }: { displayId?: number }): Promise<LiveDisplayResult> => {
    try {
      const targetDisplayId = displayId 
        || displaySettings.selectedLiveDisplayId 
        || displayManager.getSecondaryDisplay()?.id 
        || displayManager.getPrimaryDisplay()?.id;

      if (!targetDisplayId) {
        throw new LiveDisplayError("No suitable display found", 'NO_DISPLAY_FOUND');
      }

      const validDisplayId = validateDisplayId(targetDisplayId);

      const success = await liveDisplayWindow.createLiveWindow({
        displayId: validDisplayId,
        fullscreen: displaySettings.liveDisplayFullscreen,
        alwaysOnTop: displaySettings.liveDisplayAlwaysOnTop,
      });

      if (success) {
        displaySettings.isLiveDisplayActive = true;
        displaySettings.selectedLiveDisplayId = validDisplayId;
        return createSuccessResult(validDisplayId);
      } else {
        throw new LiveDisplayError("Failed to create live display window", 'WINDOW_CREATION_FAILED');
      }
    } catch (error) {
      return handleLiveDisplayError(error, 'creation');
    }
  });

  // Simple live display operations
  ipcMain.handle("live-display:show", () => {
    liveDisplayWindow.showLiveWindow();
    return { success: true };
  });

  ipcMain.handle("live-display:hide", () => {
    liveDisplayWindow.hideLiveWindow();
    return { success: true };
  });

  ipcMain.handle("live-display:close", () => {
    liveDisplayWindow.closeLiveWindow();
    displaySettings.isLiveDisplayActive = false;
    return { success: true };
  });

  ipcMain.handle("live-display:getStatus", () => liveDisplayWindow.getStatus());

  // Content management
  ipcMain.handle("live-display:sendContent", (_, content) => {
    liveDisplayWindow.sendMessage("live-content-update", content);
    return { success: true };
  });

  ipcMain.handle("live-display:clearContent", () => {
    liveDisplayWindow.sendMessage("live-content-clear");
    return { success: true };
  });

  ipcMain.handle("live-display:showBlack", () => {
    liveDisplayWindow.sendMessage("live-show-black");
    return { success: true };
  });

  ipcMain.handle("live-display:showLogo", () => {
    liveDisplayWindow.sendMessage("live-show-logo");
    return { success: true };
  });

  // Settings management
  ipcMain.handle("display:saveSettings", (_, settings) => {
    displaySettings = { ...displaySettings, ...settings };
    return displaySettings;
  });

  // Get current display settings
  ipcMain.handle("display:getSettings", () => {
    return displaySettings;
  });

  // Sync Redux state with main process
  ipcMain.handle("display:syncState", (_, reduxState) => {
    try {
      // Update main process settings with Redux state
      if (reduxState.selectedLiveDisplayId !== undefined) {
        displaySettings.selectedLiveDisplayId = reduxState.selectedLiveDisplayId;
      }
      if (reduxState.isLiveDisplayActive !== undefined) {
        displaySettings.isLiveDisplayActive = reduxState.isLiveDisplayActive;
      }
      
      // Get current live display status
      const liveStatus = liveDisplayWindow.getStatus();
      
      // Return combined state for Redux to update
      return {
        ...displaySettings,
        liveDisplayStatus: liveStatus,
      };
    } catch (error) {
      console.error("Error syncing display state:", error);
      return displaySettings;
    }
  });

  // Initialize live display from Redux (when user creates one)
  ipcMain.handle("display:initializeLiveDisplay", async (_, displayId): Promise<LiveDisplayResult> => {
    try {
      const validDisplayId = validateDisplayId(displayId);

      const success = await liveDisplayWindow.createLiveWindow({
        displayId: validDisplayId,
        fullscreen: displaySettings.liveDisplayFullscreen,
        alwaysOnTop: displaySettings.liveDisplayAlwaysOnTop,
      });

      if (success) {
        displaySettings.isLiveDisplayActive = true;
        displaySettings.selectedLiveDisplayId = validDisplayId;
        
        // Send initial content with delay
        sendContentWithDelay((content) => {
          liveDisplayWindow.sendMessage('live-content-update', content);
        });
        
        liveDisplayWindow.showLiveWindow();
        
        return createSuccessResult(validDisplayId, displaySettings);
      } else {
        throw new LiveDisplayError("Failed to create live display window", 'WINDOW_CREATION_FAILED');
      }
    } catch (error) {
      return handleLiveDisplayError(error, 'initialization');
    }
  });
}

export function cleanupDisplayMain(): void {
  const handlers = [
    "display:getDisplays",
    "display:captureDisplay",
    "display:testDisplay",
    "display:saveSettings",
    "display:getSettings",
    "display:syncState",
    "display:initializeLiveDisplay",
    "live-display:create",
    "live-display:show",
    "live-display:hide",
    "live-display:close",
    "live-display:getStatus",
    "live-display:sendContent",
    "live-display:clearContent",
    "live-display:showBlack",
    "live-display:showLogo",
  ];

  handlers.forEach(handler => ipcMain.removeHandler(handler));
}