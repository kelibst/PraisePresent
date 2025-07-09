import { BrowserWindow, screen } from "electron";
import { displayManager } from "../services/DisplayManager";
import path from 'path';

// These constants are injected by Electron Forge and Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

export interface LiveWindowConfig {
  displayId: number;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
  frame?: boolean;
}

export class LiveDisplayWindow {
  private static instance: LiveDisplayWindow;
  private liveWindow: BrowserWindow | null = null;
  private currentDisplayId: number | null = null;

  private constructor() {}

  public static getInstance(): LiveDisplayWindow {
    if (!LiveDisplayWindow.instance) {
      LiveDisplayWindow.instance = new LiveDisplayWindow();
    }
    return LiveDisplayWindow.instance;
  }

  /**
   * Create live window on specified display
   */
  public async createLiveWindow(config: LiveWindowConfig): Promise<boolean> {
    try {
      // Close existing window if any
      this.closeLiveWindow();

      const display = displayManager.getDisplayById(config.displayId);
      if (!display) {
        throw new Error(`Display with ID ${config.displayId} not found`);
      }

      const electronDisplay = screen.getAllDisplays().find(
        (d) => d.id === config.displayId
      );

      if (!electronDisplay) {
        throw new Error(`Electron display with ID ${config.displayId} not found`);
      }

      // Create window with display-specific bounds
      this.liveWindow = new BrowserWindow({
        x: electronDisplay.bounds.x,
        y: electronDisplay.bounds.y,
        width: electronDisplay.bounds.width,
        height: electronDisplay.bounds.height,
        fullscreen: config.fullscreen ?? true,
        frame: config.frame ?? false,
        alwaysOnTop: config.alwaysOnTop ?? true,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          preload: path.join(__dirname, "preload.js"),
        },
        skipTaskbar: true,
        minimizable: false,
        maximizable: false,
        resizable: false,
      });

      // Load the live display renderer
      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        await this.liveWindow.loadURL(
          `${MAIN_WINDOW_VITE_DEV_SERVER_URL}?mode=live-display&displayId=${config.displayId}`
        );
      } else {
        await this.liveWindow.loadFile(
          path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
          { search: `mode=live-display&displayId=${config.displayId}` }
        );
      }

      // Open developer tools for debugging (remove in production)
      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        this.liveWindow.webContents.openDevTools();
      }

      // Set up window event handlers
      this.setupWindowEvents();

      this.currentDisplayId = config.displayId;

      return true;
    } catch (error) {
      console.error("Failed to create live window:", error);
      return false;
    }
  }

  /**
   * Show the live window
   */
  public showLiveWindow(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.show();
      this.liveWindow.focus();
    }
  }

  /**
   * Hide the live window
   */
  public hideLiveWindow(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.hide();
    }
  }

  /**
   * Close the live window
   */
  public closeLiveWindow(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.close();
      this.liveWindow = null;
      this.currentDisplayId = null;
    }
  }

  /**
   * Check if live window exists and is visible
   */
  public isLiveWindowActive(): boolean {
    return !!(
      this.liveWindow &&
      !this.liveWindow.isDestroyed() &&
      this.liveWindow.isVisible()
    );
  }

  /**
   * Get current live window
   */
  public getLiveWindow(): BrowserWindow | null {
    return this.liveWindow && !this.liveWindow.isDestroyed()
      ? this.liveWindow
      : null;
  }

  /**
   * Get current display ID
   */
  public getCurrentDisplayId(): number | null {
    return this.currentDisplayId;
  }

  /**
   * Move live window to different display
   */
  public async moveToDisplay(displayId: number): Promise<boolean> {
    if (this.currentDisplayId === displayId) return true;
    return this.createLiveWindow({ displayId });
  }

  /**
   * Send message to live window
   */
  public sendMessage(channel: string, ...args: any[]): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed() && this.liveWindow.webContents) {
      this.liveWindow.webContents.send(channel, ...args);
    } else {
      console.warn(`Cannot send message to live window: ${channel}`, 'Window not ready');
    }
  }

  /**
   * Get live window status
   */
  public getStatus(): object {
    const window = this.getLiveWindow();
    return {
      hasWindow: !!window,
      isVisible: window?.isVisible() || false,
      currentDisplayId: this.currentDisplayId,
      bounds: window?.getBounds() || null,
      isFullscreen: window?.isFullScreen() || false,
    };
  }

  private setupWindowEvents(): void {
    if (!this.liveWindow) return;

    this.liveWindow.on("closed", () => {
      this.liveWindow = null;
      this.currentDisplayId = null;
    });

    this.liveWindow.on("ready-to-show", () => {
      if (this.currentDisplayId) {
        const display = screen.getAllDisplays().find(
          (d) => d.id === this.currentDisplayId
        );
        if (display && this.liveWindow) {
          this.liveWindow.setBounds(display.bounds);
        }
      }
    });

    // Handle display removal
    screen.on("display-removed", () => {
      if (this.currentDisplayId) {
        const stillExists = screen.getAllDisplays().find(
          (d) => d.id === this.currentDisplayId
        );
        if (!stillExists) {
          this.closeLiveWindow();
        }
      }
    });
  }
}

// Export singleton instance
export const liveDisplayWindow = LiveDisplayWindow.getInstance();