import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { displayManager } from './services/DisplayManager';
import { initializeDisplayMain, cleanupDisplayMain } from './main/display-main';
import { liveDisplayWindow } from './main/liveDisplayWindow';

// These constants are injected by Electron Forge and Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Live display initialization function
async function initializeLiveDisplay() {
  try {
    // Get available displays
    const displays = displayManager.getDisplays();
    const secondaryDisplay = displayManager.getSecondaryDisplay();
    
    // Only initialize if we have multiple displays
    if (displays.length > 1 && secondaryDisplay) {
      console.log(`Initializing live display on secondary display: ${secondaryDisplay.id}`);
      
      // Create live display window on secondary display
      const success = await liveDisplayWindow.createLiveWindow({
        displayId: secondaryDisplay.id,
        fullscreen: true,
        alwaysOnTop: true,
        frame: false,
      });
      
      if (success) {
        console.log(`Live display initialized successfully on display ${secondaryDisplay.id}`);
        
        // Send initial welcome content after window is ready
        setTimeout(() => {
          const liveWindow = liveDisplayWindow.getLiveWindow();
          if (liveWindow && !liveWindow.isDestroyed() && liveWindow.webContents) {
            liveDisplayWindow.sendMessage('live-content-update', {
              type: 'placeholder',
              title: 'Live Display Ready',
              content: {
                mainText: 'PraisePresent Live Display',
                subText: 'Ready to display content',
                timestamp: new Date().toLocaleTimeString(),
              },
            });
          }
        }, 3000); // Wait 3 seconds for window to be fully ready
        
        // Show the window
        liveDisplayWindow.showLiveWindow();
      } else {
        console.warn('Failed to initialize live display');
      }
    } else {
      console.log('Single display detected - live display initialization skipped');
    }
  } catch (error) {
    console.error('Error initializing live display:', error);
  }
}

const createWindow = () => {
  // Set up CSP - more permissive in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // Development CSP - more permissive for Vite
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self';",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval';", // Allow inline scripts for dev
            "style-src 'self' 'unsafe-inline';",
            "font-src 'self' data:;",
            "img-src 'self' data: https:;",
            "connect-src 'self' https: ws: wss:;", // Allow websockets for HMR
          ].join(' ')
        }
      });
    });
  } else {
    // Production CSP - more restrictive
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self';",
            "script-src 'self';",
            "style-src 'self' 'unsafe-inline';",
            "font-src 'self' data:;",
            "img-src 'self' data: https:;",
            "connect-src 'self' https:;",
          ].join(' ')
        }
      });
    });
  }

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    trafficLightPosition: { x: -100, y: -100 }, // Hide macOS traffic lights
    transparent: false,
    hasShadow: true,
    roundedCorners: true,
    vibrancy: 'window', // macOS only
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: false, // Disable sandbox in development for better compatibility
    },
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Initialize live display after main window is ready
    setTimeout(() => {
      initializeLiveDisplay();
    }, 1000); // Wait 1 second for everything to be ready
  });

  // Open DevTools in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// Initialize app when ready
app.whenReady().then(() => {
  // Initialize display management
  displayManager.initialize();
  initializeDisplayMain();
  
  // Create main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up before quitting
app.on('before-quit', () => {
  cleanupDisplayMain();
  liveDisplayWindow.closeLiveWindow();
  displayManager.removeChangeListener();
});
