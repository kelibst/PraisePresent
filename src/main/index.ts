import { app, session } from 'electron';
import started from 'electron-squirrel-startup';
import log from './infra/logger';
import { initDatabase } from './db';
import { registerIpcHandlers } from './ipc';
import { openWindows, createPresenterWindow, hasPresenterWindow } from './windows/windowManager';

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

// This method will be called when Electron has finished initialization and is
// ready to create browser windows.
app.on('ready', () => {
  log.info('App ready; initializing.');
  initDatabase();
  registerIpcHandlers();
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [app.isPackaged ? CSP_PROD : CSP_DEV],
      },
    });
  });
  openWindows();
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
  // On macOS re-create the presenter window when the dock icon is clicked and
  // there are no windows open.
  if (!hasPresenterWindow()) {
    createPresenterWindow();
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
