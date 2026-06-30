import { app, BrowserWindow, screen, shell } from 'electron';
import path from 'node:path';
import log from '../infra/logger';
import { CHANNELS } from '@/shared/constants/channels';
import type {
  PresentState,
  PresentSlide,
  Transition,
  SlideBackground,
} from '@/shared/schemas/present';
import { FAILSAFE } from '@/shared/schemas/present';
import { BLACK_ON_DISCONNECT_KEY, parseBlackOnDisconnect } from '@/shared/schemas/display';
import {
  SERVICE_BACKGROUND_KEY,
  parseServiceBackground,
  serializeServiceBackground,
} from '@/shared/present/serviceBackground';
import { settingsRepository } from '../db/repositories/settingsRepository';
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

// Physical-pixel size of the resolved audience (projector) display — the ceiling the
// media pipeline pre-scales images to (B6b). Falls back to 1080p if `screen` is
// unavailable (never throws). bounds are DIP; multiply by scaleFactor for real pixels.
export function getAudienceTargetSize(): { width: number; height: number } {
  try {
    const { display } = audienceTarget();
    const sf = display.scaleFactor || 1;
    return {
      width: Math.round(display.bounds.width * sf),
      height: Math.round(display.bounds.height * sf),
    };
  } catch {
    return { width: 1920, height: 1080 };
  }
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

function liveWindows(): BrowserWindow[] {
  return [presenterWindow, audienceWindow].filter(
    (w): w is BrowserWindow => w !== null && !w.isDestroyed(),
  );
}

// Send the rarely-changing deck (slides + rev) to BOTH windows. Called only on
// deck-changing actions (rev bumped) and on a fresh window load (B1).
function broadcastDeck() {
  const payload = {
    rev: liveState.rev,
    deck: liveState.deck,
    defaultBackground: liveState.defaultBackground,
  };
  for (const win of liveWindows()) win.webContents.send(CHANNELS.present.deck, payload);
}

// Send the frequently-changing cursor (rev + index + mode + transition) to BOTH
// windows. Tiny payload — the hot path. The audience renders it, the presenter
// mirrors it so the preview tracks the live index/mode (§5.4).
function broadcastCursor() {
  const payload = {
    rev: liveState.rev,
    index: liveState.index,
    mode: liveState.mode,
    transition: liveState.transition,
  };
  for (const win of liveWindows()) win.webContents.send(CHANNELS.present.cursor, payload);
}

// Seed a freshly-loaded window with the full current state: deck first, then cursor
// (the reconciler needs the matching deck before the cursor — B1 ordering).
function broadcastState() {
  broadcastDeck();
  broadcastCursor();
}

// Push an AI orchestrator event (candidates / transcript) to the PRESENTER
// window only — the operator reviews there; the audience never sees unconfirmed
// AI output (R8). Fails safe: a destroyed window is skipped, never throws.
export function sendToPresenter(channel: string, payload: unknown): void {
  if (presenterWindow && !presenterWindow.isDestroyed()) {
    presenterWindow.webContents.send(channel, payload);
  }
}

// Apply a live-presentation action through the pure reducer, then broadcast.
// Main is the single source of truth (§5.3) and clamps every index (§5.7).
//
// Split broadcast (B1): when the deck CONTENTS change the reducer bumps `rev`, so
// we ship the deck (then the cursor). Pure transport actions leave `rev` untouched
// and send the cursor only — O(cursor), not O(whole deck). Deck-before-cursor keeps
// the reconciler's `rev` invariant (it must have the matching deck first).
export function dispatchPresent(action: PresentAction): void {
  const prevRev = liveState.rev;
  liveState = reduce(liveState, action);
  if (liveState.rev !== prevRev) broadcastDeck();
  broadcastCursor();
}

export function setDeck(deck: PresentSlide[], index?: number, transition?: Transition): void {
  // The service-wide default background is NOT baked into the deck — it is live
  // state resolved at render time (`effectiveBackground`), so the deck carries
  // only explicit per-slide backgrounds. The reducer preserves `defaultBackground`.
  dispatchPresent({ type: 'setDeck', deck, index, transition });
}

// Set (or clear, with `null`) the SERVICE-WIDE default background. Persists it
// (truth in SQLite — survives restart, §1.5) AND updates live state so the change
// is visible on the CURRENT deck immediately, not just future decks. The value is
// re-validated by the zod schema before reaching a slide (§5.7). A persistence
// hiccup never throws into the live path.
export function setDefaultBackground(background: SlideBackground | null): void {
  try {
    settingsRepository.set(SERVICE_BACKGROUND_KEY, serializeServiceBackground(background));
  } catch (e) {
    log.warn('Could not persist the service default background:', e);
  }
  dispatchPresent({ type: 'setDefaultBackground', background });
}

// Load the persisted service default background into live state at startup, before
// the first broadcast (called after the DB is ready). A DB hiccup never throws —
// the default just stays null (the gradient backdrop), fail safe (§5.7).
export function initPresent(): void {
  try {
    liveState = {
      ...liveState,
      defaultBackground: parseServiceBackground(settingsRepository.get(SERVICE_BACKGROUND_KEY)),
    };
  } catch (e) {
    log.warn('Could not load the service default background; using none:', e);
  }
}

export function setBackground(
  background: SlideBackground | null,
  index?: number,
  applyToAll?: boolean,
): void {
  dispatchPresent({ type: 'setBackground', background, index, applyToAll });
}

export function updateText(lines: string[], index?: number): void {
  dispatchPresent({ type: 'updateText', lines, index });
}

export function getLiveState(): PresentState {
  return liveState;
}

// Fail-safe entry point — anything can call this to force the audience black.
export function blackout() {
  dispatchPresent({ type: 'black' });
}

// Whether the operator wants the audience blacked out on a display unplug.
// Defaults ON (fail safe — §5.7); a DB hiccup never throws here.
function blackOnDisconnectEnabled(): boolean {
  try {
    return parseBlackOnDisconnect(settingsRepository.get(BLACK_ON_DISCONNECT_KEY));
  } catch (e) {
    log.warn('Could not read black-on-disconnect setting; defaulting ON:', e);
    return true;
  }
}

// A display was unplugged. If black-on-disconnect is on, force the audience to
// black FIRST (so a lost projector never strands a half-shown slide on whatever
// screen the window lands on — §5.7), then re-place onto the surviving display.
function onDisplayRemoved() {
  if (blackOnDisconnectEnabled()) {
    log.info('Display removed; blacking out the audience (black-on-disconnect).');
    blackout();
  }
  placeAudience();
}

// Re-place / recreate the audience window when displays change, without
// crashing the live service (R4).
export function watchDisplays() {
  screen.on('display-added', placeAudience);
  screen.on('display-removed', onDisplayRemoved);
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
