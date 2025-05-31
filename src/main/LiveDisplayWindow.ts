import { BrowserWindow, screen } from 'electron';
import { displayManager } from '../services/DisplayManager';

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
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): LiveDisplayWindow {
    if (!LiveDisplayWindow.instance) {
      LiveDisplayWindow.instance = new LiveDisplayWindow();
    }
    return LiveDisplayWindow.instance;
  }

  /**
   * Initialize the live display window manager
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    console.log('Initializing LiveDisplayWindow manager...');
    this.isInitialized = true;
    console.log('LiveDisplayWindow manager initialized successfully');
  }

  /**
   * Create live window on specified display
   */
  public async createLiveWindow(config: LiveWindowConfig): Promise<boolean> {
    try {
      // Close existing window if any
      if (this.liveWindow && !this.liveWindow.isDestroyed()) {
        this.liveWindow.close();
      }

      const display = displayManager.getDisplayById(config.displayId);
      if (!display) {
        throw new Error(`Display with ID ${config.displayId} not found`);
      }

      console.log(`Creating live window on display ${config.displayId}: ${display.friendlyName || display.label}`);

      // Create the live presentation window
      this.liveWindow = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        fullscreen: config.fullscreen ?? true,
        frame: config.frame ?? false,
        alwaysOnTop: config.alwaysOnTop ?? true,
        show: false, // Don't show immediately
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
          preload: require('path').join(__dirname, '../preload.js'),
        },
      });

      // Load the live display renderer
      if (process.env.VITE_DEV_SERVER_URL) {
        await this.liveWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/live-display`);
      } else {
        await this.liveWindow.loadFile('dist/renderer/index.html', { hash: 'live-display' });
      }

      // Set up window event handlers
      this.setupWindowEvents();

      this.currentDisplayId = config.displayId;
      console.log('Live window created successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to create live window:', error);
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
      console.log('Live window shown');
    }
  }

  /**
   * Hide the live window
   */
  public hideLiveWindow(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.hide();
      console.log('Live window hidden');
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
      console.log('Live window closed');
    }
  }

  /**
   * Check if live window exists and is visible
   */
  public isLiveWindowActive(): boolean {
    return !!(this.liveWindow && !this.liveWindow.isDestroyed() && this.liveWindow.isVisible());
  }

  /**
   * Get current live window
   */
  public getLiveWindow(): BrowserWindow | null {
    return this.liveWindow && !this.liveWindow.isDestroyed() ? this.liveWindow : null;
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
    if (!this.liveWindow || this.liveWindow.isDestroyed()) {
      // Create new window if none exists
      return this.createLiveWindow({ displayId });
    }

    const display = displayManager.getDisplayById(displayId);
    if (!display) {
      console.error(`Display with ID ${displayId} not found`);
      return false;
    }

    try {
      // Move and resize window to new display
      this.liveWindow.setBounds({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
      });

      this.currentDisplayId = displayId;
      console.log(`Live window moved to display ${displayId}: ${display.friendlyName || display.label}`);
      return true;
    } catch (error) {
      console.error('Failed to move live window:', error);
      return false;
    }
  }

  /**
   * Send content to live window
   */
  public sendContentToLive(content: any): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send('live-content-update', content);
      console.log('Content sent to live window:', content);
    } else {
      console.warn('No active live window to send content to');
    }
  }

  /**
   * Clear content from live window
   */
  public clearLiveContent(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send('live-content-clear');
      console.log('Live content cleared');
    }
  }

  /**
   * Show black screen
   */
  public showBlackScreen(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send('live-show-black');
      console.log('Black screen displayed');
    }
  }

  /**
   * Show logo screen
   */
  public showLogoScreen(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send('live-show-logo');
      console.log('Logo screen displayed');
    }
  }

  /**
   * Set up window event handlers
   */
  private setupWindowEvents(): void {
    if (!this.liveWindow) return;

    this.liveWindow.on('closed', () => {
      console.log('Live window was closed');
      this.liveWindow = null;
      this.currentDisplayId = null;
    });

    this.liveWindow.on('ready-to-show', () => {
      console.log('Live window ready to show');
    });

    this.liveWindow.on('focus', () => {
      console.log('Live window focused');
    });

    this.liveWindow.on('blur', () => {
      console.log('Live window lost focus');
    });

    // Handle display changes
    screen.on('display-removed', () => {
      if (this.currentDisplayId) {
        const display = displayManager.getDisplayById(this.currentDisplayId);
        if (!display) {
          console.warn('Current display was removed, closing live window');
          this.closeLiveWindow();
        }
      }
    });
  }

  /**
   * Get live window status
   */
  public getStatus(): object {
    return {
      hasWindow: !!this.liveWindow && !this.liveWindow.isDestroyed(),
      isVisible: this.liveWindow && !this.liveWindow.isDestroyed() ? this.liveWindow.isVisible() : false,
      currentDisplayId: this.currentDisplayId,
      bounds: this.liveWindow && !this.liveWindow.isDestroyed() 
        ? this.liveWindow.getBounds() 
        : null,
      isInitialized: this.isInitialized,
    };
  }
}

// Export singleton instance
export const liveDisplayWindow = LiveDisplayWindow.getInstance(); 