import { app, BrowserWindow, screen, shell } from 'electron';
import path from 'node:path';
import log from '../infra/logger';
import { CHANNELS } from '@/shared/constants/channels';
import type { PresentState, PresentSlide, Transition } from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import { reduce, type PresentAction } from '../services/presentEngine';

const PRESENTER_SIZE = { width: 1280, height: 800 };

let presenterWindow: BrowserWindow | null = null;
let audienceWindow: BrowserWindow | null = null;

// Operator-chosen audience display id (null = auto). Set from the persisted
// setting on startup and whenever the user changes it in Settings → Display.
let configuredAudienceDisplayId: number | null = null;

// Live presentation state is owned by main (CLAUDE.md §5.3). Default is black —
// the audience never shows anything unintended, and we fail safe to it (§5.7).
let liveState: PresentState = FAILSAFE;

function secureWebPreferences() {
  return {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    // Audience media (video/audio backgrounds) must play without a click — the
    // operator drives presentation from the presenter window, not the projector.
    autoplayPolicy: 'no-user-gesture-required',
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
  // Mirror current live state to the presenter once it is ready (§5.4 preview).
  presenterWindow.webContents.on('did-finish-load', () => broadcastState());
  if (!app.isPackaged) presenterWindow.webContents.openDevTools();
  presenterWindow.on('closed', () => {
    presenterWindow = null;
  });
  return presenterWindow;
}

// Resolve which display the audience window goes on. Honors the operator's
// configured choice; if that display is gone (hot-unplug — R4) or unset, falls
// back to the first non-primary display, else the primary (single-display dev).
// fullscreen+frameless only when the target is NOT the primary, so picking the
// primary (or falling back to it) never covers the presenter window.
function audienceTarget() {
  const primary = screen.getPrimaryDisplay();
  const all = screen.getAllDisplays();
  let display =
    configuredAudienceDisplayId !== null
      ? (all.find((d) => d.id === configuredAudienceDisplayId) ?? null)
      : null;
  if (!display) display = all.find((d) => d.id !== primary.id) ?? primary;
  return { display, isSecondary: display.id !== primary.id };
}

// Re-place the audience window on its resolved target display. Safe to call
// whenever displays or the configured choice change; blacks out on failure
// rather than crashing the live service (§5.7/R4).
function placeAudience() {
  if (!audienceWindow || audienceWindow.isDestroyed()) return;
  try {
    const { display, isSecondary } = audienceTarget();
    audienceWindow.setBounds(display.bounds);
    audienceWindow.setFullScreen(isSecondary);
    log.info(`Audience window re-placed on ${isSecondary ? 'secondary' : 'primary'} display.`);
  } catch (e) {
    log.error('Display reflow failed; blacking out:', e);
    blackout();
  }
}

// Set the operator's audience-display choice (null = auto) and re-place the
// audience window immediately. Called from displayService after persisting.
export function setConfiguredAudienceDisplay(displayId: number | null): void {
  configuredAudienceDisplayId = displayId;
  placeAudience();
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

// Broadcast the live state to BOTH windows: the audience renders it, the
// presenter mirrors it so the preview tracks the live index/mode (§5.4).
function broadcastState() {
  for (const win of [presenterWindow, audienceWindow]) {
    if (win && !win.isDestroyed()) {
      win.webContents.send(CHANNELS.present.state, liveState);
    }
  }
}

// Apply a live-presentation action through the pure reducer, then broadcast.
// Main is the single source of truth (§5.3) and clamps every index (§5.7).
export function dispatchPresent(action: PresentAction): void {
  liveState = reduce(liveState, action);
  broadcastState();
}

export function setDeck(deck: PresentSlide[], index?: number, transition?: Transition): void {
  dispatchPresent({ type: 'setDeck', deck, index, transition });
}

export function getLiveState(): PresentState {
  return liveState;
}

// Fail-safe entry point — anything can call this to force the audience black.
export function blackout() {
  dispatchPresent({ type: 'black' });
}

// Re-place / recreate the audience window when displays change, without
// crashing the live service (R4).
export function watchDisplays() {
  screen.on('display-added', placeAudience);
  screen.on('display-removed', placeAudience);
  screen.on('display-metrics-changed', placeAudience);
}

export function openWindows() {
  createPresenterWindow();
  createAudienceWindow();
  watchDisplays();
}

export function hasPresenterWindow() {
  return presenterWindow !== null;
}
