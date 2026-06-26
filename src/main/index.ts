import { app, BrowserWindow, session, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import log from './infra/logger';
import { registerIpcHandlers } from './ipc';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Default-deny Content-Security-Policy, applied as a response header to every
// request in the default session (and reinforced by the <meta> tag in
// index.html). In production scripts are locked to 'self' — no inline, no eval,
// no remote origins. The Vite dev server injects an inline bootstrap script and
// uses a websocket for HMR, so development relaxes exactly those. `connect-src`
// is widened per-domain (Bible/AI endpoints) in later phases.
const CSP_PROD =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self' data:; img-src 'self' data:; connect-src 'self'; " +
  "object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'";
const CSP_DEV =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
  "font-src 'self' data:; img-src 'self' data:; " +
  "connect-src 'self' ws://localhost:* http://localhost:*; " +
  "object-src 'none'; base-uri 'self'";

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Electron-security defaults made explicit (CLAUDE.md §1.4) so a careless
      // edit can't silently regress them.
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Never open new windows from web content; send external https links to the
  // OS browser instead. Everything else is denied.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Navigation allow-list: only the dev server (development) or the packaged
  // app file. Hash-router navigations are same-document and don't fire this.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL;
    const allowed = (devUrl && url.startsWith(devUrl)) || url.startsWith('file://');
    if (!allowed) {
      event.preventDefault();
    }
  });

  // Log renderer crashes rather than dying silently; the window stays
  // recoverable via the renderer error boundary.
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log.error('render-process-gone:', details.reason, 'exitCode:', details.exitCode);
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // DevTools only outside the packaged build (CLAUDE.md §1.4).
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished initialization and is
// ready to create browser windows.
app.on('ready', () => {
  log.info('App ready; creating main window.');
  registerIpcHandlers();
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [app.isPackaged ? CSP_PROD : CSP_DEV],
      },
    });
  });
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common for
// applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the dock icon is
  // clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Surface child-process and unhandled failures instead of crashing the live
// service (CLAUDE.md §5.7).
app.on('child-process-gone', (_event, details) => {
  log.error('child-process-gone:', details.type, details.reason);
});
process.on('uncaughtException', (error) => {
  log.error('uncaughtException:', error);
});
process.on('unhandledRejection', (reason) => {
  log.error('unhandledRejection:', reason);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
