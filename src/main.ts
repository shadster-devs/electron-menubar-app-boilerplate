import { app } from 'electron';
import { menubar } from 'menubar';
import * as path from 'path';
import { 
  SettingsManager, 
  ShortcutManager, 
  ContextMenuManager, 
  IPCManager 
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
    this.setupMenubar();

    // Setup managers
    this.setupManagers();
  }

  private initializeModules(): void {
    // Initialize core modules
    this.settingsManager = new SettingsManager();
    this.shortcutManager = new ShortcutManager();

    // Initialize IPC manager with dependencies
    this.ipcManager = new IPCManager(this.settingsManager, this.shortcutManager, () => this.quitApp());

    // Application menu is not needed for menubar apps
  }

  private setupMenubar(): void {
    // Load saved settings to get window size
    const savedSettings = this.settingsManager.getSettings();
    
    this.menubar = menubar({
      index: `file://${path.join(__dirname, 'renderer', 'index.html')}`,
      preloadWindow: true,
      showOnAllWorkspaces: false,
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
      
      // Hide on blur (focus lost) but not when dev tools are open
      this.menubar.window.on('blur', () => {
        // Check if window and webContents still exist before accessing
        if (this.menubar.window && 
            this.menubar.window.webContents && 
            !this.menubar.window.webContents.isDevToolsOpened()) {
          this.menubar.hideWindow();
        }
      });

      // Save window size when resized
      this.menubar.window.on('resize', () => {
        if (this.menubar.window) {
          const [width, height] = this.menubar.window.getSize();
          console.log(`Window resized to: ${width}x${height}`);
          
          // Update settings with new size using convenience method
          this.settingsManager.updateWindowSize(width, height);
        }
      });
    });
  }

  private setupManagers(): void {
    // Initialize context menu manager after menubar is created
    this.contextMenuManager = new ContextMenuManager(this.menubar, () => this.quitApp());
    
    // Context menu only appears on right-click
    this.contextMenuManager.setupTrayContextMenu('right-only');
    
    // Shortcuts are registered in the 'ready' event handler
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
      }
    };
  }

  private registerDefaultShortcuts(): void {
    const callbacks = this.getShortcutCallbacks();

    // Set callbacks in IPC manager so it can re-register shortcuts when settings change
    this.ipcManager.setShortcutCallbacks(callbacks);
    
    // Load saved settings and apply them before registering shortcuts
    const savedSettings = this.settingsManager.getSettings();
    console.log('Loading saved settings on startup:', savedSettings);
    
    // Update shortcuts with saved values (or defaults if no saved settings exist)
    this.shortcutManager.updateShortcuts(savedSettings.shortcuts, callbacks);
    
    // Apply dock visibility setting on startup (macOS only)
    this.applyDockVisibility(savedSettings.showInDock);
    
    console.log('Shortcuts registered:', Array.from(this.shortcutManager.getShortcuts()));
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

  // Application menu is not needed for menubar apps
  // If you need a traditional app menu, add MenuManager back

  public setTrayClickBehavior(behavior: 'right-only' | 'left-and-right' | 'left-only'): void {
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
  if (menubarApp.getShortcutManager()) {
    menubarApp.getShortcutManager().unregisterShortcuts();
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