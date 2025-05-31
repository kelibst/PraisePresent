import { screen, Display, nativeImage, desktopCapturer } from 'electron';

export interface DisplayInfo {
  id: number;
  label: string;
  manufacturer?: string;
  model?: string;
  friendlyName: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  rotation: number;
  touchSupport: 'available' | 'unavailable' | 'unknown';
  isPrimary: boolean;
  colorSpace?: string;
  colorDepth?: number;
  accelerometerSupport?: 'available' | 'unavailable' | 'unknown';
}

export class DisplayManager {
  private static instance: DisplayManager;
  private displays: DisplayInfo[] = [];
  private primaryDisplay: DisplayInfo | null = null;
  private secondaryDisplay: DisplayInfo | null = null;
  private changeListener: (() => void) | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Don't initialize here - wait until app is ready
  }

  public static getInstance(): DisplayManager {
    if (!DisplayManager.instance) {
      DisplayManager.instance = new DisplayManager();
    }
    return DisplayManager.instance;
  }

  /**
   * Initialize the display manager after app is ready
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    console.log('Initializing DisplayManager...');
    this.refreshDisplays();
    this.setupEventListeners();
    this.isInitialized = true;
    console.log('DisplayManager initialized successfully');
  }

  /**
   * Get all available displays
   */
  public getDisplays(): DisplayInfo[] {
    this.refreshDisplays();
    return [...this.displays];
  }

  /**
   * Get the primary display
   */
  public getPrimaryDisplay(): DisplayInfo | null {
    this.refreshDisplays();
    return this.primaryDisplay;
  }

  /**
   * Get the secondary display (first non-primary display found)
   */
  public getSecondaryDisplay(): DisplayInfo | null {
    this.refreshDisplays();
    return this.secondaryDisplay;
  }

  /**
   * Get display by ID
   */
  public getDisplayById(id: number): DisplayInfo | null {
    return this.displays.find(display => display.id === id) || null;
  }

  /**
   * Check if multiple displays are available
   */
  public hasMultipleDisplays(): boolean {
    return this.displays.length > 1;
  }

  /**
   * Get display count
   */
  public getDisplayCount(): number {
    return this.displays.length;
  }

  /**
   * Capture screenshot of a specific display
   */
  public async captureDisplay(displayId: number): Promise<string | null> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 320, height: 180 }
      });

      // Find the source that matches our display
      const display = this.getDisplayById(displayId);
      if (!display) {
        throw new Error(`Display ${displayId} not found`);
      }

      // For now, return the first screen source as a fallback
      // In a more sophisticated implementation, you'd match by display bounds
      const source = sources.find(source => source.display_id === displayId.toString()) || sources[0];
      
      if (source && source.thumbnail) {
        return source.thumbnail.toDataURL();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to capture display:', error);
      return null;
    }
  }

  /**
   * Set up event listeners for display changes
   */
  private setupEventListeners(): void {
    if (!this.isInitialized) {
      console.warn('DisplayManager not initialized, skipping event listeners setup');
      return;
    }

    screen.on('display-added', () => {
      console.log('Display added');
      this.refreshDisplays();
      this.notifyDisplayChange();
    });

    screen.on('display-removed', () => {
      console.log('Display removed');
      this.refreshDisplays();
      this.notifyDisplayChange();
    });

    screen.on('display-metrics-changed', () => {
      console.log('Display metrics changed');
      this.refreshDisplays();
      this.notifyDisplayChange();
    });
  }

  /**
   * Extract manufacturer and model from display label
   */
  private parseDisplayInfo(label: string): { manufacturer?: string; model?: string; friendlyName: string } {
    // Common patterns for display labels
    const patterns = [
      // "Samsung S24E650" or "Samsung 24E650"
      /^(Samsung|LG|Dell|HP|Acer|ASUS|AOC|BenQ|ViewSonic|Philips|Sony|Lenovo|MSI)\s*(.+)$/i,
      // "SAMSUNG S24E650"
      /^([A-Z]+)\s+(.+)$/,
      // Generic patterns
      /^(.+?)\s+(\d+[\w\d]*.*?)$/,
    ];

    for (const pattern of patterns) {
      const match = label.match(pattern);
      if (match) {
        const [, manufacturer, model] = match;
        return {
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          friendlyName: `${manufacturer.trim()} ${model.trim()}`
        };
      }
    }

    // Enhanced generic display names
    if (label.toLowerCase().includes('display')) {
      const displayNumber = label.match(/\d+/)?.[0];
      return {
        friendlyName: displayNumber ? `Monitor ${displayNumber}` : 'External Monitor'
      };
    }

    return { friendlyName: label || 'Unknown Display' };
  }

  /**
   * Generate a friendly display name with position info
   */
  private generateDisplayName(display: DisplayInfo, index: number): string {
    const { manufacturer, model, friendlyName } = this.parseDisplayInfo(display.label);
    
    if (manufacturer && model) {
      return display.isPrimary ? `${friendlyName} (Primary)` : `${friendlyName} (Secondary)`;
    }

    // Fallback naming based on position and characteristics
    const resolution = `${display.bounds.width}×${display.bounds.height}`;
    const position = display.isPrimary ? 'Primary' : 'Secondary';
    
    if (display.bounds.width >= 2560) {
      return `${position} Monitor (4K ${resolution})`;
    } else if (display.bounds.width >= 1920) {
      return `${position} Monitor (Full HD ${resolution})`;
    } else {
      return `${position} Monitor (${resolution})`;
    }
  }

  /**
   * Refresh the displays list
   */
  private refreshDisplays(): void {
    if (!this.isInitialized) {
      console.warn('DisplayManager not initialized, cannot refresh displays');
      return;
    }

    try {
      const electronDisplays = screen.getAllDisplays();
      const primaryElectronDisplay = screen.getPrimaryDisplay();

      this.displays = electronDisplays.map((display, index) => {
        const displayInfo = this.convertElectronDisplay(display);
        // Add enhanced naming
        displayInfo.friendlyName = this.generateDisplayName(displayInfo, index);
        return displayInfo;
      });
      
      this.primaryDisplay = this.convertElectronDisplay(primaryElectronDisplay);
      if (this.primaryDisplay) {
        this.primaryDisplay.friendlyName = this.generateDisplayName(this.primaryDisplay, 0);
      }
      
      this.secondaryDisplay = this.displays.find(display => !display.isPrimary) || null;

      console.log(`Found ${this.displays.length} display(s):`, this.displays.map(d => ({
        id: d.id,
        label: d.label,
        friendlyName: d.friendlyName,
        manufacturer: d.manufacturer,
        model: d.model,
        bounds: d.bounds,
        isPrimary: d.isPrimary
      })));
    } catch (error) {
      console.error('Error refreshing displays:', error);
      this.displays = [];
      this.primaryDisplay = null;
      this.secondaryDisplay = null;
    }
  }

  /**
   * Convert Electron Display to DisplayInfo
   */
  private convertElectronDisplay(display: Display): DisplayInfo {
    const { manufacturer, model, friendlyName } = this.parseDisplayInfo(display.label);
    
    return {
      id: display.id,
      label: display.label || `Display ${display.id}`,
      manufacturer,
      model,
      friendlyName,
      bounds: {
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
      },
      workArea: {
        x: display.workArea.x,
        y: display.workArea.y,
        width: display.workArea.width,
        height: display.workArea.height,
      },
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      touchSupport: display.touchSupport,
      isPrimary: display.id === screen.getPrimaryDisplay().id,
      colorSpace: (display as any).colorSpace,
      colorDepth: (display as any).colorDepth,
      accelerometerSupport: (display as any).accelerometerSupport,
    };
  }

  /**
   * Set change listener callback
   */
  public setChangeListener(callback: () => void): void {
    this.changeListener = callback;
  }

  /**
   * Remove change listener
   */
  public removeChangeListener(): void {
    this.changeListener = null;
  }

  /**
   * Notify about display changes
   */
  private notifyDisplayChange(): void {
    if (this.changeListener) {
      this.changeListener();
    }
  }

  /**
   * Get display configuration for debugging
   */
  public getDisplayConfiguration(): object {
    return {
      displayCount: this.displays.length,
      hasMultipleDisplays: this.hasMultipleDisplays(),
      primaryDisplay: this.primaryDisplay,
      secondaryDisplay: this.secondaryDisplay,
      allDisplays: this.displays,
      isInitialized: this.isInitialized,
    };
  }
}

// Export a singleton instance but don't initialize it yet
export const displayManager = DisplayManager.getInstance(); 