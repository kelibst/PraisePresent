import { app, session } from 'electron';
import started from 'electron-squirrel-startup';
import log from './infra/logger';
import { initDatabase, closeDb } from './db';
import { registerIpcHandlers } from './ipc';
import { hydrateScripture } from './services/scriptureService';
import { displayService } from './services/displayService';
import { capabilityService } from './services/capabilityService';
import { openWindows, createPresenterWindow, hasPresenterWindow } from './windows/windowManager';
import { registerMediaScheme, handleMediaProtocol } from './windows/mediaProtocol';
import { buildCsp } from './infra/csp';
import { allowConnectSource } from './infra/config';
import { ANTHROPIC_API_HOST } from './services/onlineScriptureExtractor';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Privileged custom schemes MUST be registered before the app is ready.
registerMediaScheme();

// This method will be called when Electron has finished initialization and is
// ready to create browser windows.
app.on('ready', () => {
  log.info('App ready; initializing.');
  initDatabase();
  hydrateScripture();
  // Online scripture extraction (main only) reaches the Anthropic API; widen the
  // CSP connect-src to exactly that host before headers are set (§1.4, spec §6).
  allowConnectSource(ANTHROPIC_API_HOST);
  registerIpcHandlers();
  handleMediaProtocol();
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [buildCsp()],
      },
    });
  });
  displayService.init(); // load persisted audience-display choice before windows open
  capabilityService.init(); // detect hardware capability/tier before windows read it (B6a)
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

// Checkpoint and close the SQLite WAL connection cleanly on shutdown.
app.on('before-quit', () => {
  closeDb();
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
