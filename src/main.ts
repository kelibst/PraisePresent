import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { setupDatabaseIPC } from './main/database';

// These constants are injected by Electron Forge and Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const isMac = process.platform === 'darwin';

// Setup database IPC handlers immediately
if (app.isReady()) {
  setupDatabaseIPC();
} else {
  app.whenReady().then(() => {
    setupDatabaseIPC();
  });
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true, 
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Remove default browser window behaviors
    autoHideMenuBar: true,
    // Ensure no browser-style window borders
    ...(isMac && { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 15, y: 10 } }),
    ...(!isMac && { thickFrame: false }),
    // Prevent browser-like scrollbars
    useContentSize: true,
    backgroundColor: '#1a1a2e', // Dark background color (matches dark theme)
  });

  // Maximize window on startup
  mainWindow.maximize();
  
  // Better way to handle window state
  const sendWindowState = () => {
    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send('window-is-maximized');
    } else {
      mainWindow.webContents.send('window-is-unmaximized');
    }
  };

  // Custom event handling to track window maximize state
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-is-maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-is-unmaximized');
  });
  
  // Send window state when the DOM is ready
  mainWindow.webContents.on('dom-ready', sendWindowState);

  // Send theme information to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('theme-update', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });
  
  // Listen for theme changes from the system
  nativeTheme.on('updated', () => {
    mainWindow.webContents.send('theme-update', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Add these after your app.on('activate', ...) handler
ipcMain.on('window-minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && !win.isMaximized()) win.maximize();
});

ipcMain.on('window-unmaximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win && win.isMaximized()) win.unmaximize();
});

ipcMain.on('window-close', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

// Add theme IPC handlers
ipcMain.on('theme-set', (_, theme) => {
  nativeTheme.themeSource = theme as 'system' | 'light' | 'dark';
});

ipcMain.handle('theme-get', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
