import { ipcMain, BrowserWindow } from 'electron';
import { displayManager, DisplayInfo } from '../services/DisplayManager';
import { liveDisplayWindow, LiveWindowConfig } from './LiveDisplayWindow';

// Store app settings (in a real app, this would be in a persistent store)
let displaySettings = {
  selectedLiveDisplayId: null as number | null,
  isLiveDisplayActive: false,
  liveDisplayFullscreen: true,
  liveDisplayAlwaysOnTop: true,
  testMode: false,
};

export function initializeDisplayMain(): void {
  console.log('Initializing display IPC handlers...');

  // Initialize the DisplayManager now that the app is ready
  displayManager.initialize();

  // Initialize the LiveDisplayWindow manager
  liveDisplayWindow.initialize();

  // Get all displays
  ipcMain.handle('display:getDisplays', async () => {
    try {
      const displays = displayManager.getDisplays();
      const primaryDisplay = displayManager.getPrimaryDisplay();
      const secondaryDisplay = displayManager.getSecondaryDisplay();
      
      console.log('Display request:', { 
        count: displays.length, 
        hasMultiple: displayManager.hasMultipleDisplays() 
      });
      
      return {
        displays,
        primaryDisplay,
        secondaryDisplay,
        hasMultipleDisplays: displayManager.hasMultipleDisplays(),
        displayCount: displayManager.getDisplayCount(),
      };
    } catch (error) {
      console.error('Failed to get displays:', error);
      throw error;
    }
  });

  // Get display by ID
  ipcMain.handle('display:getDisplayById', async (event, displayId: number) => {
    try {
      return displayManager.getDisplayById(displayId);
    } catch (error) {
      console.error('Failed to get display by ID:', error);
      throw error;
    }
  });

  // Capture display screenshot
  ipcMain.handle('display:captureDisplay', async (event, displayId: number) => {
    try {
      console.log(`Capturing display ${displayId}...`);
      const screenshot = await displayManager.captureDisplay(displayId);
      return screenshot;
    } catch (error) {
      console.error('Failed to capture display:', error);
      throw error;
    }
  });

  // Test display (show a test window)
  ipcMain.handle('display:testDisplay', async (event, displayId: number) => {
    try {
      const display = displayManager.getDisplayById(displayId);
      if (!display) {
        throw new Error(`Display with ID ${displayId} not found`);
      }

      // Create a test window on the specified display
      const testWindow = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        fullscreen: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false, // Allow data URLs
        },
      });

      // Create simple HTML content
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Display Test</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
      overflow: hidden;
    }
    .main-content {
      animation: fadeInUp 0.8s ease-out;
      max-width: 80%;
    }
    .display-title {
      font-size: 4rem;
      font-weight: 300;
      margin-bottom: 1rem;
      text-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    .display-subtitle {
      font-size: 2.5rem;
      margin-bottom: 2rem;
      opacity: 0.9;
      font-weight: 400;
    }
    .display-info {
      font-size: 1.5rem;
      opacity: 0.9;
      background: rgba(255,255,255,0.1);
      padding: 2rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      line-height: 1.8;
    }
    .info-row {
      margin: 0.5rem 0;
    }
    .status-badge {
      display: inline-block;
      background: ${display.isPrimary ? '#10B981' : '#3B82F6'};
      padding: 0.75rem 2rem;
      border-radius: 25px;
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</head>
<body>
  <div class="main-content">
    <h1 class="display-title">🖥️ Display Test</h1>
    <p class="display-subtitle">${display.friendlyName || display.label}</p>
    <div class="display-info">
      <div class="info-row">Resolution: ${display.bounds.width} × ${display.bounds.height}</div>
      <div class="info-row">Scale Factor: ${Math.round(display.scaleFactor * 100)}%</div>
      <div class="info-row">Position: (${display.bounds.x}, ${display.bounds.y})</div>
      ${display.manufacturer ? `<div class="info-row">Manufacturer: ${display.manufacturer}</div>` : ''}
      ${display.model ? `<div class="info-row">Model: ${display.model}</div>` : ''}
      <div class="status-badge">
        ${display.isPrimary ? 'Primary Display' : 'Secondary Display'}
      </div>
    </div>
  </div>
</body>
</html>`;

      // Load the HTML content
      await testWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Close the test window after 4 seconds
      setTimeout(() => {
        if (!testWindow.isDestroyed()) {
          testWindow.close();
        }
      }, 4000);

      return { success: true, message: 'Test display shown for 4 seconds' };
    } catch (error) {
      console.error('Failed to test display:', error);
      throw error;
    }
  });

  // Save display settings
  ipcMain.handle('display:saveSettings', async (event, settings: Partial<typeof displaySettings>) => {
    try {
      displaySettings = { ...displaySettings, ...settings };
      console.log('Display settings saved:', displaySettings);
      
      // In a real app, persist these settings to disk
      // await saveSettingsToDisk(displaySettings);
      
      return displaySettings;
    } catch (error) {
      console.error('Failed to save display settings:', error);
      throw error;
    }
  });

  // Get current display settings
  ipcMain.handle('display:getSettings', async () => {
    try {
      return displaySettings;
    } catch (error) {
      console.error('Failed to get display settings:', error);
      throw error;
    }
  });

  // Get display configuration (for debugging)
  ipcMain.handle('display:getConfiguration', async () => {
    try {
      return displayManager.getDisplayConfiguration();
    } catch (error) {
      console.error('Failed to get display configuration:', error);
      throw error;
    }
  });

  // Set up display change listener
  displayManager.setChangeListener(() => {
    console.log('Display configuration changed, notifying renderers...');
    
    // Notify all windows about display changes
    BrowserWindow.getAllWindows().forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send('display:changed');
      }
    });
  });

  // Live Display Window Management
  
  // Create live display window
  ipcMain.handle('live-display:create', async (event, config: LiveWindowConfig) => {
    try {
      console.log('Creating live display window:', config);
      const result = await liveDisplayWindow.createLiveWindow(config);
      return { success: result };
    } catch (error) {
      console.error('Failed to create live display window:', error);
      throw error;
    }
  });

  // Show live display window
  ipcMain.handle('live-display:show', async () => {
    try {
      liveDisplayWindow.showLiveWindow();
      return { success: true };
    } catch (error) {
      console.error('Failed to show live display window:', error);
      throw error;
    }
  });

  // Hide live display window
  ipcMain.handle('live-display:hide', async () => {
    try {
      liveDisplayWindow.hideLiveWindow();
      return { success: true };
    } catch (error) {
      console.error('Failed to hide live display window:', error);
      throw error;
    }
  });

  // Close live display window
  ipcMain.handle('live-display:close', async () => {
    try {
      liveDisplayWindow.closeLiveWindow();
      return { success: true };
    } catch (error) {
      console.error('Failed to close live display window:', error);
      throw error;
    }
  });

  // Move live display window to different display
  ipcMain.handle('live-display:moveToDisplay', async (event, displayId: number) => {
    try {
      const result = await liveDisplayWindow.moveToDisplay(displayId);
      return { success: result };
    } catch (error) {
      console.error('Failed to move live display window:', error);
      throw error;
    }
  });

  // Send content to live display
  ipcMain.handle('live-display:sendContent', async (event, content: any) => {
    try {
      liveDisplayWindow.sendContentToLive(content);
      return { success: true };
    } catch (error) {
      console.error('Failed to send content to live display:', error);
      throw error;
    }
  });

  // Clear live display content
  ipcMain.handle('live-display:clearContent', async () => {
    try {
      liveDisplayWindow.clearLiveContent();
      return { success: true };
    } catch (error) {
      console.error('Failed to clear live display content:', error);
      throw error;
    }
  });

  // Show black screen
  ipcMain.handle('live-display:showBlack', async () => {
    try {
      liveDisplayWindow.showBlackScreen();
      return { success: true };
    } catch (error) {
      console.error('Failed to show black screen:', error);
      throw error;
    }
  });

  // Show logo screen
  ipcMain.handle('live-display:showLogo', async () => {
    try {
      liveDisplayWindow.showLogoScreen();
      return { success: true };
    } catch (error) {
      console.error('Failed to show logo screen:', error);
      throw error;
    }
  });

  // Get live display status
  ipcMain.handle('live-display:getStatus', async () => {
    try {
      return liveDisplayWindow.getStatus();
    } catch (error) {
      console.error('Failed to get live display status:', error);
      throw error;
    }
  });

  console.log('Display IPC handlers initialized successfully');
} 