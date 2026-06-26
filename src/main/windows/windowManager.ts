import { app, BrowserWindow, screen, shell } from 'electron';
import path from 'node:path';
import log from '../infra/logger';
import { CHANNELS } from '@/shared/constants/channels';
import type { PresentState } from '@/shared/schemas/present';

const PRESENTER_SIZE = { width: 1280, height: 800 };

let presenterWindow: BrowserWindow | null = null;
let audienceWindow: BrowserWindow | null = null;

// Live presentation state is owned by main (CLAUDE.md §5.3). Default is black —
// the audience never shows anything unintended, and we fail safe to it (§5.7).
let liveState: PresentState = { mode: 'black', slide: null };

function secureWebPreferences() {
  return {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
  } as const;
}

// Shared window hardening (CLAUDE.md §1.4): deny new windows, allow-list
// navigation. Applied to BOTH presenter and audience windows.
function hardenWindow(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    const devUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL;
    const allowed = (devUrl && url.startsWith(devUrl)) || url.startsWith('file://');
    if (!allowed) event.preventDefault();
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    log.error('render-process-gone:', details.reason, 'exitCode:', details.exitCode);
  });
}

function loadRoute(win: BrowserWindow, hashRoute: string) {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${hashRoute}`);
  } else {
    void win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      hash: hashRoute,
    });
  }
}

export function createPresenterWindow(): BrowserWindow {
  presenterWindow = new BrowserWindow({
    width: PRESENTER_SIZE.width,
    height: PRESENTER_SIZE.height,
    webPreferences: secureWebPreferences(),
  });
  hardenWindow(presenterWindow);
  loadRoute(presenterWindow, '/');
  if (!app.isPackaged) presenterWindow.webContents.openDevTools();
  presenterWindow.on('closed', () => {
    presenterWindow = null;
  });
  return presenterWindow;
}

// Pick the secondary display if one exists; otherwise fall back to the primary
// (single-display dev). fullscreen only on a real second screen.
function audienceTarget() {
  const primary = screen.getPrimaryDisplay();
  const secondary = screen.getAllDisplays().find((d) => d.id !== primary.id) ?? null;
  return { display: secondary ?? primary, isSecondary: secondary !== null };
}

export function createAudienceWindow(): BrowserWindow {
  const { display, isSecondary } = audienceTarget();
  audienceWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    fullscreen: isSecondary,
    frame: isSecondary ? false : true,
    backgroundColor: '#000000', // fail-safe black before content paints
    webPreferences: secureWebPreferences(),
  });
  hardenWindow(audienceWindow);
  loadRoute(audienceWindow, '/audience');
  // Push current state once the audience renderer is ready.
  audienceWindow.webContents.on('did-finish-load', () => broadcastState());
  audienceWindow.on('closed', () => {
    audienceWindow = null;
  });
  log.info(`Audience window on ${isSecondary ? 'secondary' : 'primary (fallback)'} display.`);
  return audienceWindow;
}

function broadcastState() {
  if (audienceWindow && !audienceWindow.isDestroyed()) {
    audienceWindow.webContents.send(CHANNELS.present.state, liveState);
  }
}

export function setLiveState(state: PresentState) {
  liveState = state;
  broadcastState();
}

export function getLiveState(): PresentState {
  return liveState;
}

// Fail-safe entry point — anything can call this to force the audience black.
export function blackout() {
  setLiveState({ mode: 'black', slide: null });
}

// Re-place / recreate the audience window when displays change, without
// crashing the live service (R4).
export function watchDisplays() {
  const reflow = () => {
    if (!audienceWindow || audienceWindow.isDestroyed()) return;
    try {
      const { display, isSecondary } = audienceTarget();
      audienceWindow.setBounds(display.bounds);
      audienceWindow.setFullScreen(isSecondary);
      log.info('Audience window re-placed after display change.');
    } catch (e) {
      log.error('Display reflow failed; blacking out:', e);
      blackout();
    }
  };
  screen.on('display-added', reflow);
  screen.on('display-removed', reflow);
  screen.on('display-metrics-changed', reflow);
}

export function openWindows() {
  createPresenterWindow();
  createAudienceWindow();
  watchDisplays();
}

export function hasPresenterWindow() {
  return presenterWindow !== null;
}
