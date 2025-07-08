import * as path from 'path';
import { app } from 'electron';
import { menubar } from 'menubar';
import {
  SettingsManager,
  ShortcutManager,
  ContextMenuManager,
  IPCManager,
} from './modules';

class MenubarApp {
  private menubar: any; // From @max-mapper/menubar - no types available
  private settingsManager!: SettingsManager;
  private shortcutManager!: ShortcutManager;
  private contextMenuManager!: ContextMenuManager;
  private ipcManager!: IPCManager;
  private isQuitting: boolean = false;

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    // Wait for app to be ready
    await app.whenReady();

    // Initialize modules
    this.initializeModules();

    // Setup menubar
    await this.setupMenubar();

    // Setup managers
    await this.setupManagers();
  }

  private initializeModules(): void {
    // Initialize core modules
    this.settingsManager = new SettingsManager();
    this.shortcutManager = new ShortcutManager();

    // Initialize IPC manager with dependencies
    this.ipcManager = new IPCManager(
      this.settingsManager,
      this.shortcutManager,
      () => this.quitApp()
    );

    console.log('Core modules initialized');
  }

  private async setupMenubar(): Promise<void> {
    // Load saved settings to get window size
    const savedSettings = await this.settingsManager.getSettings();

    this.menubar = menubar({
      index: `file://${path.join(__dirname, 'renderer', 'index.html')}`,
      preloadWindow: true,
      showOnAllWorkspaces: true,
      windowPosition: 'trayCenter',
      tooltip: 'Menubar App',
      showDockIcon: false, // Don't show in dock
      browserWindow: {
        width: savedSettings.window.width,
        height: savedSettings.window.height,
        show: false, // Don't show on create
        frame: false, // Remove window frame
        resizable: true, // Enable resizing to allow user customization
        alwaysOnTop: true, // Keep on top when shown
        skipTaskbar: true, // Don't show in taskbar
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
      },
    });

    // Setup event handlers
    this.setupMenubarEvents();
  }

  private setupMenubarEvents(): void {
    this.menubar.on('ready', () => {
      console.log('Menubar app is ready');
      // Register shortcuts after menubar is ready
      this.registerDefaultShortcuts();
    });

    this.menubar.on('create-window', () => {
      console.log('Menubar window created');
    });

    this.menubar.on('show', () => {
      console.log('Menubar window shown');
    });

    this.menubar.on('hide', () => {
      console.log('Menubar window hidden');
    });

    // Handle window events
    this.menubar.on('after-create-window', () => {
      // Prevent window from closing, hide instead (unless we're quitting)
      this.menubar.window.on('close', (event: any) => {
        if (!this.isQuitting) {
          event.preventDefault();
          this.menubar.hideWindow();
        }
      });

      // Hide on blur (focus lost) - only if enabled in settings
      this.menubar.window.on('blur', async () => {
        try {
          const settings = await this.settingsManager.getSettings();
          // Only hide on blur if the setting is enabled and dev tools are not open
          if (
            settings.hideOnBlur &&
            this.menubar.window &&
            this.menubar.window.webContents &&
            !this.menubar.window.webContents.isDevToolsOpened()
          ) {
            this.menubar.hideWindow();
          }
        } catch (error) {
          console.error('Error checking hideOnBlur setting:', error);
        }
      });

      // Save window size when resized
      this.menubar.window.on('resize', async () => {
        if (this.menubar.window) {
          const [width, height] = this.menubar.window.getSize();
          console.log(`Window resized to: ${width}x${height}`);

          // Update settings with new size using convenience method
          try {
            await this.settingsManager.updateWindowSize(width, height);
          } catch (error) {
            console.error('Error saving window size:', error);
          }
        }
      });
    });
  }

  private async setupManagers(): Promise<void> {
    // Initialize context menu manager after menubar is created
    this.contextMenuManager = new ContextMenuManager(this.menubar, () =>
      this.quitApp()
    );

    // Initialize context menu with right-click only behavior
    this.contextMenuManager.initialize('right-only');

    console.log('Managers setup completed');
  }

  private getShortcutCallbacks() {
    return {
      toggleWindow: () => {
        console.log('Toggle shortcut triggered');
        // Check if window exists before accessing it
        if (this.menubar.window && this.menubar.window.isVisible()) {
          this.menubar.hideWindow();
        } else {
          this.menubar.showWindow();
        }
      },
      quit: () => {
        console.log('Quit shortcut triggered');
        this.quitApp();
      },
    };
  }

  private async registerDefaultShortcuts(): Promise<void> {
    try {
      const callbacks = this.getShortcutCallbacks();

      // Set callbacks in IPC manager so it can re-register shortcuts when settings change
      this.ipcManager.setShortcutCallbacks(callbacks);

      // Load saved settings and apply them before registering shortcuts
      const savedSettings = await this.settingsManager.getSettings();
      console.log('Loading saved settings on startup:', savedSettings);

      // Register shortcuts with saved values (or defaults if no saved settings exist)
      const shortcutsRegistered =
        this.shortcutManager.registerShortcuts(callbacks);
      if (shortcutsRegistered) {
        // Update shortcuts with saved values if different from defaults
        if (savedSettings.shortcuts) {
          this.shortcutManager.updateAllShortcuts(
            savedSettings.shortcuts,
            callbacks
          );
        }
      } else {
        console.warn('Failed to register some shortcuts');
      }

      // Apply dock visibility setting on startup (macOS only)
      this.applyDockVisibility(savedSettings.showInDock);

      console.log('Shortcuts registered:', this.shortcutManager.getShortcuts());
    } catch (error) {
      console.error('Error registering shortcuts:', error);
    }
  }

  // Public methods for external control
  public getMenubar(): any {
    return this.menubar;
  }

  public getSettingsManager(): SettingsManager {
    return this.settingsManager;
  }

  public getShortcutManager(): ShortcutManager {
    return this.shortcutManager;
  }

  public updateContextMenu(customItems?: any[]): void {
    if (this.contextMenuManager) {
      this.contextMenuManager.updateContextMenu(customItems);
    }
  }

  public setTrayClickBehavior(
    behavior: 'right-only' | 'left-and-right' | 'left-only'
  ): void {
    if (this.contextMenuManager) {
      this.contextMenuManager.setClickBehavior(behavior);
    }
  }

  // Apply dock visibility setting (macOS only)
  private applyDockVisibility(showInDock: boolean): void {
    if (process.platform === 'darwin') {
      try {
        if (showInDock) {
          app.dock.show();
        } else {
          app.dock.hide();
        }
        console.log(`Dock visibility set to: ${showInDock}`);
      } catch (error) {
        console.error('Error setting dock visibility:', error);
      }
    }
  }

  // Method to properly quit the app
  public quitApp(): void {
    console.log('Quitting application...');
    this.isQuitting = true;

    // Cleanup managers
    try {
      this.shortcutManager?.cleanup();
      this.contextMenuManager?.cleanup();
      this.ipcManager?.cleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }

    app.quit();
  }
}

// Create and start the app
const menubarApp = new MenubarApp();

// Handle app lifecycle events
app.on('window-all-closed', () => {
  // For menubar apps, don't quit when all windows are closed
  // The app should stay running in the tray
});

app.on('before-quit', () => {
  // Set the quitting flag so the window can close properly
  if (menubarApp) {
    (menubarApp as any).isQuitting = true;
  }

  // Clean up shortcuts before quitting
  try {
    if (menubarApp.getShortcutManager()) {
      menubarApp.getShortcutManager().cleanup();
    }
  } catch (error) {
    console.error('Error cleaning up shortcuts:', error);
  }
});

app.on('activate', () => {
  // On macOS, show the menubar window when app is activated
  if (menubarApp.getMenubar()) {
    menubarApp.getMenubar().showWindow();
  }
});

// Export for potential external use
export default menubarApp;
