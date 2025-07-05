import { ipcMain, BrowserWindow, app } from 'electron';
import { SettingsManager } from './settingsManager';
import { ShortcutManager } from './shortcutManager';

export class IPCManager {
  private settingsManager: SettingsManager;
  private shortcutManager: ShortcutManager;
  private shortcutCallbacks: any = null;
  private quitCallback?: () => void;

  constructor(settingsManager: SettingsManager, shortcutManager: ShortcutManager, quitCallback?: () => void) {
    this.settingsManager = settingsManager;
    this.shortcutManager = shortcutManager;
    this.quitCallback = quitCallback;
    this.setupIPCHandlers();
  }

  // Set the callbacks for shortcuts (called from main process)
  setShortcutCallbacks(callbacks: any): void {
    this.shortcutCallbacks = callbacks;
  }

  // Update shortcuts from settings and re-register them
  private updateShortcutsFromSettings(shortcuts: any): void {
    if (!this.shortcutCallbacks) {
      console.warn('Shortcut callbacks not set, cannot update shortcuts');
      return;
    }

    // Update the shortcuts in the manager
    this.shortcutManager.updateShortcuts(shortcuts, this.shortcutCallbacks);
    console.log('Shortcuts updated from settings:', shortcuts);
  }

  private setupIPCHandlers(): void {
    // Settings IPC handlers
    ipcMain.handle('settings:get', async (event, key: string) => {
      return this.settingsManager.get(key);
    });

    ipcMain.handle('settings:set', async (event, key: string, value: any) => {
      return this.settingsManager.set(key, value);
    });

    ipcMain.handle('settings:setAll', async (event, settings: any) => {
      // Save all settings at once
      Object.entries(settings).forEach(([key, value]) => {
        this.settingsManager.set(key, value);
      });
      
      // If shortcuts were updated, re-register them
      if (settings.shortcuts) {
        this.updateShortcutsFromSettings(settings.shortcuts);
      }
      
      // Handle dock visibility (macOS only)
      if (process.platform === 'darwin' && typeof settings.showInDock === 'boolean') {
        this.handleDockVisibility(settings.showInDock);
      }
      
      return true;
    });

    ipcMain.handle('settings:getAll', async () => {
      return this.settingsManager.getAll();
    });

    // Shortcuts IPC handlers
    ipcMain.handle('shortcuts:get', async () => {
      const shortcuts = this.shortcutManager.getShortcuts();
      return Object.fromEntries(shortcuts);
    });

    ipcMain.handle('shortcuts:update', async (event, key: string, accelerator: string) => {
      this.shortcutManager.updateShortcut(key, accelerator);
      return true;
    });

    ipcMain.handle('shortcuts:unregister', async () => {
      this.shortcutManager.unregisterShortcuts();
      return true;
    });

    // App-level IPC handlers
    ipcMain.handle('app:minimize', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.minimize();
      }
    });

    ipcMain.handle('app:hide', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.hide();
      }
    });

    ipcMain.handle('app:close', async (event) => {
      // Use the proper quit callback if available
      if (this.quitCallback) {
        this.quitCallback();
      } else {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
          window.close();
        }
      }
    });

    // Platform info
    ipcMain.handle('app:getPlatform', async () => {
      return process.platform;
    });
  }

  // Method to add custom IPC handlers if needed
  addHandler(channel: string, handler: (event: any, ...args: any[]) => any): void {
    ipcMain.handle(channel, handler);
  }

  // Method to remove handlers
  removeHandler(channel: string): void {
    ipcMain.removeHandler(channel);
  }

  // Handle dock visibility (macOS only)
  private handleDockVisibility(showInDock: boolean): void {
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

  // Cleanup method
  cleanup(): void {
    ipcMain.removeAllListeners();
  }
} 